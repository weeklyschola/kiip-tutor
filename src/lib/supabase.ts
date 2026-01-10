import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to get Supabase Client (Anon)
export function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase URL or Anon Key is missing");
        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey);
}

// Helper to get Supabase Admin Client (Service Role)
export function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Supabase URL or Service Role Key is missing");
        return null;
    }

    return createClient(supabaseUrl, supabaseServiceKey);
}

// Default export for client-side usage (keep for backward compatibility if needed, but prefer getSupabase for consistency on server)
export const supabase = getSupabase();

// Types
export interface Question {
    id: number;
    level: number; // 0-5 단계
    question_text: string;
    options: string[];
    correct_answer: number; // 0-3 (보기 인덱스)
    explanation: string;
    category: string;
}

export interface CbtAttempt {
    id?: number;
    user_id: string; // UUID (익명)
    question_id: number;
    selected_answer: number;
    is_correct: boolean;
    time_spent: number; // 초
    created_at?: string;
}

// 사용자 UUID 생성/가져오기 (익명화)
export function getUserId(): string {
    if (typeof window === 'undefined') return '';

    let userId = localStorage.getItem('kiip_user_id');
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('kiip_user_id', userId);
    }
    return userId;
}

// 문제 가져오기
export async function getQuestions(level?: number, limit = 20) {
    if (!supabase) return [];
    let query = supabase.from('questions').select('*');

    if (level !== undefined) {
        query = query.eq('level', level);
    }

    const { data, error } = await query.limit(limit).order('id');

    if (error) {
        console.error('Error fetching questions:', error);
        return [];
    }

    return data as Question[];
}

// 응답 저장
export async function saveAttempt(attempt: CbtAttempt) {
    if (!supabase) return false;
    const { error } = await supabase.from('cbt_attempts').insert(attempt);

    if (error) {
        console.error('Error saving attempt:', error);
        return false;
    }

    return true;
}

// 전체 오답률 가져오기
export async function getWrongRates() {
    if (!supabase) return {};
    const { data, error } = await supabase
        .from('cbt_attempts')
        .select('question_id, is_correct');

    if (error || !data) return {};

    const stats: Record<number, { total: number; wrong: number }> = {};

    data.forEach((attempt) => {
        if (!stats[attempt.question_id]) {
            stats[attempt.question_id] = { total: 0, wrong: 0 };
        }
        stats[attempt.question_id].total++;
        if (!attempt.is_correct) {
            stats[attempt.question_id].wrong++;
        }
    });

    const rates: Record<number, number> = {};
    Object.entries(stats).forEach(([qId, stat]) => {
        rates[Number(qId)] = Math.round((stat.wrong / stat.total) * 100);
    });

    return rates;
}

// 단어장 타입
export interface VocabularyItem {
    id: number;
    level: number;
    word: string;
    meaning: string;
    pronunciation?: string;
    examples: string[];
    topic: string;
}

// 단어 가져오기
export async function getVocabulary(level?: number, topic?: string): Promise<VocabularyItem[]> {
    if (!supabase) return [];
    let query = supabase.from('vocabulary').select('*');

    if (level !== undefined) {
        query = query.eq('level', level);
    }
    if (topic) {
        query = query.eq('topic', topic);
    }

    const { data, error } = await query.order('id');

    if (error) {
        console.error('Error fetching vocabulary:', error);
        return [];
    }

    return data as VocabularyItem[];
}

// 특정 레벨의 주제 목록 가져오기
export async function getVocabularyTopics(level: number): Promise<string[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('vocabulary')
        .select('topic')
        .eq('level', level);

    if (error || !data) return [];

    // 중복 제거
    const topics = Array.from(new Set(data.map(item => item.topic)));
    return topics;
}

