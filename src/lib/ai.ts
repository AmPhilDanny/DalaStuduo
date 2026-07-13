import { aiApi } from '@/lib/api-client';

export type AIMode = 'cv_revamp' | 'cover_letter' | 'skill_gap' | 'project_polish';

interface AIAssistPayload {
  mode: AIMode;
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
}

export type TutorMode = 'tutor_chat' | 'tutor_reflect' | 'tutor_quiz' | 'tutor_grade';

export interface TutorMessage {
  role: 'student' | 'tutor' | 'system';
  content: string;
}

export interface TutorQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TutorQuizResult {
  score: number;
  correctCount: number;
  total: number;
  feedback: string;
}

interface TutorChatPayload {
  mode: 'tutor_chat';
  topic?: string;
  knowledgeContent?: string;
  messages: TutorMessage[];
  studentStrengths?: string[];
  studentWeaknesses?: string[];
}

interface TutorReflectPayload {
  mode: 'tutor_reflect';
  topic?: string;
  messages: TutorMessage[];
  studentStrengths?: string[];
  studentWeaknesses?: string[];
}

interface TutorQuizPayload {
  mode: 'tutor_quiz';
  topic: string;
  knowledgeContent?: string;
}

interface TutorGradePayload {
  mode: 'tutor_grade';
  questions: TutorQuestion[];
  answers: number[];
}

type TutorPayload = TutorChatPayload | TutorReflectPayload | TutorQuizPayload | TutorGradePayload;

export interface TutorSession {
  id: string;
  student_id: string;
  title: string;
  topic: string | null;
  knowledge_base_id: string | null;
  status: 'active' | 'paused' | 'completed';
  learning_style: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  engagement_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseEntry {
  id: string;
  owner_id: string;
  title: string;
  content: string;
  source_type: 'manual' | 'file' | 'url' | 'paste';
  tags: string[];
  created_at: string;
  updated_at: string;
}

export async function callAIAssist(payload: AIAssistPayload): Promise<string> {
  const res = await aiApi.assist(payload);
  return res.data?.result || '';
}

export async function callTutorAI(payload: TutorPayload): Promise<string | TutorQuizResult> {
  const res = await aiApi.assist(payload);
  if (payload.mode === 'tutor_grade') {
    return res.data as TutorQuizResult;
  }
  return res.data?.result || '';
}
