// ============================================================
// github-oauth — GitHub OAuth flow handler
// Actions: get_url, connect, get_token, disconnect
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const GITHUB_CLIENT_ID = Deno.env.get('GITHUB_CLIENT_ID') || '';
const GITHUB_CLIENT_SECRET = Deno.env.get('GITHUB_CLIENT_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ENCRYPTION_KEY = Deno.env.get('GITHUB_TOKEN_ENCRYPTION_KEY') || 'default-dev-key-change-in-production';

interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
}

// Simple XOR + base64 encryption (use pgcrypto in production)
function encrypt(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
  }
  return btoa(result);
}

function decrypt(encoded: string): string {
  const text = atob(encoded);
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
  }
  return result;
}

async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  return res.json();
}

async function getGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { action, code } = await req.json();

  // GET URL — return the GitHub OAuth URL
  if (action === 'get_url') {
    const redirectUri = `${SUPABASE_URL}/functions/v1/github-oauth`;
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user&state=${user.id}`;
    return new Response(JSON.stringify({ url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // CONNECT — exchange code for token, store encrypted
  if (action === 'connect') {
    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tokenResponse = await exchangeCode(code);
    if (!tokenResponse.access_token) {
      return new Response(JSON.stringify({ error: 'Failed to exchange code', details: tokenResponse }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ghUser = await getGitHubUser(tokenResponse.access_token);

    const { data: connection, error: upsertError } = await supabase
      .from('github_connections')
      .upsert({
        user_id: user.id,
        github_id: ghUser.id,
        github_login: ghUser.login,
        github_avatar_url: ghUser.avatar_url,
        github_url: ghUser.html_url,
        access_token: encrypt(tokenResponse.access_token),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (upsertError) {
      return new Response(JSON.stringify({ error: 'Failed to store connection' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ connection: { ...connection, access_token: undefined } }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // GET TOKEN — decrypt and return the token (only for server-side use)
  if (action === 'get_token') {
    const { data: conn, error: findError } = await supabase
      .from('github_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    if (findError || !conn) {
      return new Response(JSON.stringify({ token: null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ token: decrypt(conn.access_token) }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // DISCONNECT — remove the connection record
  if (action === 'disconnect') {
    await supabase.from('github_connections').delete().eq('user_id', user.id);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
});
