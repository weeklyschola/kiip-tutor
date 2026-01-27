import { createClient } from '@/lib/supabase/client';

// Use the new secure client helper
export const supabase = createClient();

// Re-export specific helpers if needed, but primarily usage should switch to importing from @/lib/supabase/client or server
export function getSupabase() {
    return supabase;
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Deprecated: Admin client should only be used in secure server contexts (e.g. API routes, Server Actions)
// We will remove manual admin key usage here to prevent accidental client-side exposure.
// If you need admin access, use createClient (server) with service role key in a Server Component/API.
export function getSupabaseAdmin() {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("SUPABASE_SERVICE_ROLE_KEY is missing");
        return null;
    }
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

// Types
export interface Question {
    id: number;
    level: number;
    question_text: string;
    options: string[];
    correct_answer: number;
    explanation: string;
    category: string;
}

export interface CbtAttempt {
    id?: number;
    user_id: string;
    question_id: number;
    selected_answer: number;
    is_correct: boolean;
    time_spent: number;
    created_at?: string;
}

export interface VocabularyItem {
    id: number;
    level: number;
    word: string;
    meaning: string;
    pronunciation?: string;
    examples: string[];
    topic: string;
}

// 사용자 UUID 생성/가져오기 (익명화 - 하위 호환성 유지)
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



