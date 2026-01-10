import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// 관리자 API - 전체 통계 조회
export async function GET(req: NextRequest) {
    // 간단한 관리자 인증 (실제로는 더 강력한 인증 필요)
    const adminKey = req.headers.get("x-admin-key");
    const expectedKey = process.env.ADMIN_SECRET_KEY || "kiip-admin-2026";

    if (adminKey !== expectedKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();

    if (!supabase) {
        // Supabase 없으면 샘플 데이터 반환
        return NextResponse.json(getSampleData());
    }

    try {
        // 1. 전체 사용자 수 (고유 user_id)
        const { data: usersData } = await supabase
            .from("cbt_attempts")
            .select("user_id");

        const uniqueUsers = new Set(usersData?.map(d => d.user_id) || []);
        const totalUsers = uniqueUsers.size;

        // 2. 오늘 활성 사용자 (DAU)
        const today = new Date().toISOString().split("T")[0];
        const { data: todayData } = await supabase
            .from("cbt_attempts")
            .select("user_id")
            .gte("created_at", today);

        const todayUsers = new Set(todayData?.map(d => d.user_id) || []);
        const dau = todayUsers.size;

        // 3. 전체 문제 풀이 통계
        const { data: attemptsData } = await supabase
            .from("cbt_attempts")
            .select("*");

        const totalAttempts = attemptsData?.length || 0;
        const correctAttempts = attemptsData?.filter(a => a.is_correct).length || 0;
        const overallAccuracy = totalAttempts > 0
            ? Math.round((correctAttempts / totalAttempts) * 100)
            : 0;

        // 4. 자주 틀리는 문제 TOP 10
        const questionStats: Record<number, { correct: number; wrong: number; text?: string }> = {};
        attemptsData?.forEach(attempt => {
            if (!questionStats[attempt.question_id]) {
                questionStats[attempt.question_id] = { correct: 0, wrong: 0 };
            }
            if (attempt.is_correct) {
                questionStats[attempt.question_id].correct++;
            } else {
                questionStats[attempt.question_id].wrong++;
            }
        });

        // 문제 텍스트 가져오기
        const { data: questionsData } = await supabase
            .from("questions")
            .select("id, question_text, category, level");

        questionsData?.forEach(q => {
            if (questionStats[q.id]) {
                questionStats[q.id].text = q.question_text;
            }
        });

        const frequentlyWrong = Object.entries(questionStats)
            .map(([id, stats]) => ({
                questionId: Number(id),
                text: stats.text || `문제 ${id}`,
                total: stats.correct + stats.wrong,
                wrongRate: Math.round((stats.wrong / (stats.correct + stats.wrong)) * 100),
            }))
            .filter(q => q.total >= 3) // 최소 3회 이상 풀린 문제만
            .sort((a, b) => b.wrongRate - a.wrongRate)
            .slice(0, 10);

        // 5. 일별 사용 현황 (최근 7일)
        const dailyStats: Record<string, { users: Set<string>; attempts: number }> = {};
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split("T")[0];
        });

        last7Days.forEach(date => {
            dailyStats[date] = { users: new Set(), attempts: 0 };
        });

        attemptsData?.forEach(attempt => {
            const date = attempt.created_at?.split("T")[0];
            if (dailyStats[date]) {
                dailyStats[date].users.add(attempt.user_id);
                dailyStats[date].attempts++;
            }
        });

        const dailyTrend = last7Days.reverse().map(date => ({
            date,
            users: dailyStats[date]?.users.size || 0,
            attempts: dailyStats[date]?.attempts || 0,
        }));

        // 6. 레벨별 통계
        const levelStats: Record<number, { attempts: number; correct: number }> = {};
        for (let i = 0; i <= 5; i++) {
            levelStats[i] = { attempts: 0, correct: 0 };
        }

        attemptsData?.forEach(attempt => {
            const question = questionsData?.find(q => q.id === attempt.question_id);
            if (question) {
                levelStats[question.level].attempts++;
                if (attempt.is_correct) {
                    levelStats[question.level].correct++;
                }
            }
        });

        const levelBreakdown = Object.entries(levelStats).map(([level, stats]) => ({
            level: Number(level),
            attempts: stats.attempts,
            accuracy: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0,
        }));

        // 7. 카테고리별 오답률
        const categoryStats: Record<string, { attempts: number; correct: number }> = {};
        attemptsData?.forEach(attempt => {
            const question = questionsData?.find(q => q.id === attempt.question_id);
            if (question) {
                if (!categoryStats[question.category]) {
                    categoryStats[question.category] = { attempts: 0, correct: 0 };
                }
                categoryStats[question.category].attempts++;
                if (attempt.is_correct) {
                    categoryStats[question.category].correct++;
                }
            }
        });

        const categoryBreakdown = Object.entries(categoryStats)
            .map(([category, stats]) => ({
                category,
                attempts: stats.attempts,
                wrongRate: stats.attempts > 0
                    ? Math.round(((stats.attempts - stats.correct) / stats.attempts) * 100)
                    : 0,
            }))
            .sort((a, b) => b.wrongRate - a.wrongRate);

        // 8. 평균 문제 풀이 시간
        const totalTime = attemptsData?.reduce((sum, a) => sum + (a.time_spent || 0), 0) || 0;
        const avgTimePerQuestion = totalAttempts > 0 ? Math.round(totalTime / totalAttempts) : 0;

        // 9. 프리미엄 사용자 수
        const { data: premiumData } = await supabase
            .from("user_status")
            .select("is_premium")
            .eq("is_premium", true);

        const premiumUsers = premiumData?.length || 0;
        const conversionRate = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;

        return NextResponse.json({
            overview: {
                totalUsers,
                dau,
                totalAttempts,
                overallAccuracy,
                avgTimePerQuestion,
                premiumUsers,
                conversionRate,
            },
            frequentlyWrong,
            dailyTrend,
            levelBreakdown,
            categoryBreakdown,
            generatedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error("Admin API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Supabase 없을 때 샘플 데이터
function getSampleData() {
    return {
        overview: {
            totalUsers: 1234,
            dau: 156,
            totalAttempts: 45678,
            overallAccuracy: 72,
            avgTimePerQuestion: 18,
            premiumUsers: 45,
            conversionRate: 4,
        },
        frequentlyWrong: [
            { questionId: 4, text: "대한민국의 공휴일이 아닌 것은?", total: 523, wrongRate: 45 },
            { questionId: 2, text: "한글을 창제한 왕은?", total: 456, wrongRate: 38 },
            { questionId: 5, text: "'안녕하세요'의 올바른 사용 시간대는?", total: 389, wrongRate: 32 },
        ],
        dailyTrend: [
            { date: "2026-01-03", users: 120, attempts: 890 },
            { date: "2026-01-04", users: 135, attempts: 1020 },
            { date: "2026-01-05", users: 142, attempts: 1150 },
            { date: "2026-01-06", users: 128, attempts: 980 },
            { date: "2026-01-07", users: 155, attempts: 1230 },
            { date: "2026-01-08", users: 148, attempts: 1180 },
            { date: "2026-01-09", users: 156, attempts: 1250 },
        ],
        levelBreakdown: [
            { level: 0, attempts: 5600, accuracy: 85 },
            { level: 1, attempts: 8900, accuracy: 78 },
            { level: 2, attempts: 12300, accuracy: 72 },
            { level: 3, attempts: 10200, accuracy: 68 },
            { level: 4, attempts: 5800, accuracy: 62 },
            { level: 5, attempts: 2878, accuracy: 55 },
        ],
        categoryBreakdown: [
            { category: "한국 역사/문화", attempts: 15600, wrongRate: 35 },
            { category: "한국 생활", attempts: 12300, wrongRate: 28 },
            { category: "한국어", attempts: 10200, wrongRate: 22 },
            { category: "법률/제도", attempts: 7578, wrongRate: 42 },
        ],
        generatedAt: new Date().toISOString(),
        isSampleData: true,
    };
}
