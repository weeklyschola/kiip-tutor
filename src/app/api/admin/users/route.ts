import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// 관리자 권한 클라이언트
const supabaseAdmin = getSupabaseAdmin();

export async function GET(request: NextRequest) {
    // 1. 관리자 키 검증
    const adminKey = request.headers.get("x-admin-key");
    if (adminKey !== "kiip-admin-2026") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
        console.error("Supabase Admin client not initialized");
        return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 });
    }

    try {
        // 2. 사용자 목록 조회 (최신 가입순)
        const { data: profiles, error } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100);

        if (error) throw error;

        return NextResponse.json({ users: profiles });
    } catch (error) {
        console.error("Fetch users error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    // 1. 관리자 키 검증
    const adminKey = request.headers.get("x-admin-key");
    if (adminKey !== "kiip-admin-2026") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { userId, type, value } = body;
        // type: 'subscription' | 'level'
        // value: premiumUntil (string) | level (number)

        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        let updateData = {};

        if (type === 'subscription') {
            updateData = { premium_until: value };
        } else if (type === 'revoke_subscription') {
            // 구독 취소: 만료일을 과거(또는 null)로 설정
            updateData = { premium_until: null };
        } else if (type === 'level') {
            // 레벨 추가
            const currentLevels: number[] = profile?.purchased_levels || [];
            const levelToAdd = Number(value);

            if (!currentLevels.includes(levelToAdd)) {
                updateData = {
                    purchased_levels: [...currentLevels, levelToAdd].sort((a, b) => a - b)
                };
            } else {
                return NextResponse.json({ success: true, message: "Already unlocked" });
            }
        } else if (type === 'revoke_level') {
            // 레벨 회수
            const currentLevels: number[] = profile?.purchased_levels || [];
            const levelToRemove = Number(value);

            updateData = {
                purchased_levels: currentLevels.filter(l => l !== levelToRemove)
            };
        }

        const { error } = await supabaseAdmin
            .from("profiles")
            .update(updateData)
            .eq("id", userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update user error:", error);
        // 상세 에러 로깅
        if (typeof error === 'object' && error !== null) {
            console.error(JSON.stringify(error, null, 2));
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
