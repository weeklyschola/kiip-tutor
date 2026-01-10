import { NextRequest, NextResponse } from "next/server";

// 간단한 해시 함수 (signup과 동일)
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "kiip_salt_2024");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// 임시 사용자 저장소 (signup과 공유해야 하지만, 현재는 별도)
// 실제로는 Supabase 사용
const users: Map<string, {
    id: string;
    user_id: string;
    password_hash: string;
    nickname: string;
    birth_date: string;
    gender: string;
    nationality: string;
    created_at: string;
}> = new Map();

// 테스트용 기본 사용자 추가
(async () => {
    const testPasswordHash = await hashPassword("test1234");
    users.set("testuser", {
        id: "test-uuid-1234",
        user_id: "testuser",
        password_hash: testPasswordHash,
        nickname: "테스트",
        birth_date: "1990-01-01",
        gender: "other",
        nationality: "KR",
        created_at: new Date().toISOString(),
    });
})();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, password } = body;

        // 필수 필드 검증
        if (!user_id || !password) {
            return NextResponse.json(
                { success: false, error: "아이디와 비밀번호를 입력해주세요." },
                { status: 400 }
            );
        }

        // 사용자 찾기
        const user = users.get(user_id);

        if (!user) {
            return NextResponse.json(
                { success: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." },
                { status: 401 }
            );
        }

        // 비밀번호 검증
        const password_hash = await hashPassword(password);

        if (user.password_hash !== password_hash) {
            return NextResponse.json(
                { success: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." },
                { status: 401 }
            );
        }

        // 응답 (비밀번호 해시 제외)
        const { password_hash: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            success: true,
            user: userWithoutPassword,
        });
    } catch {
        return NextResponse.json(
            { success: false, error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
