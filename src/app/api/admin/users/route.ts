import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// 관리자 권한 클라이언트
const supabaseAdmin = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function GET(request: NextRequest) {
    // 1. 관리자 키 검증
    const adminKey = request.headers.get("x-admin-key");
    if (adminKey !== "kiip-admin-2026") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
        // Supabase 미설정 시 더미 데이터 반환 (테스트용)
        if (!supabaseUrl) {
            return NextResponse.json({
                users: [
                    { id: "1", user_id: "test_user1", nickname: "열공하는학생", created_at: new Date().toISOString(), premium_until: null },
                    { id: "2", user_id: "test_user2", nickname: "합격가자", created_at: new Date().toISOString(), premium_until: "2026-12-31T23:59:59Z" }
                ]
            });
        }
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
        } else if (type === 'level') {
            // 기존 레벨 목록 가져오기
            // profiles 테이블에 purchased_levels (int array) 컬럼 가정
            const currentLevels: number[] = profile?.purchased_levels || [];
            const levelToAdd = Number(value);

            if (!currentLevels.includes(levelToAdd)) {
                updateData = {
                    purchased_levels: [...currentLevels, levelToAdd].sort()
                };
            } else {
                return NextResponse.json({ success: true, message: "Already unlocked" });
            }
        }

        const { error } = await supabaseAdmin
            .from("profiles")
            .update(updateData)
            .eq("id", userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
