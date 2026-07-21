// ============================================================
// SkillBridge Africa: AI Assist Edge Function
// Modes: cv_revamp | cover_letter | skill_gap | project_polish
//        | tutor_chat | tutor_reflect | tutor_quiz | tutor_grade
//
// PROVIDER FACTORY (VCC-style, configurable via env vars):
//   AI_PROVIDER=openrouter  → OpenRouter (Gemini, Claude, GPT, Llama, etc.)
//   AI_PROVIDER=mistral     → Mistral AI (mistral-large, mistral-medium, etc.)
//   AI_PROVIDER=openai      → OpenAI (GPT-4o, GPT-4o-mini, etc.)
//   AI_PROVIDER=groq        → Groq (Llama 3, Mixtral, etc.)
//   AI_PROVIDER=google      → Google Gemini (gemini-2.0-flash, etc.)
//   AI_PROVIDER=togetherai  → Together AI (Llama, Mistral, etc.)
//
// API keys live ONLY on the server — never in frontend code.
//
// Deploy:  supabase functions deploy ai-assist
// Secrets:
//   supabase secrets set AI_PROVIDER=openrouter
//   supabase secrets set OPENROUTER_API_KEY=sk-or-...
//   supabase secrets set MISTRAL_API_KEY=...
//   supabase secrets set OPENAI_API_KEY=sk-...
//   supabase secrets set GROQ_API_KEY=gsk_...
//   supabase secrets set GOOGLE_API_KEY=...
//   supabase secrets set TOGETHER_API_KEY=...
// ============================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Provider Configuration ──
type AiProvider = "openrouter" | "mistral" | "openai" | "groq" | "google" | "togetherai";

interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  label: string;
}

const ACTIVE_PROVIDER = (Deno.env.get("AI_PROVIDER") || "openrouter") as AiProvider;

// ── Helper: read API keys from site_settings DB (admin-set via dashboard) ──
// Two possible storage formats:
//   NEW (server POST /ai/keys):   key='ai_api_keys', value={ openrouter: "sk-...", ... }
//   OLD (direct Supabase insert):  key='ai_openrouter_key', value={ api_key: "sk-..." }
async function loadDbApiKeys(): Promise<Partial<Record<AiProvider, string>>> {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) return {};

  try {
    const svc = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    // Try NEW format first: single row key='ai_api_keys'
    const { data: newRow } = await svc.from("site_settings").select("value").eq("key", "ai_api_keys").maybeSingle();
    if (newRow?.value && typeof newRow.value === "object") {
      const keys = newRow.value as Partial<Record<AiProvider, string>>;
      // Check if at least one provider has a key
      if (Object.values(keys).some((v) => typeof v === "string" && v.length > 0)) {
        return keys;
      }
    }

    // Fallback to OLD format: individual rows key='ai_{provider}_key', value={ api_key: "..." }
    const OLD_KEY_MAP: Record<string, AiProvider> = {
      ai_openrouter_key: "openrouter",
      ai_mistral_key: "mistral",
      ai_openai_key: "openai",
      ai_groq_key: "groq",
      ai_google_key: "google",
      ai_togetherai_key: "togetherai",
    };
    const { data: oldRows } = await svc
      .from("site_settings")
      .select("key, value")
      .in("key", Object.keys(OLD_KEY_MAP));
    if (oldRows) {
      const result: Partial<Record<AiProvider, string>> = {};
      for (const row of oldRows) {
        const provider = OLD_KEY_MAP[row.key];
        if (provider && row.value?.api_key) {
          result[provider] = String(row.value.api_key);
        }
      }
      if (Object.keys(result).length > 0) return result;
    }

    return {};
  } catch {
    return {};
  }
}

const DB_API_KEYS = await loadDbApiKeys();

