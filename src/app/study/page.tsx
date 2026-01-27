"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import ProgressBar from "@/components/ProgressBar";
import { useProgress } from "@/contexts/ProgressContext";
import { useAuth } from "@/contexts/AuthContext";

// 레벨 데이터
const levels = [
    {
        level: 0,
        title: "기초",
        description: "한글의 기초와 일상생활에 꼭 필요한 기본 인사를 배웁니다.",
        icon: "💬",
    },
    {
        level: 1,
        title: "초급 1",
        description: "간단한 쇼핑, 병원 방문 등 기초적인 의사소통 능력을 기릅니다.",
        icon: "💭",
    },
    {
        level: 2,
        title: "초급 2",
        description: "친숙한 주제에 대한 이해와 기초적인 한국 문화에 대해 배웁니다.",
        icon: "💬",
    },
    {
        level: 3,
        title: "중급 1",
        description: "일상적인 사회생활과 공공시설 이용에 필요한 문법을 익힙니다.",
        icon: "💬",
    },
    {
        level: 4,
        title: "중급 2",
        description: "사회적 이슈 및 전문적인 한국에서의 유창한 의사소통을 지향합니다.",
        icon: "📄",
    },
    {
        level: 5,
        title: "한국사회 이해",
        description: "한국의 역사, 사회 제도 및 법률 체계에 대한 심도 있는 이해를 돕습니다.",
        icon: "📄",
    },
];

import { Suspense } from "react";

export const dynamic = 'force-dynamic';

function StudyContent() {
    const { progress, canAccessLevel } = useProgress();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // 비로그인 사용자는 로그인 페이지로 리다이렉트
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    // 로그인 확인 중 or 비로그인 상태면 로딩 표시
    if (authLoading || !isAuthenticated) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            {/* 헤더 */}
            <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📚</span>
                        <div>
                            <h1 className="font-bold text-gray-800">단계 선택하기</h1>
                            <p className="text-xs text-gray-500">KIIP Tutor</p>
                        </div>
                    </div>
                    {/* 설정 버튼 제거됨 (내 정보 탭에서 로그아웃 가능) */}
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
                {levels.map((level, index) => {
                    // 실제 데이터 연동
                    const isCompleted = progress.completedLevels.includes(level.level);
                    const levelProgressValue = progress.levelProgress[level.level] || 0;
                    const isInProgress = !isCompleted;

                    return (
                        <Link
                            key={level.level}
                            href={`/study/${level.level}`}
                            className={`block bg-white rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${isInProgress && levelProgressValue > 0 ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
                        >
                            <div className="flex items-start gap-4">
                                {/* 아이콘 */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCompleted ? "bg-green-100" :
                                    isInProgress ? "bg-blue-100" :
                                        "bg-gray-100"
                                    }`}>
                                    <span className="text-xl">{level.icon}</span>
                                </div>

                                {/* 내용 */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h2 className="font-bold text-gray-800">
                                            {level.level}단계: {level.title}
                                        </h2>

                                        {/* 상태 배지 */}
                                        {isCompleted && (
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                                학습 완료
                                            </span>
                                        )}
                                        {isInProgress && levelProgressValue > 0 && (
                                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                                                학습 중 {levelProgressValue}%
                                            </span>
                                        )}
                                        {/* 시작 전 상태 (진행도 0) */}
                                        {isInProgress && levelProgressValue === 0 && (
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full border border-gray-200">
                                                학습 가능
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm mb-3 text-gray-600">
                                        {level.description}
                                    </p>

                                    {/* 진행률 바 */}
                                    <ProgressBar
                                        value={levelProgressValue}
                                        size="sm"
                                        color={isCompleted ? "success" : "primary"}
                                    />
                                </div>
                            </div>
                        </Link>
                    );
                })}

                {/* 학습 계속하기 버튼 (가장 높은 해금 레벨로 이동) */}
                <div className="pt-4">
                    <Link
                        href={`/study/${progress.currentLevel}`}
                        className="block w-full py-4 bg-blue-600 text-white text-center rounded-2xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        {progress.currentLevel === 0 && progress.levelProgress[0] === 0 ? "학습 시작하기" : "학습 계속하기"}
                    </Link>
                </div>
            </div>

        </main>
    );
}

export default function StudyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <StudyContent />
        </Suspense>
    );
}
