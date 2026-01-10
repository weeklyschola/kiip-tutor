import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase 설정이 필요합니다 (.env)" }, { status: 500 });
    }

    const dummies = [
        { id: "test_user1", nickname: "열공하는학생", email: "student1@example.com" },
        { id: "test_user2", nickname: "합격가자", email: "pass2025@test.com" },
        { id: "kim_chulsu", nickname: "김철수", email: "kim@naver.com" },
        { id: "lee_young", nickname: "이영희", email: "lee@daum.net" },
        { id: "park_min", nickname: "박민수", email: "park@gmail.com" },
    ];

    const results = [];
    const errors = [];

    for (const user of dummies) {
        // 1. Auth 유저 생성 (비밀번호: 12341234)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: `${user.id}@kiip-tutor.local`, // 로그인용 가짜 이메일
            password: "password1234",
            email_confirm: true,
            user_metadata: { real_email: user.email }
        });

        if (authError) {
            console.error(`Auth create error for ${user.id}:`, authError);
            errors.push({ user: user.id, error: authError.message });
            continue;
        }

        if (authData.user) {
            // 2. Profile 생성
            const { error: profileError } = await supabaseAdmin
                .from("profiles")
                .insert({
                    id: authData.user.id,
                    user_id: user.id,
                    nickname: user.nickname,
                    email: user.email,
                    birth_date: "1990-01-01",
                    gender: "M",
                    nationality: "KR",
                    purchased_levels: [], // 빈 배열
                    premium_until: null
                });

            if (profileError) {
                console.error(`Profile create error for ${user.id}:`, profileError);
                // 롤백 (Auth 유저 삭제)
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                errors.push({ user: user.id, error: profileError.message });
            } else {
                results.push(user);
            }
        }
    }

    return NextResponse.json({
        message: `${results.length}명의 테스트 회원이 생성되었습니다.`,
        success: results,
        failed: errors
    });
}
