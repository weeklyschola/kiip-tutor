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
}

interface ProgressContextType {
    progress: UserProgress;
    isLoading: boolean;
    completeVocabulary: (level: number, word: string) => void;
    updateLevelProgress: (level: number, progressPercent: number) => void;
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
}

const defaultProgress: UserProgress = {
    currentLevel: 0,
    levelProgress: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    completedLevels: [],
    vocabularyMastered: {},
    purchasedLevels: [],
    aiTutorExpiry: null,
    cbtExpiry: null,
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
        // 0, 1단계는 무료
        if (level <= 1) return true;
        // 2~5단계는 구매 필요
        return progress.purchasedLevels.includes(level);
    };

    // 레벨 접근 가능 여부 (구매 + 해금 상태)
    const canAccessLevel = (level: number): boolean => {
        // 이미 완료했거나 현재 레벨보다 낮으면 접근 가능
        if (level <= progress.currentLevel) return true;

        // 0단계와 1단계는 기본적으로 열려있음 (단, 구매 여부 정책 따름 - 현재 무료)
        if (level <= 1) return true;

        // 레벨 구매 여부 확인
        if (!hasLevelAccess(level)) {
            return false;
        }

        // 이전 레벨 완료 확인 (순차 해금)
        // 2단계부터는 이전 단계 완료 필요
        if (progress.completedLevels.includes(level - 1)) return true;

        return false;
    };

    // 레벨 잠김 여부
    const isLevelLocked = (level: number): boolean => {
        // 무료 레벨 (0, 1단계)는 항상 열림
        if (level <= 1) {
            return false;
        }

        // 유료 콘텐츠 미구매로 인한 잠김
        if (!progress.purchasedLevels.includes(level)) {
            return true;
        }

        // 이전 레벨 미완료로 인한 잠김
        if (!progress.completedLevels.includes(level - 1) && level > progress.currentLevel) {
            return true;
        }

        return false;
    };

    // AI 튜터 접근 가능 여부
    const hasAiTutorAccess = (): boolean => {
        if (!progress.aiTutorExpiry) return false;
        return new Date(progress.aiTutorExpiry) > new Date();
    };

    // CBT 접근 가능 여부
    const hasCbtAccess = (): boolean => {
        if (!progress.cbtExpiry) return false;
        return new Date(progress.cbtExpiry) > new Date();
    };

    // AI 튜터 남은 일수
    const getAiTutorDaysRemaining = (): number => {
        if (!progress.aiTutorExpiry) return 0;
        const diff = new Date(progress.aiTutorExpiry).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
    };

    // CBT 남은 일수
    const getCbtDaysRemaining = (): number => {
        if (!progress.cbtExpiry) return 0;
        const diff = new Date(progress.cbtExpiry).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
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

    return (
        <ProgressContext.Provider
            value={{
                progress,
                isLoading,
                completeVocabulary,
                updateLevelProgress,
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
