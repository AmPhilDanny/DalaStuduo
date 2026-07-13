import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FUNCTION_NAME = "send-email";

const TEMPLATES: Record<string, (vars: Record<string, string>) => { subject: string; html: string }> = {
  welcome_email: (v) => ({
    subject: `Welcome to Dala, ${v.name || "there"}!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#7c3aed;">Welcome to Dala!</h1>
        <p>Hi ${v.name || "there"},</p>
        <p>We're excited to have you on board. Dala connects you with opportunities in tech, talent, and beyond.</p>
        ${v.link ? `<p><a href="${v.link}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:6px;">Get Started</a></p>` : ""}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#6b7280;font-size:14px;">© ${new Date().getFullYear()} Dala. All rights reserved.</p>
      </div>`,
  }),
  job_application: (v) => ({
    subject: `New Application Received — ${v.job_title || "Job"}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#7c3aed;">New Application</h1>
        <p><strong>${v.applicant_name || "Someone"}</strong> applied for <strong>${v.job_title || "your job"}</strong>.</p>
        ${v.link ? `<p><a href="${v.link}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:6px;">Review Application</a></p>` : ""}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#6b7280;font-size:14px;">© ${new Date().getFullYear()} Dala. All rights reserved.</p>
      </div>`,
  }),
  order_confirmation: (v) => ({
    subject: `Order Confirmed — ${v.order_id || ""}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#7c3aed;">Order Confirmed!</h1>
        <p>Your order <strong>${v.order_id || ""}</strong> has been confirmed.</p>
        <p>Amount: <strong>${v.amount || "—"}</strong></p>
        ${v.link ? `<p><a href="${v.link}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:6px;">View Order</a></p>` : ""}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#6b7280;font-size:14px;">© ${new Date().getFullYear()} Dala. All rights reserved.</p>
      </div>`,
  }),
  password_reset: (v) => ({
    subject: "Reset Your Password",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#7c3aed;">Reset Your Password</h1>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        ${v.link ? `<p><a href="${v.link}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>` : ""}
        <p style="color:#6b7280;font-size:14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#6b7280;font-size:14px;">© ${new Date().getFullYear()} Dala. All rights reserved.</p>
      </div>`,
  }),
};

function parseUrl(req: Request): URL {
  return new URL(req.url);
}

function subPath(pathname: string): string {
  const idx = pathname.indexOf("/" + FUNCTION_NAME);
  if (idx >= 0) return pathname.substring(idx + FUNCTION_NAME.length + 1).replace(/\/$/, "") || "/";
  return pathname.replace(/\/$/, "") || "/";
}

function renderTemplate(templateName: string, vars: Record<string, string>): { subject: string; html: string } {
  const renderFn = TEMPLATES[templateName];
  if (renderFn) return renderFn(vars);
  return { subject: vars.subject || "", html: vars.html || "" };
}

async function handleReq(req: Request): Promise<Response> {
  const url = parseUrl(req);
  const pathname = subPath(url.pathname);
  const method = req.method;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (method !== "POST" || pathname !== "/") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { to, subject, html, template_name, cc, bcc, ...rest } = body;

    if (!to) {
      return new Response(JSON.stringify({ error: "Missing required field: to" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emailSubject = subject;
    let emailHtml = html;

    if (template_name) {
      const rendered = renderTemplate(template_name, { ...rest, subject, html });
      emailSubject = rendered.subject;
      emailHtml = rendered.html;
    }

    if (!emailSubject || !emailHtml) {
      return new Response(JSON.stringify({ error: "Missing subject or html content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendPayload: Record<string, unknown> = {
      from: "Dala <noreply@trydala.com>",
      to: Array.isArray(to) ? to : [to],
      subject: emailSubject,
      html: emailHtml,
    };
    if (cc) resendPayload.cc = Array.isArray(cc) ? cc : [cc];
    if (bcc) resendPayload.bcc = Array.isArray(bcc) ? bcc : [bcc];

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend API error:", resendData);
      return new Response(JSON.stringify({ error: "Failed to send email", details: resendData }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

Deno.serve(handleReq);
