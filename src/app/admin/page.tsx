"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AdminStats {
    overview: {
        totalUsers: number;
        dau: number;
        totalAttempts: number;
        overallAccuracy: number;
        avgTimePerQuestion: number;
        premiumUsers: number;
        conversionRate: number;
    };
    frequentlyWrong: Array<{
        questionId: number;
        text: string;
        total: number;
        wrongRate: number;
    }>;
    dailyTrend: Array<{
        date: string;
        users: number;
        attempts: number;
    }>;
    levelBreakdown: Array<{
        level: number;
        attempts: number;
        accuracy: number;
    }>;
    categoryBreakdown: Array<{
        category: string;
        attempts: number;
        wrongRate: number;
    }>;
    generatedAt: string;
    isSampleData?: boolean;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [adminKey, setAdminKey] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const fetchStats = async (key: string) => {
        if (!key) return;

        try {
            setLoading(true);
            const response = await fetch("/api/admin/stats", {
                headers: {
                    "x-admin-key": key,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setError("인증 실패: 올바른 관리자 키를 입력하세요");
                    setIsAuthenticated(false);
                    setLoading(false);
                    return;
                }
                throw new Error("Failed to fetch stats");
            }

            const data = await response.json();
            setStats(data);
            setIsAuthenticated(true);
            setError(null);
        } catch (err) {
            setError("데이터를 불러오는 중 오류가 발생했습니다");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 저장된 키로 자동 로그인 시도
        const savedKey = localStorage.getItem("admin_key");
        if (savedKey) {
            setAdminKey(savedKey);
            fetchStats(savedKey);
        }
        setInitialized(true);
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem("admin_key", adminKey);
        fetchStats(adminKey);
    };

    const handleRefresh = () => {
        fetchStats(adminKey);
    };

    // 초기화 전 로딩 표시
    if (!initialized) {
        return (
            <main className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>로딩 중...</p>
                </div>
            </main>
        );
    }

    // 로그인 화면
    if (!isAuthenticated && !loading) {
        return (
            <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔐</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">관리자 로그인</h1>
                        <p className="text-gray-400 mt-2">KIIP 튜터 관리자 대시보드</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            placeholder="관리자 키를 입력하세요"
                            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none mb-4"
                        />
                        {error && (
                            <p className="text-red-400 text-sm mb-4">{error}</p>
                        )}
                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            로그인
                        </button>
                    </form>

                    <p className="text-gray-500 text-xs text-center mt-4">
                        기본 키: kiip-admin-2026
                    </p>
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>데이터를 불러오는 중...</p>
                </div>
            </main>
        );
    }

    if (!stats) {
        return (
            <main className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <p className="text-red-400">데이터를 불러올 수 없습니다</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-4 px-4 py-2 bg-blue-600 rounded-lg"
                    >
                        다시 시도
                    </button>
                </div>
            </main>
        );
    }

    const maxAttempts = Math.max(...stats.dailyTrend.map(d => d.attempts), 1);

    return (
        <main className="min-h-screen bg-gray-900 text-white">
            {/* 헤더 */}
            <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📊</span>
                        <div>
                            <h1 className="text-xl font-bold">KIIP 튜터 관리자</h1>
                            <p className="text-xs text-gray-400">
                                마지막 업데이트: {new Date(stats.generatedAt).toLocaleString("ko-KR")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {stats.isSampleData && (
                            <span className="px-3 py-1 bg-yellow-600 text-yellow-100 text-xs rounded-full">
                                샘플 데이터
                            </span>
                        )}
                        <button
                            onClick={handleRefresh}
                            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            🔄 새로고침
                        </button>
                        <Link
                            href="/"
                            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                        >
                            홈으로
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* 핵심 지표 (KPIs) */}
                <section className="mb-8">
                    <h2 className="text-lg font-bold text-gray-400 mb-4">📈 핵심 지표 (KPIs)</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="bg-gray-800 rounded-xl p-4">
                            <div className="text-gray-400 text-xs mb-1">총 사용자</div>
                            <div className="text-2xl font-bold text-blue-400">
                                {stats.overview.totalUsers.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-4">
                            <div className="text-gray-400 text-xs mb-1">오늘 활성 (DAU)</div>
                            <div className="text-2xl font-bold text-green-400">
                                {stats.overview.dau.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-4">
                            <div className="text-gray-400 text-xs mb-1">총 문제 풀이</div>
                            <div className="text-2xl font-bold text-purple-400">
                                {stats.overview.totalAttempts.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-4">
                            <div className="text-gray-400 text-xs mb-1">전체 정답률</div>
                            <div className="text-2xl font-bold text-cyan-400">
                                {stats.overview.overallAccuracy}%
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-4">
                            <div className="text-gray-400 text-xs mb-1">평균 풀이 시간</div>
                            <div className="text-2xl font-bold text-orange-400">
                                {stats.overview.avgTimePerQuestion}초
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-4">
                            <div className="text-gray-400 text-xs mb-1">프리미엄 사용자</div>
                            <div className="text-2xl font-bold text-yellow-400">
                                {stats.overview.premiumUsers}
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-4">
                            <div className="text-gray-400 text-xs mb-1">전환율</div>
                            <div className="text-2xl font-bold text-pink-400">
                                {stats.overview.conversionRate}%
                            </div>
                        </div>
                    </div>
                </section>

                {/* 일별 트렌드 */}
                <section className="mb-8">
                    <h2 className="text-lg font-bold text-gray-400 mb-4">📅 일별 사용 현황 (최근 7일)</h2>
                    <div className="bg-gray-800 rounded-xl p-6">
                        <div className="flex items-end justify-between h-48 gap-2">
                            {stats.dailyTrend.map((day) => (
                                <div key={day.date} className="flex-1 flex flex-col items-center">
                                    <div className="text-xs text-gray-400 mb-1">{day.attempts}</div>
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all"
                                        style={{ height: `${(day.attempts / maxAttempts) * 100}%`, minHeight: "4px" }}
                                    ></div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        {day.date.split("-").slice(1).join("/")}
                                    </div>
                                    <div className="text-xs text-gray-400">{day.users}명</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* 자주 틀리는 문제 TOP 10 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-400 mb-4">❌ 자주 틀리는 문제 TOP 10</h2>
                        <div className="bg-gray-800 rounded-xl p-4">
                            {stats.frequentlyWrong.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">데이터가 없습니다</p>
                            ) : (
                                <div className="space-y-3">
                                    {stats.frequentlyWrong.map((q, index) => (
                                        <div key={q.questionId} className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? "bg-red-600" : "bg-gray-600"
                                                }`}>
                                                {index + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-300 truncate">{q.text}</p>
                                                <p className="text-xs text-gray-500">{q.total}회 풀이</p>
                                            </div>
                                            <span className="text-red-400 font-bold">{q.wrongRate}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 카테고리별 오답률 */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-400 mb-4">📚 카테고리별 오답률</h2>
                        <div className="bg-gray-800 rounded-xl p-4">
                            {stats.categoryBreakdown.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">데이터가 없습니다</p>
                            ) : (
                                <div className="space-y-4">
                                    {stats.categoryBreakdown.map((cat) => (
                                        <div key={cat.category}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-300">{cat.category}</span>
                                                <span className="text-gray-400">{cat.attempts}회 | 오답 {cat.wrongRate}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-500 to-red-500 rounded-full"
                                                    style={{ width: `${cat.wrongRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* 레벨별 통계 */}
                <section className="mb-8">
                    <h2 className="text-lg font-bold text-gray-400 mb-4">🎯 레벨별 학습 현황</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {stats.levelBreakdown.map((level) => (
                            <div key={level.level} className="bg-gray-800 rounded-xl p-4 text-center">
                                <div className="text-3xl mb-2">
                                    {level.level === 0 ? "🌱" :
                                        level.level === 1 ? "🌿" :
                                            level.level === 2 ? "🌲" :
                                                level.level === 3 ? "🏆" :
                                                    level.level === 4 ? "👑" : "🎓"}
                                </div>
                                <div className="text-sm text-gray-400">Level {level.level}</div>
                                <div className="text-lg font-bold text-white">{level.accuracy}%</div>
                                <div className="text-xs text-gray-500">{level.attempts.toLocaleString()}회</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 사업 인사이트 */}
                <section className="mb-8">
                    <h2 className="text-lg font-bold text-gray-400 mb-4">💡 사업 인사이트</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
                            <h3 className="font-bold text-blue-300 mb-2">📈 성장 지표</h3>
                            <p className="text-sm text-blue-100">
                                DAU {stats.overview.dau}명 중 {stats.overview.conversionRate}%가 프리미엄으로 전환했습니다.
                                프리미엄 전환율을 높이기 위해 AI 튜터 미리보기를 제공해보세요.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-6">
                            <h3 className="font-bold text-purple-300 mb-2">🎯 콘텐츠 개선</h3>
                            <p className="text-sm text-purple-100">
                                가장 오답률이 높은 카테고리: {stats.categoryBreakdown[0]?.category || "없음"}.
                                이 분야의 해설을 보강하면 사용자 만족도가 높아질 수 있습니다.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-6">
                            <h3 className="font-bold text-green-300 mb-2">⏱️ 사용자 행동</h3>
                            <p className="text-sm text-green-100">
                                평균 문제 풀이 시간 {stats.overview.avgTimePerQuestion}초.
                                정답률 {stats.overview.overallAccuracy}%로 난이도가 적절합니다.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 푸터 */}
                <footer className="text-center text-gray-500 text-sm py-8">
                    KIIP 튜터 관리자 대시보드 v1.0
                </footer>
            </div>
        </main>
    );
}
