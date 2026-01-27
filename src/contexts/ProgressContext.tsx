"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface UserProgress {
    currentLevel: number;
    levelProgress: Record<number, number>; // 각 레벨별 진행도 (0-100)
    completedLevels: number[];
    vocabularyMastered: Record<number, string[]>; // 레벨별 마스터한 단어
    // 새로운 결제 시스템
    purchasedLevels: number[]; // 구매한 레벨 [2, 3, 4, 5]
    aiTutorExpiry: string | null; // ISO 날짜 또는 null
    cbtExpiry: string | null; // ISO 날짜 또는 null
    problemStats: Record<string, { correct: number; incorrect: number; lastReviewed: number }>; // 문제별 학습 기록
    lastStudied: { level: number; topic: string; timestamp: number } | null; // 마지막 학습 위치
    // 카드 학습 진행 상황
    cardProgress: Record<string, { // key: "level-topic" or "level-vocab"
        currentIndex: number; // 현재 학습 중인 카드 인덱스
        completedCards: number[]; // 완료한 카드 ID 목록
        totalCards: number; // 전체 카드 수
        lastStudied: number; // 마지막 학습 timestamp
    }>;
}

interface ProgressContextType {
    progress: UserProgress;
    isLoading: boolean;
    completeVocabulary: (level: number, word: string) => void;
    updateLevelProgress: (level: number, progressPercent: number) => void;
    updateProblemResult: (problemId: string, isCorrect: boolean) => void;
    completeLevel: (level: number) => void;
    canAccessLevel: (level: number) => boolean;
    isLevelLocked: (level: number) => boolean;
    // 새로운 구매 함수들
    purchaseLevel: (level: number) => void;
    purchaseAiTutor: () => void;
    purchaseCbt: () => void;
    hasAiTutorAccess: () => boolean;
    hasCbtAccess: () => boolean;
    hasLevelAccess: (level: number) => boolean;
    getAiTutorDaysRemaining: () => number;
    getCbtDaysRemaining: () => number;
    updateLastStudied: (level: number, topic: string) => void;
    // 카드 학습 함수들
    getCardProgress: (key: string) => { currentIndex: number; completedCards: number[]; totalCards: number; lastStudied: number } | null;
    updateCardProgress: (key: string, currentIndex: number, totalCards: number) => void;
    markCardCompleted: (key: string, cardId: number) => void;
    resetCardProgress: (key: string) => void;
}

