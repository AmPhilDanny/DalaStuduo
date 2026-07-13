import { Router, Request, Response } from 'express';
import { adminClient } from '../../lib/supabase-admin.js';
import { AppError } from '../../middleware/error.js';

export const aiRouter: Router = Router();

// ── Provider Configuration ──
type AiProvider = 'openrouter' | 'mistral' | 'openai' | 'groq' | 'google' | 'togetherai';

interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  label: string;
}

const ACTIVE_PROVIDER = (process.env.AI_PROVIDER || 'openrouter') as AiProvider;

const PROVIDER_KEY_MAP: Record<AiProvider, string> = {
  openrouter: 'OPENROUTER_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  openai: 'OPENAI_API_KEY',
  groq: 'GROQ_API_KEY',
  google: 'GOOGLE_API_KEY',
  togetherai: 'TOGETHER_API_KEY',
};

function getProviders(): Record<AiProvider, ProviderConfig> {
  return {
    openrouter: {
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      defaultModel: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
      label: 'OpenRouter',
    },
    mistral: {
      baseUrl: 'https://api.mistral.ai/v1',
      apiKey: process.env.MISTRAL_API_KEY || '',
      defaultModel: process.env.MISTRAL_MODEL || 'mistral-large-latest',
      label: 'Mistral AI',
    },
    openai: {
      baseUrl: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
      defaultModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      label: 'OpenAI',
    },
    groq: {
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY || '',
      defaultModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      label: 'Groq',
    },
    google: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: process.env.GOOGLE_API_KEY || '',
      defaultModel: process.env.GOOGLE_MODEL || 'gemini-2.0-flash',
      label: 'Google Gemini',
    },
    togetherai: {
      baseUrl: 'https://api.together.xyz/v1',
      apiKey: process.env.TOGETHER_API_KEY || '',
      defaultModel: process.env.TOGETHER_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      label: 'Together AI',
    },
  };
}

type Mode = 'cv_revamp' | 'cover_letter' | 'skill_gap' | 'project_polish' | 'tutor_chat' | 'tutor_reflect' | 'tutor_quiz' | 'tutor_grade' | 'admin_metric_insight' | 'admin_user_summary' | 'admin_service_description';

interface RequestBody {
  mode: Mode;
  bio?: string;
  headline?: string;
  skills?: string[];
  jobTitle?: string;
  jobDescription?: string;
  applicantSummary?: string;
  currentSkills?: string[];
  targetSkills?: string[];
  targetTitle?: string;
  rawDescription?: string;
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
    case 'cv_revamp':
      return `You are a career coach helping an African tech professional present themselves well.
Rewrite the following into a punchy, confident, ONE-paragraph professional headline+bio (max 60 words). Keep it factual and specific.
Current headline: ${body.headline || '(none)'}
Current bio: ${body.bio || '(none)'}
Listed skills: ${(body.skills || []).join(', ') || '(none)'}
Return ONLY the rewritten bio text, nothing else.`;
    case 'cover_letter':
      return `Write a concise application message (120-180 words) connecting the candidate's background to this role.
Job title: ${body.jobTitle || '(untitled)'}
Job description: ${body.jobDescription || '(none)'}
Candidate summary: ${body.applicantSummary || '(none)'}
Return ONLY the message text.`;
    case 'skill_gap':
      return `Compare current skills against target requirements. Return as:
"Already strong in:" (2-4 bullets)
"Worth learning next:" (2-4 bullets)
Current skills: ${(body.currentSkills || []).join(', ') || '(none)'}
Target: ${(body.targetSkills || []).join(', ') || body.targetTitle || '(not specified)'}
Keep under 120 words. Return ONLY the text.`;
    case 'project_polish':
      return `Rewrite this project description (80-140 words) clearly stating what's being built, who it's for, and what collaborator is needed.
Draft: ${body.rawDescription || '(none)'}
Return ONLY the rewritten description.`;
    case 'admin_metric_insight':
      return `Write a brief insight (2-4 sentences) on these platform metrics.
Total users: ${body.bio || '0'}
Total orders: ${body.jobTitle || '0'}
Completed: ${body.jobDescription || '0'}
Revenue: ${body.applicantSummary || '0'}
Return ONLY the commentary.`;
    case 'admin_user_summary':
      return `Summarize this user in 2-3 sentences.
Name: ${body.bio || 'Unknown'}
Role: ${body.jobTitle || 'Unknown'}
Headline: ${body.jobDescription || 'N/A'}
Skills: ${(body.currentSkills || []).join(', ') || 'None'}
Return ONLY the summary.`;
    case 'admin_service_description':
      return `Write a compelling description (40-80 words) for this service.
Service: ${body.bio || 'Unknown'}
Category: ${body.jobTitle || 'General'}
Return ONLY the description.`;
    default:
      return '';
  }
}