const PROVIDERS: Record<AiProvider, ProviderConfig> = {
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: DB_API_KEYS.openrouter || Deno.env.get("OPENROUTER_API_KEY") || "",
    defaultModel: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.0-flash-001",
    label: "OpenRouter",
  },
  mistral: {
    baseUrl: "https://api.mistral.ai/v1",
    apiKey: DB_API_KEYS.mistral || Deno.env.get("MISTRAL_API_KEY") || "",
    defaultModel: Deno.env.get("MISTRAL_MODEL") || "mistral-large-latest",
    label: "Mistral AI",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    apiKey: DB_API_KEYS.openai || Deno.env.get("OPENAI_API_KEY") || "",
    defaultModel: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
    label: "OpenAI",
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: DB_API_KEYS.groq || Deno.env.get("GROQ_API_KEY") || "",
    defaultModel: Deno.env.get("GROQ_MODEL") || "llama-3.3-70b-versatile",
    label: "Groq",
  },
  google: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKey: DB_API_KEYS.google || Deno.env.get("GOOGLE_API_KEY") || "",
    defaultModel: Deno.env.get("GOOGLE_MODEL") || "gemini-2.0-flash",
    label: "Google Gemini",
  },
  togetherai: {
    baseUrl: "https://api.together.xyz/v1",
    apiKey: DB_API_KEYS.togetherai || Deno.env.get("TOGETHER_API_KEY") || "",
    defaultModel: Deno.env.get("TOGETHER_MODEL") || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    label: "Together AI",
  },
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const PROVIDER_KEY_MAP: Record<AiProvider, string> = {
  openrouter: "OPENROUTER_API_KEY",
  mistral: "MISTRAL_API_KEY",
  openai: "OPENAI_API_KEY",
  groq: "GROQ_API_KEY",
  google: "GOOGLE_API_KEY",
  togetherai: "TOGETHER_API_KEY",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Mode = "cv_revamp" | "cover_letter" | "skill_gap" | "project_polish" | "tutor_chat" | "tutor_reflect" | "tutor_quiz" | "tutor_grade" | "admin_metric_insight" | "admin_user_summary" | "admin_service_description";

interface RequestBody {
  mode: Mode;
  // cv_revamp
  bio?: string;
  headline?: string;
  skills?: string[];
  // cover_letter
  jobTitle?: string;
  jobDescription?: string;
  applicantSummary?: string;
  // skill_gap
  currentSkills?: string[];
  targetSkills?: string[];
  targetTitle?: string;
  // project_polish
  rawDescription?: string;
  // tutor_chat / tutor_reflect / tutor_quiz / tutor_grade
  topic?: string;
  knowledgeContent?: string;
  messages?: Array<{ role: string; content: string }>;
  studentStrengths?: string[];
  studentWeaknesses?: string[];
  questions?: Array<{ question: string; options: string[]; correctIndex: number }>;
  answers?: number[];
}

function buildPrompt(body: RequestBody): string {
  switch (body.mode) {
    case "cv_revamp":
      return `You are a career coach helping an African tech professional present themselves well to employers and collaborators.

Rewrite the following into a punchy, confident, ONE-paragraph professional headline+bio (max 60 words). Do not invent skills or experience that isn't implied. Keep it factual, specific, and free of generic buzzwords like "passionate" or "hardworking".

Current headline: ${body.headline || "(none provided)"}
Current bio: ${body.bio || "(none provided)"}
Listed skills: ${(body.skills || []).join(", ") || "(none provided)"}

Return ONLY the rewritten bio text, nothing else — no preamble, no quotation marks.`;

    case "cover_letter":
      return `You are helping a candidate write a short, tailored application message.

Job title: ${body.jobTitle || "(untitled role)"}
Job description: ${body.jobDescription || "(no description provided)"}
Candidate summary: ${body.applicantSummary || "(no profile summary provided)"}

Write a concise, specific application message (120-180 words) that connects the candidate's background to this exact role. No generic filler ("I am writing to express my interest..."). Open with the strongest, most relevant point. End with a clear, confident closing line. Return ONLY the message text, nothing else.`;

    case "skill_gap":
      return `You are a technical mentor. Compare what this person already knows against what a role/project requires.

Current skills: ${(body.currentSkills || []).join(", ") || "(none listed)"}
Target role/skills needed: ${(body.targetSkills || []).join(", ") || body.targetTitle || "(not specified)"}

Return a short, honest gap analysis as plain text with two sections:
1. "Already strong in:" — 2-4 bullet points of overlapping strengths, phrased specifically.
2. "Worth learning next:" — 2-4 bullet points naming a specific concept, tool, or skill to learn (no invented course names, no fake links — just the concept/skill itself and why it matters for this target).
Keep the whole thing under 120 words. Return ONLY this text, no preamble.`;

    case "project_polish":
      return `You are helping a project owner write a clear, appealing project pitch to attract collaborators.

Raw draft: ${body.rawDescription || "(no draft provided)"}

Rewrite this into a tight, specific project description (80-140 words) that clearly states: what is being built, who it's for, and what kind of collaborator is needed. No hype language, no emoji. Return ONLY the rewritten description, nothing else.`;

    case "admin_metric_insight":
      return `You are an analytics assistant for SkillBridge Africa, an African tech talent platform. Given the platform metrics below, write a brief, insightful commentary (2-4 sentences). Highlight what's going well, what needs attention, and one actionable suggestion. Be specific — use the actual numbers. No fluff.

Metrics:
- Total users: ${body.bio || "0"}
- Total orders: ${body.jobTitle || "0"}
- Completed orders: ${body.jobDescription || "0"}
- Total revenue: ${body.applicantSummary || "0"}
- Pending payouts: (unknown)
- Open disputes: (unknown)

Write in a professional, data-driven tone. Return ONLY the commentary text, nothing else.`;

    case "admin_user_summary":
      return `You are an admin assistant for SkillBridge Africa. Summarize this user's profile and platform activity in 2-3 concise sentences. Highlight their role, key skills, engagement level, and any flags worth noting.

Profile:
- Name: ${body.bio || "Unknown"}
- Role: ${body.jobTitle || "Unknown"}
- Headline: ${body.jobDescription || "N/A"}
- Skills: ${(body.currentSkills || []).join(", ") || "None listed"}
- Target/context: ${body.targetTitle || "N/A"}

Return ONLY the summary text, nothing else.`;

    case "admin_service_description":
      return `You are helping SkillBridge Africa generate a clear service offering description. Given the service name and category, write a compelling description (40-80 words) that explains what the service is and who it's for. Be specific, avoid hype, no emoji.

Service name: ${body.bio || "Unknown service"}
Category: ${body.jobTitle || "General"}
${body.rawDescription ? `Current draft: ${body.rawDescription}` : ""}

Return ONLY the description text, nothing else.`;

    case "tutor_chat":
      return ""; // handled by handleTutorChat, not buildPrompt
    case "tutor_reflect":
      return ""; // handled by handleTutorReflect, not buildPrompt
    case "tutor_quiz":
      return ""; // handled by handleTutorQuiz, not buildPrompt
    case "tutor_grade":
      return ""; // handled by handleTutorGrade, not buildPrompt

    default:
      throw new Error(`Unknown mode: ${body.mode}`);
  }
}

/** Call the active AI provider (OpenRouter or Mistral) with an OpenAI-compatible chat completions request. */
async function callAiProvider(prompt: string): Promise<string> {
  const provider = PROVIDERS[ACTIVE_PROVIDER];

  if (!provider.apiKey) {
    throw new Error(
      `AI provider "${ACTIVE_PROVIDER}" is not configured. Set ${PROVIDER_KEY_MAP[ACTIVE_PROVIDER]} via supabase secrets.`
    );
  }

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.defaultModel,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`${provider.label} API error:`, errText);
    throw new Error(`AI request failed (${provider.label}): ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

/** Chat with the AI provider using conversation history (for tutor_chat mode). */
async function chatAiProvider(messages: Array<{ role: string; content: string }>): Promise<string> {
  const provider = PROVIDERS[ACTIVE_PROVIDER];

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.defaultModel,
      max_tokens: 800,
      messages: messages as Array<{ role: "user" | "assistant" | "system"; content: string }>,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`${provider.label} chat error:`, errText);
    throw new Error(`AI chat failed (${provider.label}): ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}


async function handleTutorChat(body: RequestBody): Promise<string> {
  const systemMessage = `You are an AI tutor for SkillBridge Africa, helping African tech students learn and grow.

Teaching style: Socratic — guide the student to discover answers themselves. Be encouraging, specific, and concrete. Use analogies relevant to the African tech ecosystem (FinTech, Agritech, HealthTech, EdTech, logistics, remote work).

Rules:
- Never do the student's work for them. Show examples, but let them write the code/solution.
- If they're stuck, break the problem into smaller steps.
- Praise specific things they get right.
- When they make a mistake, point it out constructively and ask what they think the fix should be.
- Keep responses under 200 words — short, focused lessons stick better.
- Reference the provided knowledge base content when relevant.

Knowledge base content:
${body.knowledgeContent || "(No specific knowledge base provided — tutor from your general expertise.)"}

Student profile:
- Topic: ${body.topic || "general"}
- Known strengths: ${(body.studentStrengths || []).join(", ") || "none noted yet"}
- Areas to work on: ${(body.studentWeaknesses || []).join(", ") || "none noted yet"}`;

  const messages = [
    { role: "system", content: systemMessage },
    ...(body.messages || []).map((m) => ({
      role: m.role === "tutor" ? "assistant" : m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  return await chatAiProvider(messages);
}

async function handleTutorReflect(body: RequestBody): Promise<string> {
  const conversation = (body.messages || [])
    .map((m) => `${m.role === "student" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n\n");

  const prompt = `You are an AI tutor reflecting on a tutoring session to improve future interactions.

Analyze this conversation and extract:

1. LEARNING INSIGHTS: What concepts did the student grasp? What are they still struggling with?
2. ENGAGEMENT: Was the student engaged? Any signs of confusion or frustration?
3. ADAPTATION: How should you adjust your teaching approach for this student going forward?
4. KEY MISTAKES: List 1-3 specific errors or misconceptions the student showed.
5. NEXT STEPS: Suggest 2-3 concrete topics or exercises for the next session.

Keep each section to 1-2 sentences. Be specific — reference actual things the student said.

Session topic: ${body.topic || "general"}
Student strengths: ${(body.studentStrengths || []).join(", ") || "unknown"}
Student weaknesses: ${(body.studentWeaknesses || []).join(", ") || "unknown"}

Conversation:
${conversation || "(No conversation provided — session just started.)"}

Return a plain-text reflection with the 5 sections labeled clearly.`;

  return await callAiProvider(prompt);
}

async function handleTutorQuiz(body: RequestBody): Promise<string> {
  const prompt = `You are an AI tutor creating a short assessment for a student.

Topic: ${body.topic || "general"}
${body.knowledgeContent ? `Reference content:\n${body.knowledgeContent}` : ""}

Generate a 5-question multiple-choice quiz to test understanding of this topic.

Rules:
- Each question must have exactly 4 options (A, B, C, D).
- Only one correct answer per question.
- Questions should test understanding, not memorization — use "why" and "what if" scenarios.
- Difficulty: mix of easy (2), medium (2), and challenging (1).

Return a valid JSON array (no markdown, no wrap) where each item has:
  { "question": "string", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correctIndex": number }

Example:
[{"question":"What is the difference between let and const in JavaScript?","options":["A. let can be reassigned, const cannot","B. const can be reassigned, let cannot","C. They are the same","D. let is block-scoped, const is function-scoped"],"correctIndex":0}]`;

  return await callAiProvider(prompt);
}

async function handleTutorGrade(body: RequestBody): Promise<string> {
  if (!body.questions || !body.answers) {
    throw new Error("tutor_grade requires 'questions' and 'answers' fields");
  }

  let correctCount = 0;
  const results = body.questions.map((q, i) => {
    const studentAnswer = body.answers![i];
    const isCorrect = studentAnswer === q.correctIndex;
    if (isCorrect) correctCount++;
    return {
      question: q.question,
      correct: isCorrect,
      correctAnswer: q.options[q.correctIndex],
      studentAnswer: q.options[studentAnswer] || "unanswered",
    };
  });

  const score = Math.round((correctCount / body.questions.length) * 100);

  const prompt = `You are a supportive tutor grading a student's quiz.

Score: ${correctCount}/${body.questions.length} (${score}%)

Results:
${results.map((r, i) => `${i + 1}. ${r.correct ? "✓" : "✗"} ${r.question}
   Your answer: ${r.studentAnswer}
   Correct answer: ${r.correctAnswer}`).join("\n")}

Write encouraging, specific feedback (80-120 words):
1. What the student did well (reference specific questions).
2. Which areas need review (reference specific questions they got wrong).
3. A concrete suggestion for improvement.
4. An encouraging closing line.

Return ONLY the feedback text, nothing else.`;

  const feedback = await callAiProvider(prompt);

  return JSON.stringify({ score, correctCount, total: body.questions.length, feedback });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const provider = PROVIDERS[ACTIVE_PROVIDER];
    if (!provider.apiKey) {
      const keyName = PROVIDER_KEY_MAP[ACTIVE_PROVIDER];
      return new Response(
        JSON.stringify({ error: `AI provider "${ACTIVE_PROVIDER}" is not configured. Set ${keyName} via: supabase secrets set ${keyName}=...` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Require a logged-in Supabase user — no anonymous AI usage
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

    const body: RequestBody = await req.json();
    if (!body.mode) {
      return new Response(JSON.stringify({ error: "Missing 'mode'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tutorModes = ["tutor_chat", "tutor_reflect", "tutor_quiz", "tutor_grade"] as const;
    if (tutorModes.includes(body.mode as typeof tutorModes[number])) {
      let resultText: string;
      switch (body.mode) {
        case "tutor_chat":
          resultText = await handleTutorChat(body);
          break;
        case "tutor_reflect":
          resultText = await handleTutorReflect(body);
          break;
        case "tutor_quiz":
          resultText = await handleTutorQuiz(body);
          break;
        case "tutor_grade":
          resultText = await handleTutorGrade(body);
          break;
      }
      return new Response(JSON.stringify(
        body.mode === "tutor_grade" ? JSON.parse(resultText) : { result: resultText }
      ), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(body);
    const resultText = await callAiProvider(prompt);

    return new Response(JSON.stringify({ result: resultText }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error(`ai-assist (${ACTIVE_PROVIDER}) error:`, message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
