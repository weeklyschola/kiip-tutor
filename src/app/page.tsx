"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import ProgressBar from "@/components/ProgressBar";
import SplashScreen from "@/components/SplashScreen";
import { useStudyHistory } from "@/hooks/useStudyHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useSplash } from "@/contexts/SplashContext";

export default function Home() {
    const router = useRouter();
    // 전역 스플래시 상태 사용
    const { hasSeenSplash, setHasSeenSplash } = useSplash();
    const [isLoading, setIsLoading] = useState(false);
    const { stats, getOverallAccuracy } = useStudyHistory();
    const { user, isAuthenticated } = useAuth();

    // 로컬 스토리지 확인 로직 제거됨
    /*
    useEffect(() => {
        // 클라이언트 사이드에서만 실행
        const hasSeenSplash = localStorage.getItem("kiip_onboarding_complete");
        if (!hasSeenSplash) {
            setShowSplash(true);
        }
        setIsLoading(false);
    }, []);
    */

    if (isLoading) return null;

    const currentLevel = user ? 3 : 0; // 임시: 사용자 레벨 정보가 DB에 있다면 업데이트 필요
    const levelProgress = 65;
    const userName = user?.nickname || "방문자";
    const streakDays = 12;

    const handleSplashComplete = () => {
        setHasSeenSplash(true);
        // 스플래시 종료 로그 기록 등을 할 수 있습니다.
    };

    if (!hasSeenSplash) {
        return <SplashScreen onComplete={handleSplashComplete} />;
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-nav">
            {/* 헤더 */}
            <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📖</span>
                        <span className="font-bold text-gray-800">KIIP 튜터</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-gray-100 rounded-full">
                                    <span className="text-xl">🔔</span>
                                </button>
                                <Link href="/profile" className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-600">{userName[0]}</span>
                                </Link>
                            </div>
                        ) : (
                            <Link href="/login" className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors">
                                로그인
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* 환영 메시지 */}
                <section className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👋</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">
                            {isAuthenticated ? `안녕하세요, ${userName}님!` : "안녕하세요, 방문자님!"}
                        </h1>
                        {isAuthenticated ? (
                            <>
                                <p className="text-sm text-gray-500">
                                    사회통합프로그램 {currentLevel}단계 • 중급 1
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-orange-500">🔥</span>
                                    <span className="text-xs text-orange-600 font-medium">
                                        {streakDays}일 연속 학습 중
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="mt-1">
                                <p className="text-sm text-gray-500 mb-2">로그인하고 학습 기록을 저장하세요.</p>
                                <Link href="/login" className="inline-block bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                                    로그인 / 회원가입
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* 학습 진행률 카드 (로그인 시에만 표시) */}
                {isAuthenticated ? (
                    <section className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-semibold text-gray-800">
                                {currentLevel}단계 학습 현황
                            </h2>
                            <span className="text-blue-600 font-bold">{levelProgress}%</span>
                        </div>
                        <ProgressBar value={levelProgress} size="md" />
                        <div className="flex justify-between mt-3 text-xs text-gray-500">
                            <span>18개 유닛 중 12개 완료</span>
                            <span>다음 목표: 13과</span>
                        </div>
                    </section>
                ) : (
                    <section className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                        <div className="text-center py-2">
                            <h3 className="font-bold text-gray-800 mb-2">나만의 학습 진도를 관리하세요</h3>
                            <p className="text-sm text-gray-500 mb-4">로그인하면 학습 기록이 자동으로 저장됩니다.</p>
                            <Link href="/login" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                                3초 만에 시작하기
                            </Link>
                        </div>
                    </section>
                )}

                {/* AI 튜터 CTA */}
                <section className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
                    <h3 className="font-bold mb-1">궁금한 점이 있나요?</h3>
                    <p className="text-sm text-blue-100 mb-3">
                        문법이나 문화에 대해 AI 튜터에게 물어보세요.
                    </p>
                    <Link
                        href="/chat"
                        className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-50 transition-colors"
                    >
                        💬 지금 채팅하기
                    </Link>
                </section>

                {/* 나의 학습 경로 (로그인 시에만 표시) */}
                {isAuthenticated && (
                    <section>
                        <h2 className="font-bold text-gray-800 mb-4">나의 학습 경로</h2>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                            {/* 이미지 영역 */}
                            <div className="h-40 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center relative">
                                <div className="text-center">
                                    <span className="text-5xl">👨‍👩‍👧‍👦</span>
                                    <p className="text-sm text-gray-600 mt-2">가족과 문화</p>
                                </div>
                            </div>
                            <div className="p-4">
                                <span className="text-xs text-blue-600 font-medium">현재 유닛</span>
                                <h3 className="font-bold text-gray-800 mt-1">4과: 가족과 문화</h3>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs text-gray-500">
                                        마지막 학습 위치 (45p)
                                    </span>
                                    <Link
                                        href="/study/3"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors"
                                    >
                                        이어서 학습
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 빠른 접근 카드 */}
                <section className="grid grid-cols-2 gap-4">
                    {/* 단어 연습 */}
                    <Link href="/vocabulary-practice" className="col-span-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">🎯</span>
                                    <h3 className="font-bold text-white text-lg">단어 연습</h3>
                                </div>
                                <p className="text-sm text-white/80">실전 대화로 한국어 연습하기</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="text-white/90 text-xs">❤️ 하트</span>
                                    <span className="text-white/90 text-xs">⚡ XP</span>
                                    <span className="text-white/90 text-xs">🔥 연속 정답</span>
                                </div>
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                <span className="text-4xl">📚</span>
                            </div>
                        </div>
                    </Link>

                    <Link href="/vocabulary" className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                            <span className="text-lg">文</span>
                        </div>
                        <h3 className="font-bold text-gray-800">단어장</h3>
                        <p className="text-xs text-gray-500 mt-1">450개 단어 학습 완료</p>
                        <button className="mt-3 text-xs text-red-600 font-medium border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors">
                            전체 복습하기
                        </button>
                    </Link>

                    <Link href="/cbt" className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                            <span className="text-lg">📋</span>
                        </div>
                        <h3 className="font-bold text-gray-800">모의고사</h3>
                        <p className="text-xs text-gray-500 mt-1">CBT 시험 완벽 대비</p>
                        <button className="mt-3 text-xs text-blue-600 font-medium border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors">
                            시험 시작하기
                        </button>
                    </Link>
                </section>

                {/* 오늘의 팁 */}
                <section className="bg-white rounded-2xl p-5 shadow-sm">
                    <h2 className="font-bold text-gray-800 mb-3">오늘의 팁</h2>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span>💡</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            가게 점원이나 선생님께 말씀드릴 때는 존댓말을 사용하여 존중을 표현하세요.
                        </p>
                    </div>
                </section>

                {/* 학습 통계 요약 */}
                {stats && stats.totalSessions > 0 && (
                    <section className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
                        <h2 className="font-bold mb-4">📊 나의 학습 현황</h2>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold">{stats.totalSessions}</div>
                                <div className="text-xs text-indigo-200">학습 횟수</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{getOverallAccuracy()}%</div>
                                <div className="text-xs text-indigo-200">평균 정답률</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                                <div className="text-xs text-indigo-200">푼 문제</div>
                            </div>
                        </div>
                        <Link
                            href="/analytics"
                            className="block mt-4 text-center text-sm text-indigo-200 hover:text-white transition-colors"
                        >
                            상세 분석 보기 →
                        </Link>
                    </section>
                )}
            </div>

            <BottomNav />
        </main>
    );
}