async function callAiProvider(prompt: string): Promise<string> {
  const providers = getProviders();
  const provider = providers[ACTIVE_PROVIDER];
  if (!provider.apiKey) {
    throw new AppError(500, `AI provider "${ACTIVE_PROVIDER}" not configured. Set ${PROVIDER_KEY_MAP[ACTIVE_PROVIDER]}`);
  }

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({ model: provider.defaultModel, max_tokens: 500, messages: [{ role: 'user', content: prompt }] }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new AppError(502, `AI request failed (${provider.label}): ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function chatAiProvider(messages: Array<{ role: string; content: string }>): Promise<string> {
  const providers = getProviders();
  const provider = providers[ACTIVE_PROVIDER];

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({
      model: provider.defaultModel,
      max_tokens: 800,
      messages: messages as any,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new AppError(502, `AI chat failed (${provider.label}): ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function handleTutorChat(body: RequestBody): Promise<string> {
  const systemMessage = `You are an AI tutor for SkillBridge Africa, helping African tech students learn.
Teaching style: Socratic — guide the student to discover answers. Be encouraging, specific, and concrete.
Rules:
- Never do the student's work for them.
- Break problems into smaller steps.
- Praise specific things they get right.
- Keep responses under 200 words.
${body.knowledgeContent ? `Knowledge base:\n${body.knowledgeContent}` : ''}
Topic: ${body.topic || 'general'}
Strengths: ${(body.studentStrengths || []).join(', ') || 'none'}
Weaknesses: ${(body.studentWeaknesses || []).join(', ') || 'none'}`;

  const messages = [
    { role: 'system', content: systemMessage },
    ...(body.messages || []).map((m) => ({
      role: m.role === 'tutor' ? 'assistant' : (m.role as 'user' | 'assistant'),
      content: m.content,
    })),
  ];
  return await chatAiProvider(messages);
}

async function handleTutorReflect(body: RequestBody): Promise<string> {
  const conversation = (body.messages || []).map((m) => `${m.role === 'student' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n\n');
  return await callAiProvider(`Analyze this tutoring session and extract: 1. LEARNING INSIGHTS 2. ENGAGEMENT 3. ADAPTATION 4. KEY MISTAKES 5. NEXT STEPS. Keep each section to 1-2 sentences.
Topic: ${body.topic || 'general'}
Conversation:\n${conversation || '(No conversation)'}`);
}

async function handleTutorQuiz(body: RequestBody): Promise<string> {
  return await callAiProvider(`Generate a 5-question multiple-choice quiz on "${body.topic || 'general'}".
Rules: 4 options per question (A-D), one correct answer, mix of easy/medium/challenging.
Return valid JSON array: [{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctIndex":0}]`);
}

async function handleTutorGrade(body: RequestBody): Promise<string> {
  if (!body.questions || !body.answers) throw new AppError(400, "tutor_grade requires 'questions' and 'answers'");

  let correctCount = 0;
  const results = body.questions.map((q, i) => {
    const studentAnswer = body.answers![i];
    const isCorrect = studentAnswer === q.correctIndex;
    if (isCorrect) correctCount++;
    return { question: q.question, correct: isCorrect, correctAnswer: q.options[q.correctIndex], studentAnswer: q.options[studentAnswer] || 'unanswered' };
  });

  const score = Math.round((correctCount / body.questions.length) * 100);
  return JSON.stringify({ score, correctCount, total: body.questions.length, results });
}

// ── POST /ai — main AI assist handler ──
aiRouter.post('/', async (req: Request, res: Response) => {
  const providers = getProviders();
  const provider = providers[ACTIVE_PROVIDER];
  if (!provider.apiKey) {
    throw new AppError(500, `AI provider "${ACTIVE_PROVIDER}" not configured. Set ${PROVIDER_KEY_MAP[ACTIVE_PROVIDER]}`);
  }

  const body: RequestBody = req.body;
  if (!body.mode) throw new AppError(400, "Missing 'mode'");

  const tutorModes = ['tutor_chat', 'tutor_reflect', 'tutor_quiz', 'tutor_grade'];
  if (tutorModes.includes(body.mode)) {
    let resultText: string;
    switch (body.mode) {
      case 'tutor_chat': resultText = await handleTutorChat(body); break;
      case 'tutor_reflect': resultText = await handleTutorReflect(body); break;
      case 'tutor_quiz': resultText = await handleTutorQuiz(body); break;
      case 'tutor_grade': resultText = await handleTutorGrade(body); break;
      default: throw new Error('Unknown tutor mode');
    }
    return res.json(body.mode === 'tutor_grade' ? JSON.parse(resultText) : { result: resultText });
  }

  const prompt = buildPrompt(body);
  const resultText = await callAiProvider(prompt);
  res.json({ result: resultText });
});
