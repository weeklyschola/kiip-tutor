"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

// 학습 세션 기록 타입
export interface StudySession {
    id: string;
    date: string;
    level: number;
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number; // 초
    wrongQuestions: WrongQuestion[];
}

export interface WrongQuestion {
    questionId: number;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    category: string;
}

// 전체 통계 타입
export interface UserStats {
    totalSessions: number;
    totalQuestions: number;
    totalCorrect: number;
    totalTimeSpent: number;
    levelStats: Record<number, LevelStat>;
    categoryStats: Record<string, CategoryStat>;
    recentSessions: StudySession[];
}

export interface LevelStat {
    attempted: number;
    correct: number;
    timeSpent: number;
}

export interface CategoryStat {
    attempted: number;
    correct: number;
}

const STORAGE_KEY = "kiip_study_history";

export function useStudyHistory() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<StudySession[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // 로컬 스토리지에서 데이터 로드
    useEffect(() => {
        if (typeof window === "undefined" || !user) {
            setSessions([]);
            return;
        }

        const key = `${STORAGE_KEY}_${user.id}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as StudySession[];
                setSessions(parsed);
            } catch (e) {
                console.error("Failed to parse study history:", e);
                setSessions([]);
            }
        } else {
            setSessions([]);
        }
        setIsLoaded(true);
    }, [user]);

    // 세션 변경 시 통계 재계산
    useEffect(() => {
        if (!isLoaded) return;
        setStats(calculateStats(sessions));
    }, [sessions, isLoaded]);

    // 통계 계산 함수
    const calculateStats = useCallback((sessions: StudySession[]): UserStats => {
        const levelStats: Record<number, LevelStat> = {};
        const categoryStats: Record<string, CategoryStat> = {};

        let totalQuestions = 0;
        let totalCorrect = 0;
        let totalTimeSpent = 0;

        sessions.forEach((session) => {
            totalQuestions += session.totalQuestions;
            totalCorrect += session.correctAnswers;
            totalTimeSpent += session.timeSpent;

            // 레벨별 통계
            if (!levelStats[session.level]) {
                levelStats[session.level] = { attempted: 0, correct: 0, timeSpent: 0 };
            }
            levelStats[session.level].attempted += session.totalQuestions;
            levelStats[session.level].correct += session.correctAnswers;
            levelStats[session.level].timeSpent += session.timeSpent;

            // 카테고리별 통계 (오답에서 추출)
            session.wrongQuestions.forEach((wq) => {
                if (!categoryStats[wq.category]) {
                    categoryStats[wq.category] = { attempted: 0, correct: 0 };
                }
                categoryStats[wq.category].attempted += 1;
                // 오답이므로 correct는 증가하지 않음
            });
        });

        return {
            totalSessions: sessions.length,
            totalQuestions,
            totalCorrect,
            totalTimeSpent,
            levelStats,
            categoryStats,
            recentSessions: sessions.slice(-10).reverse(), // 최근 10개
        };
    }, []);

    // 새 세션 저장
    const saveSession = useCallback((session: Omit<StudySession, "id" | "date">) => {
        if (!user) return null;

        const newSession: StudySession = {
            ...session,
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
        };

        setSessions((prev) => {
            const updated = [...prev, newSession];
            localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(updated));
            return updated;
        });

        return newSession;
    }, [user]);

    // 취약 카테고리 분석
    const getWeakCategories = useCallback((): { category: string; wrongRate: number }[] => {
        if (!stats) return [];

        return Object.entries(stats.categoryStats)
            .map(([category, stat]) => ({
                category,
                wrongRate: stat.attempted > 0 ? Math.round((1 - stat.correct / stat.attempted) * 100) : 0,
            }))
            .sort((a, b) => b.wrongRate - a.wrongRate)
            .slice(0, 5);
    }, [stats]);

    // 전체 정답률
    const getOverallAccuracy = useCallback((): number => {
        if (!stats || stats.totalQuestions === 0) return 0;
        return Math.round((stats.totalCorrect / stats.totalQuestions) * 100);
    }, [stats]);

    // 기록 초기화
    const clearHistory = useCallback(() => {
        if (user) {
            localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
            setSessions([]);
        }
    }, [user]);

    return {
        sessions,
        stats,
        isLoaded,
        saveSession,
        getWeakCategories,
        getOverallAccuracy,
        clearHistory,
    };
}

export default useStudyHistory;