const defaultProgress: UserProgress = {
    currentLevel: 0,
    levelProgress: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    completedLevels: [],
    vocabularyMastered: {},
    purchasedLevels: [],
    aiTutorExpiry: null,
    cbtExpiry: null,
    problemStats: {},
    lastStudied: null,
    cardProgress: {}, // 카드 진행 상황
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [progress, setProgress] = useState<UserProgress>(defaultProgress);
    const [isLoading, setIsLoading] = useState(true);

    // 로컬 스토리지에서 진행 상황 불러오기
    useEffect(() => {
        if (isAuthenticated && user) {
            const savedProgress = localStorage.getItem(`kiip_progress_${user.id}`);
            if (savedProgress) {
                try {
                    const parsed = JSON.parse(savedProgress);
                    // 기존 데이터 마이그레이션 (isPremium -> 새 구조)
                    if (parsed.isPremium !== undefined) {
                        // 기존 프리미엄 사용자는 모든 레벨 구매 상태로 변환
                        if (parsed.isPremium) {
                            parsed.purchasedLevels = [2, 3, 4, 5];
                            parsed.aiTutorExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
                            parsed.cbtExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
                        } else {
                            parsed.purchasedLevels = [];
                            parsed.aiTutorExpiry = null;
                            parsed.cbtExpiry = null;
                        }
                        delete parsed.isPremium;
                    }
                    // 누락된 필드 채우기
                    if (!parsed.purchasedLevels) parsed.purchasedLevels = [];
                    if (parsed.aiTutorExpiry === undefined) parsed.aiTutorExpiry = null;
                    if (parsed.cbtExpiry === undefined) parsed.cbtExpiry = null;
                    if (parsed.cbtExpiry === undefined) parsed.cbtExpiry = null;
                    if (!parsed.problemStats) parsed.problemStats = {};
                    if (parsed.lastStudied === undefined) parsed.lastStudied = null;

                    setProgress(parsed);
                } catch {
                    setProgress(defaultProgress);
                }
            } else {
                // 저장된 데이터가 없으면 초기화 (새로운 사용자 등)
                setProgress(defaultProgress);
            }
        } else {
            // 로그아웃 시 초기화
            setProgress(defaultProgress);
        }
        setIsLoading(false);
    }, [isAuthenticated, user]);

    // 진행 상황 저장
    const saveProgress = (newProgress: UserProgress) => {
        if (user) {
            localStorage.setItem(`kiip_progress_${user.id}`, JSON.stringify(newProgress));
        }
        setProgress(newProgress);
    };

    // 단어 마스터 완료
    const completeVocabulary = (level: number, word: string) => {
        const currentMastered = progress.vocabularyMastered[level] || [];
        if (!currentMastered.includes(word)) {
            const newProgress = {
                ...progress,
                vocabularyMastered: {
                    ...progress.vocabularyMastered,
                    [level]: [...currentMastered, word],
                },
            };
            saveProgress(newProgress);
        }
    };

    // 문제 결과 업데이트 (SRS 로직)
    const updateProblemResult = (problemId: string, isCorrect: boolean) => {
        const currentStats = progress.problemStats?.[problemId] || { correct: 0, incorrect: 0, lastReviewed: 0 };
        const newStats = {
            correct: currentStats.correct + (isCorrect ? 1 : 0),
            incorrect: currentStats.incorrect + (isCorrect ? 0 : 1),
            lastReviewed: Date.now(),
        };

        const newProgress = {
            ...progress,
            problemStats: {
                ...progress.problemStats,
                [problemId]: newStats,
            },
        };
        saveProgress(newProgress);
    };

    // 레벨 진행도 업데이트
    const updateLevelProgress = (level: number, progressPercent: number) => {
        const newProgress = {
            ...progress,
            levelProgress: {
                ...progress.levelProgress,
                [level]: Math.min(100, Math.max(0, progressPercent)),
            },
        };

        // 70% 이상 달성 시 레벨 완료 처리
        if (progressPercent >= 70 && !progress.completedLevels.includes(level)) {
            newProgress.completedLevels = [...progress.completedLevels, level];
            if (level >= progress.currentLevel) {
                newProgress.currentLevel = level + 1;
            }
        }

        saveProgress(newProgress);
    };

    // 레벨 완료
    const completeLevel = (level: number) => {
        if (!progress.completedLevels.includes(level)) {
            const newProgress = {
                ...progress,
                completedLevels: [...progress.completedLevels, level],
                levelProgress: {
                    ...progress.levelProgress,
                    [level]: 100,
                },
                currentLevel: Math.max(progress.currentLevel, level + 1),
            };
            saveProgress(newProgress);
        }
    };

    // 레벨 구매 여부 확인
    const hasLevelAccess = (level: number): boolean => {
        // 모든 레벨 무료 접근 가능
        return true;
    };

    // 레벨 접근 가능 여부
    const canAccessLevel = (level: number): boolean => {
        return true; // 모든 레벨 접근 허용
    };

    // 레벨 잠김 여부
    const isLevelLocked = (level: number): boolean => {
        return false; // 잠금 없음
    };

    // AI 튜터 접근 가능 여부
    const hasAiTutorAccess = (): boolean => {
        return false; // 준비 중
    };

    // CBT 접근 가능 여부
    const hasCbtAccess = (): boolean => {
        return false; // 준비 중
    };

    // AI 튜터 남은 일수
    const getAiTutorDaysRemaining = (): number => {
        return 0;
    };

    // CBT 남은 일수
    const getCbtDaysRemaining = (): number => {
        return 0;
    };

    // 레벨 구매 (데모용 - 실제로는 결제 연동 필요)
    const purchaseLevel = (level: number) => {
        if (!progress.purchasedLevels.includes(level) && level >= 2 && level <= 5) {
            const newProgress = {
                ...progress,
                purchasedLevels: [...progress.purchasedLevels, level].sort(),
            };
            saveProgress(newProgress);
        }
    };

    // AI 튜터 구매 (30일)
    const purchaseAiTutor = () => {
        const newExpiry = new Date();
        if (progress.aiTutorExpiry && new Date(progress.aiTutorExpiry) > newExpiry) {
            // 기존 만료일이 남아있으면 거기에 30일 추가
            newExpiry.setTime(new Date(progress.aiTutorExpiry).getTime());
        }
        newExpiry.setDate(newExpiry.getDate() + 30);

        const newProgress = {
            ...progress,
            aiTutorExpiry: newExpiry.toISOString(),
        };
        saveProgress(newProgress);
    };

    // CBT 구매 (30일)
    const purchaseCbt = () => {
        const newExpiry = new Date();
        if (progress.cbtExpiry && new Date(progress.cbtExpiry) > newExpiry) {
            // 기존 만료일이 남아있으면 거기에 30일 추가
            newExpiry.setTime(new Date(progress.cbtExpiry).getTime());
        }
        newExpiry.setDate(newExpiry.getDate() + 30);

        const newProgress = {
            ...progress,
            cbtExpiry: newExpiry.toISOString(),
        };
        saveProgress(newProgress);
    };

    // 최근 학습 위치 업데이트
    const updateLastStudied = (level: number, topic: string) => {
        const newProgress = {
            ...progress,
            lastStudied: {
                level,
                topic,
                timestamp: Date.now(),
            },
        };
        saveProgress(newProgress);
    };

    // 카드 진행 상황 조회
    const getCardProgress = (key: string) => {
        return progress.cardProgress[key] || null;
    };

    // 카드 진행 상황 업데이트
    const updateCardProgress = (key: string, currentIndex: number, totalCards: number) => {
        const existing = progress.cardProgress[key] || { completedCards: [], lastStudied: Date.now() };
        const newProgress = {
            ...progress,
            cardProgress: {
                ...progress.cardProgress,
                [key]: {
                    ...existing,
                    currentIndex,
                    totalCards,
                    lastStudied: Date.now(),
                },
            },
        };
        saveProgress(newProgress);
    };

    // 카드 완료 표시
    const markCardCompleted = (key: string, cardId: number) => {
        const existing = progress.cardProgress[key] || { currentIndex: 0, completedCards: [], totalCards: 0, lastStudied: Date.now() };
        if (!existing.completedCards.includes(cardId)) {
            const newProgress = {
                ...progress,
                cardProgress: {
                    ...progress.cardProgress,
                    [key]: {
                        ...existing,
                        completedCards: [...existing.completedCards, cardId],
                        lastStudied: Date.now(),
                    },
                },
            };
            saveProgress(newProgress);
        }
    };

    // 카드 진행 상황 초기화
    const resetCardProgress = (key: string) => {
        const newProgress = {
            ...progress,
            cardProgress: {
                ...progress.cardProgress,
                [key]: {
                    currentIndex: 0,
                    completedCards: [],
                    totalCards: 0,
                    lastStudied: Date.now(),
                },
            },
        };
        saveProgress(newProgress);
    };

    return (
        <ProgressContext.Provider
            value={{
                progress,
                isLoading,
                completeVocabulary,
                updateLevelProgress,
                updateProblemResult,
                completeLevel,
                canAccessLevel,
                isLevelLocked,
                purchaseLevel,
                purchaseAiTutor,
                purchaseCbt,
                hasAiTutorAccess,
                hasCbtAccess,
                hasLevelAccess,
                getAiTutorDaysRemaining,
                getCbtDaysRemaining,
                updateLastStudied,
                getCardProgress,
                updateCardProgress,
                markCardCompleted,
                resetCardProgress,
            }}
        >
            {children}
        </ProgressContext.Provider>
    );
}

export function useProgress() {
    const context = useContext(ProgressContext);
    if (context === undefined) {
        throw new Error("useProgress must be used within a ProgressProvider");
    }
    return context;
}
