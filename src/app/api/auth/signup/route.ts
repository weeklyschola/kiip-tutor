import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabase } from "@/lib/supabase";

// Service role 클라이언트 (서버 전용 - 사용자 생성용)
const supabaseAdmin = getSupabaseAdmin();

// 일반 클라이언트 (profiles 테이블 접근용)
const supabase = getSupabase();

// 임시 사용자 저장소 (Supabase 미설정 시 폴백)
const localUsers: Map<string, {
    id: string;
    user_id: string;
    email: string;
    password_hash: string;
    nickname: string;
    birth_date: string;
    gender: string;
    nationality: string;
    created_at: string;
}> = new Map();

// 간단한 해시 함수
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "kiip_salt_2024");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { user_id, email: userEmail, password, nickname, birth_date, gender, nationality } = body;

        console.log(`[Signup Attempt] ID: ${user_id}, Email: ${userEmail}`);

        // 필수 필드 검증
        if (!user_id || !userEmail || !password || !nickname || !birth_date || !gender || !nationality) {
            return NextResponse.json(
                { success: false, error: "모든 필드를 입력해주세요." },
                { status: 400 }
            );
        }

        // 아이디 정규화 (소문자, 공백제거)
        user_id = user_id.trim().toLowerCase();

        // 아이디 형식 검증
        if (!/^[a-zA-Z0-9]{4,20}$/.test(user_id)) {
            return NextResponse.json(
                { success: false, error: "아이디는 영문/숫자 4~20자로 입력해주세요." },
                { status: 400 }
            );
        }

        // 비밀번호 길이 검증
        if (password.length < 8) {
            return NextResponse.json(
                { success: false, error: "비밀번호는 8자 이상이어야 합니다." },
                { status: 400 }
            );
        }

        // Supabase Admin 사용 가능한 경우 (Service Role만 있어도 가입 처리는 가능)
        if (supabaseAdmin) {
            // 이메일 형식으로 변환 (Supabase Auth는 이메일 필요)
            const authEmail = `${user_id}@kiip-tutor.local`;

            // 1. Supabase Auth로 사용자 생성
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: authEmail,
                password,
                email_confirm: true, // 이메일 확인 없이 바로 활성화
                user_metadata: { real_email: userEmail } // 실제 이메일 저장
            });

            // 이메일 확인 강제 처리 확실하게 (혹시 위 옵션이 동작 안 할 경우)
            if (authData.user && !authData.user.email_confirmed_at) {
                await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
                    email_confirm: true
                });
            }

            if (authError) {
                if (authError.message.includes("already")) {
                    return NextResponse.json(
                        { success: false, error: "이미 사용 중인 아이디입니다." },
                        { status: 400 }
                    );
                }
                console.error("Auth error:", authError);
                return NextResponse.json(
                    { success: false, error: "회원가입 중 오류가 발생했습니다." },
                    { status: 500 }
                );
            }

            // 2. 프로필 정보 저장
            const { error: profileError } = await supabaseAdmin
                .from("profiles")
                .insert({
                    id: authData.user.id,
                    user_id,
                    email: userEmail, // 실제 이메일 저장
                    nickname,
                    birth_date,
                    gender,
                    nationality,
                    created_at: new Date().toISOString(), // 생성일 명시
                    purchased_levels: [], // 초기값
                    premium_until: null // 초기값
                });

            if (profileError) {
                console.error("Profile error:", profileError);
                // 사용자 삭제 (롤백)
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                return NextResponse.json(
                    { success: false, error: "프로필 저장 중 오류가 발생했습니다." },
                    { status: 500 }
                );
            }

            const user = {
                id: authData.user.id,
                user_id,
                nickname,
                birth_date,
                gender,
                nationality,
                created_at: authData.user.created_at,
            };

            return NextResponse.json({ success: true, user });
        }

        // 로컬 폴백 모드 (Supabase 미설정)
        if (localUsers.has(user_id)) {
            return NextResponse.json(
                { success: false, error: "이미 사용 중인 아이디입니다." },
                { status: 400 }
            );
        }

        const password_hash = await hashPassword(password);

        const newUser = {
            id: crypto.randomUUID(),
            user_id,
            email: userEmail,
            password_hash,
            nickname,
            birth_date,
            gender,
            nationality,
            created_at: new Date().toISOString(),
        };

        localUsers.set(user_id, newUser);

        const { password_hash: _, ...userWithoutPassword } = newUser;

        return NextResponse.json({
            success: true,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
