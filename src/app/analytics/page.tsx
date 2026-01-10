"use client";

import { useStudyHistory } from "@/hooks/useStudyHistory";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function AnalyticsPage() {
    const { stats, isLoaded, getWeakCategories, getOverallAccuracy, clearHistory } = useStudyHistory();

    if (!isLoaded) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </main>
        );
    }

    const accuracy = getOverallAccuracy();
    const weakCategories = getWeakCategories();

    // 학습 시간 포맷
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}시간 ${mins}분`;
        return `${mins}분`;
    };

    return (
        <main className="min-h-screen bg-gray-50 py-8 pb-nav">
            <div className="max-w-4xl mx-auto px-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">📊 학습 분석</h1>
                        <p className="text-gray-600">나의 학습 현황을 확인하세요</p>
                    </div>
                    <Link
                        href="/"
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        홈으로
                    </Link>
                </div>

                {/* 데이터가 없을 때 */}
                {!stats || stats.totalSessions === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">📈</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">아직 학습 기록이 없어요</h2>
                        <p className="text-gray-600 mb-6">CBT 모의고사를 풀면 학습 분석을 볼 수 있습니다</p>
                        <Link
                            href="/cbt"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                            📝 CBT 시험 시작하기
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* 전체 통계 카드 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white rounded-xl p-4 shadow-md">
                                <div className="text-sm text-gray-500 mb-1">총 학습 횟수</div>
                                <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}회</div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-md">
                                <div className="text-sm text-gray-500 mb-1">풀어본 문제</div>
                                <div className="text-2xl font-bold text-green-600">{stats.totalQuestions}개</div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-md">
                                <div className="text-sm text-gray-500 mb-1">정답률</div>
                                <div className="text-2xl font-bold text-purple-600">{accuracy}%</div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-md">
                                <div className="text-sm text-gray-500 mb-1">총 학습 시간</div>
                                <div className="text-2xl font-bold text-orange-600">{formatTime(stats.totalTimeSpent)}</div>
                            </div>
                        </div>

                        {/* 정답률 시각화 */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">📈 정답률 현황</h2>
                            <div className="flex items-center gap-4">
                                <div className="relative w-32 h-32">
                                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="10"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            fill="none"
                                            stroke={accuracy >= 80 ? "#22c55e" : accuracy >= 60 ? "#eab308" : "#ef4444"}
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                            strokeDasharray={`${accuracy * 2.83} 283`}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-gray-800">{accuracy}%</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="mb-2">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">정답</span>
                                            <span className="font-medium text-green-600">{stats.totalCorrect}개</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full">
                                            <div
                                                className="h-2 bg-green-500 rounded-full"
                                                style={{ width: `${accuracy}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">오답</span>
                                            <span className="font-medium text-red-600">
                                                {stats.totalQuestions - stats.totalCorrect}개
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full">
                                            <div
                                                className="h-2 bg-red-500 rounded-full"
                                                style={{ width: `${100 - accuracy}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 취약 분야 분석 */}
                        {weakCategories.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">⚠️ 취약 분야 분석</h2>
                                <p className="text-sm text-gray-600 mb-4">자주 틀리는 분야를 집중적으로 학습하세요</p>
                                <div className="space-y-3">
                                    {weakCategories.map((item, index) => (
                                        <div key={item.category} className="flex items-center gap-3">
                                            <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">
                                                {index + 1}
                                            </span>
                                            <span className="flex-1 text-gray-700">{item.category}</span>
                                            <span className="text-red-600 font-medium">오답률 {item.wrongRate}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 레벨별 통계 */}
                        {Object.keys(stats.levelStats).length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">📚 레벨별 학습 현황</h2>
                                <div className="space-y-4">
                                    {Object.entries(stats.levelStats).map(([level, stat]) => {
                                        const levelAccuracy = stat.attempted > 0
                                            ? Math.round((stat.correct / stat.attempted) * 100)
                                            : 0;
                                        return (
                                            <div key={level} className="border border-gray-200 rounded-xl p-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-gray-800">Level {level}</span>
                                                    <span className="text-sm text-gray-500">{stat.attempted}문제</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                                                        <div
                                                            className="h-2 bg-blue-500 rounded-full transition-all"
                                                            style={{ width: `${levelAccuracy}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-blue-600 w-12 text-right">
                                                        {levelAccuracy}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 최근 학습 기록 */}
                        {stats.recentSessions.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">🕐 최근 학습 기록</h2>
                                <div className="space-y-3">
                                    {stats.recentSessions.map((session) => (
                                        <div key={session.id} className="flex items-center justify-between py-3 border-b last:border-0">
                                            <div>
                                                <div className="font-medium text-gray-800">
                                                    Level {session.level} • {session.correctAnswers}/{session.totalQuestions} 정답
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(session.date).toLocaleDateString("ko-KR")} • {formatTime(session.timeSpent)}
                                                </div>
                                            </div>
                                            <div className={`text-lg font-bold ${session.correctAnswers / session.totalQuestions >= 0.8
                                                ? "text-green-600"
                                                : session.correctAnswers / session.totalQuestions >= 0.6
                                                    ? "text-yellow-600"
                                                    : "text-red-600"
                                                }`}>
                                                {Math.round((session.correctAnswers / session.totalQuestions) * 100)}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 학습 추천 */}
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white mb-8">
                            <h2 className="text-lg font-bold mb-2">💡 학습 추천</h2>
                            {accuracy >= 80 ? (
                                <p>훌륭해요! 높은 정답률을 유지하고 있습니다. 다음 레벨에 도전해보세요!</p>
                            ) : accuracy >= 60 ? (
                                <p>좋은 진행 상황이에요! 취약 분야를 집중적으로 복습하면 더 좋은 결과를 얻을 수 있어요.</p>
                            ) : (
                                <p>꾸준한 학습이 중요해요! 기초 단어와 개념을 다시 복습해보세요.</p>
                            )}
                            <div className="flex gap-3 mt-4">
                                <Link
                                    href="/cbt"
                                    className="flex-1 py-2 bg-white text-blue-600 text-center rounded-lg font-medium hover:bg-blue-50 transition-colors"
                                >
                                    다시 도전하기
                                </Link>
                                <Link
                                    href="/vocabulary"
                                    className="flex-1 py-2 bg-white/20 text-white text-center rounded-lg font-medium hover:bg-white/30 transition-colors"
                                >
                                    단어 복습하기
                                </Link>
                            </div>
                        </div>

                        {/* 기록 초기화 */}
                        <div className="text-center">
                            <button
                                onClick={() => {
                                    if (confirm("모든 학습 기록을 삭제하시겠습니까?")) {
                                        clearHistory();
                                    }
                                }}
                                className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                            >
                                학습 기록 초기화
                            </button>
                        </div>
                    </>
                )}
            </div>

            <BottomNav />
        </main>
    );
}
