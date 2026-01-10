import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";

// Supabase 클라이언트 초기화
const supabase = getSupabase();
const supabaseAdmin = getSupabaseAdmin();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { user_id, password } = body;

        console.log(`[Login Attempt] ID: ${user_id}`);

        // 필수 필드 검증
        if (!user_id || !password) {
            return NextResponse.json(
                { success: false, error: "아이디와 비밀번호를 입력해주세요." },
                { status: 400 }
            );
        }

        // 아이디 정규화
        user_id = user_id.trim().toLowerCase();

        // Supabase 설정 확인 및 로그인 시도
        if (supabase && supabaseAdmin) {
            // 이메일 형식 구성 (signup과 동일한 규칙)
            // 만약 사용자가 이메일을 입력했다면 그대로 사용 (단, 가입 시 user_id 기반 이메일 사용 정책과 충돌 가능성 있음)
            const email = user_id.includes("@") ? user_id : `${user_id}@kiip-tutor.local`;
            console.log(`[Login] Attempting with constructed email: ${email}`);

            // 1. Supabase Auth 로그인
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError || !authData.user) {
                console.error(`[Login Failed] Error: ${authError?.message}`);
                return NextResponse.json(
                    {
                        success: false,
                        error: authError ? `로그인 실패: ${authError.message}` : "사용자 정보를 찾을 수 없습니다."
                    },
                    { status: 401 }
                );
            }

            console.log(`[Login Success] Auth User ID: ${authData.user.id}`);

            // 2. 추가 프로필 정보 조회 (이용권, 레벨 등)
            const { data: profile, error: profileError } = await supabaseAdmin
                .from("profiles")
                .select("*")
                .eq("id", authData.user.id)
                .single();

            if (profileError) {
                console.error("Profile fetch error:", profileError);
                // 프로필을 못 가져와도 로그인은 성공시키되, 기본값 사용
            }

            // 3. 사용자 정보 병합 및 반환
            const user = {
                id: authData.user.id,
                user_id: profile?.user_id || user_id,
                nickname: profile?.nickname || "Unknown",
                email: profile?.email || authData.user.email,
                birth_date: profile?.birth_date,
                gender: profile?.gender,
                nationality: profile?.nationality,
                created_at: profile?.created_at || authData.user.created_at,
                // 상품권(이용권) 관련 핵심 데이터
                premium_until: profile?.premium_until || null,
                purchased_levels: profile?.purchased_levels || [],
            };

            return NextResponse.json({
                success: true,
                user,
                session: authData.session // 세션 토큰도 필요할 경우 사용
            });
        }

        // ---------------------------------------------------------
        // Fallback: 로컬 Mock 모드 (Supabase 미설정 시)
        // ---------------------------------------------------------

        // 간단한 해시 함수
        const hashPassword = async (pwd: string) => {
            const encoder = new TextEncoder();
            const data = encoder.encode(pwd + "kiip_salt_2024");
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
        };

        const password_hash = await hashPassword(password);

        // 테스트 계정 확인
        if (user_id === "testuser" && password === "test1234") {
            return NextResponse.json({
                success: true,
                user: {
                    id: "test-uuid-1234",
                    user_id: "testuser",
                    nickname: "테스트",
                    premium_until: null,
                    purchased_levels: [],
                    created_at: new Date().toISOString()
                }
            });
        }

        return NextResponse.json(
            { success: false, error: "서버가 데이터베이스에 연결되지 않았습니다." },
            { status: 500 }
        );

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
