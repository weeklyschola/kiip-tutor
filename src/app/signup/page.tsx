"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const NATIONALITIES = [
    { code: "CN", name: "중국" },
    { code: "VN", name: "베트남" },
    { code: "TH", name: "태국" },
    { code: "US", name: "미국" },
    { code: "UZ", name: "우즈베키스탄" },
    { code: "PH", name: "필리핀" },
    { code: "KH", name: "캄보디아" },
    { code: "ID", name: "인도네시아" },
    { code: "JP", name: "일본" },
    { code: "NP", name: "네팔" },
    { code: "OTHER", name: "기타" },
];

export default function SignupPage() {
    const router = useRouter();
    const { signup } = useAuth();

    const [formData, setFormData] = useState({
        user_id: "",
        email: "",
        password: "",
        password_confirm: "",
        nickname: "",
        birth_year: "",
        birth_month: "",
        birth_day: "",
        gender: "",
        nationality: "",
    });

    const [termsAgreed, setTermsAgreed] = useState({
        service: false,
        privacy: false,
    });

    const [showTerms, setShowTerms] = useState<"service" | "privacy" | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const validateForm = () => {
        // ID 검증
        if (!/^[a-zA-Z0-9]{4,20}$/.test(formData.user_id)) {
            setError("아이디는 영문/숫자 4~20자로 입력해주세요.");
            return false;
        }

        // 이메일 검증
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError("유효한 이메일 주소를 입력해주세요.");
            return false;
        }

        // 비밀번호 검증
        if (formData.password.length < 8) {
            setError("비밀번호는 8자 이상이어야 합니다.");
            return false;
        }

        if (formData.password !== formData.password_confirm) {
            setError("비밀번호가 일치하지 않습니다.");
            return false;
        }

        // 별명 검증
        if (formData.nickname.length < 2 || formData.nickname.length > 20) {
            setError("별명은 2~20자로 입력해주세요.");
            return false;
        }

        // 생년월일 검증
        if (!formData.birth_year || !formData.birth_month || !formData.birth_day) {
            setError("생년월일을 모두 입력해주세요.");
            return false;
        }

        // 성별 검증
        if (!formData.gender) {
            setError("성별을 선택해주세요.");
            return false;
        }

        // 국적 검증
        if (!formData.nationality) {
            setError("국적을 선택해주세요.");
            return false;
        }

        // 약관 동의 검증
        if (!termsAgreed.service || !termsAgreed.privacy) {
            setError("필수 약관에 모두 동의해주세요.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setError("");

        const birth_date = `${formData.birth_year}-${formData.birth_month.padStart(2, "0")}-${formData.birth_day.padStart(2, "0")}`;

        const result = await signup({
            user_id: formData.user_id,
            email: formData.email,
            password: formData.password,
            nickname: formData.nickname,
            birth_date,
            gender: formData.gender,
            nationality: formData.nationality,
        });

        setIsLoading(false);

        if (result.success) {
            router.push("/study");
        } else {
            setError(result.error || "회원가입에 실패했습니다.");
        }
    };

    // 연도 옵션 생성 (1940 ~ 2010)
    const years = Array.from({ length: 71 }, (_, i) => 2010 - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-8 px-4">
            <div className="max-w-md mx-auto">
                {/* 헤더 */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">🇰🇷 KIIP 튜터</h1>
                    <p className="text-blue-200">회원가입</p>
                </div>

                {/* 회원가입 폼 */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
                    {/* 아이디 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            아이디 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="user_id"
                            value={formData.user_id}
                            onChange={handleChange}
                            placeholder="영문/숫자 4~20자"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 이메일 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            이메일 (연락처) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="example@email.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 비밀번호 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            비밀번호 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="8자 이상"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 비밀번호 확인 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            비밀번호 확인 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            name="password_confirm"
                            value={formData.password_confirm}
                            onChange={handleChange}
                            placeholder="비밀번호 재입력"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 별명 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            별명 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nickname"
                            value={formData.nickname}
                            onChange={handleChange}
                            placeholder="2~20자"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* 생년월일 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            생년월일 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <select
                                name="birth_year"
                                value={formData.birth_year}
                                onChange={handleChange}
                                className="flex-1 px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">년도</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}년
                                    </option>
                                ))}
                            </select>
                            <select
                                name="birth_month"
                                value={formData.birth_month}
                                onChange={handleChange}
                                className="w-24 px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">월</option>
                                {months.map((month) => (
                                    <option key={month} value={month}>
                                        {month}월
                                    </option>
                                ))}
                            </select>
                            <select
                                name="birth_day"
                                value={formData.birth_day}
                                onChange={handleChange}
                                className="w-24 px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">일</option>
                                {days.map((day) => (
                                    <option key={day} value={day}>
                                        {day}일
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 성별 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            성별 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                            {[
                                { value: "male", label: "남성" },
                                { value: "female", label: "여성" },
                                { value: "other", label: "선택안함" },
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex-1 py-3 text-center rounded-xl border-2 cursor-pointer transition-all ${formData.gender === option.value
                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                        : "border-gray-300 hover:border-gray-400"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="gender"
                                        value={option.value}
                                        checked={formData.gender === option.value}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 국적 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            국적 <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="nationality"
                            value={formData.nationality}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">국적을 선택하세요</option>
                            {NATIONALITIES.map((nation) => (
                                <option key={nation.code} value={nation.code}>
                                    {nation.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 약관 동의 */}
                    <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={termsAgreed.service}
                                    onChange={(e) =>
                                        setTermsAgreed({ ...termsAgreed, service: e.target.checked })
                                    }
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm">
                                    <span className="text-red-500">[필수]</span> 서비스 이용약관 동의
                                </span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowTerms("service")}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                보기
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={termsAgreed.privacy}
                                    onChange={(e) =>
                                        setTermsAgreed({ ...termsAgreed, privacy: e.target.checked })
                                    }
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm">
                                    <span className="text-red-500">[필수]</span> 개인정보 수집 및 이용 동의
                                </span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowTerms("privacy")}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                보기
                            </button>
                        </div>

                        {/* 전체 동의 */}
                        <label className="flex items-center gap-2 cursor-pointer pt-2">
                            <input
                                type="checkbox"
                                checked={termsAgreed.service && termsAgreed.privacy}
                                onChange={(e) =>
                                    setTermsAgreed({
                                        service: e.target.checked,
                                        privacy: e.target.checked,
                                    })
                                }
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium">전체 동의</span>
                        </label>
                    </div>

                    {/* 에러 메시지 */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* 가입 버튼 */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "가입 중..." : "회원가입"}
                    </button>

                    {/* 로그인 링크 */}
                    <p className="text-center text-gray-600 text-sm">
                        이미 계정이 있으신가요?{" "}
                        <Link href="/login" className="text-blue-600 font-medium hover:underline">
                            로그인
                        </Link>
                    </p>
                </form>

                {/* 홈으로 돌아가기 */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-blue-200 hover:text-white text-sm">
                        ← 대시보드로 돌아가기
                    </Link>
                </div>
            </div>

            {/* 약관 모달 */}
            {showTerms && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-bold text-lg">
                                {showTerms === "service" ? "서비스 이용약관" : "개인정보 수집 및 이용 동의"}
                            </h3>
                            <button
                                onClick={() => setShowTerms(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 text-sm text-gray-700 leading-relaxed">
                            {showTerms === "service" ? (
                                <>
                                    <p className="mb-4 text-gray-500">시행일: 2025년 1월 1일</p>

                                    <h4 className="font-bold mb-2">제1조 (목적)</h4>
                                    <p className="mb-4">
                                        이 약관은 KIIP 튜터(이하 &quot;회사&quot;)가 제공하는 사회통합프로그램(KIIP) 학습 서비스(이하 &quot;서비스&quot;)의 이용조건 및 절차, 회사와 회원 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                                    </p>

                                    <h4 className="font-bold mb-2">제2조 (정의)</h4>
                                    <p className="mb-4">
                                        ① &quot;서비스&quot;란 회사가 제공하는 KIIP 학습 콘텐츠, CBT 모의고사, AI 튜터, 어휘 학습 등 일체의 온라인 학습 서비스를 말합니다.<br />
                                        ② &quot;회원&quot;이란 이 약관에 동의하고 회원가입을 완료하여 서비스를 이용하는 자를 말합니다.<br />
                                        ③ &quot;아이디(ID)&quot;란 회원 식별과 서비스 이용을 위하여 회원이 설정하고 회사가 승인한 문자와 숫자의 조합을 말합니다.<br />
                                        ④ &quot;비밀번호&quot;란 회원의 비밀 보호를 위하여 회원 자신이 설정한 문자와 숫자 등의 조합을 말합니다.
                                    </p>

                                    <h4 className="font-bold mb-2">제3조 (약관의 효력 및 변경)</h4>
                                    <p className="mb-4">
                                        ① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.<br />
                                        ② 회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 제1항과 같은 방법으로 공지합니다.<br />
                                        ③ 회원은 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다. 변경된 약관의 효력 발생일 이후에도 서비스를 계속 이용할 경우 약관 변경에 동의한 것으로 간주합니다.
                                    </p>

                                    <h4 className="font-bold mb-2">제4조 (회원가입)</h4>
                                    <p className="mb-4">
                                        ① 서비스 이용을 원하는 자는 회사가 정한 가입 양식에 따라 회원정보를 기입하고 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.<br />
                                        ② 회사는 다음 각 호에 해당하는 경우 회원가입을 거부할 수 있습니다.<br />
                                        1. 등록 내용에 허위, 기재누락, 오기가 있는 경우<br />
                                        2. 기타 회원으로 등록하는 것이 서비스 운영에 현저히 지장이 있다고 판단되는 경우
                                    </p>

                                    <h4 className="font-bold mb-2">제5조 (서비스 이용)</h4>
                                    <p className="mb-4">
                                        ① 서비스는 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.<br />
                                        ② 회사는 시스템 정기점검, 증설 및 교체, 설비의 장애, 서비스 이용량 폭주, 국가비상사태, 천재지변 등의 불가항력적 사유로 인하여 서비스 제공이 불가능한 경우 서비스의 제공을 일시적으로 중단할 수 있습니다.<br />
                                        ③ 유료 서비스(프리미엄)의 경우 별도로 정하는 바에 따라 이용 가능합니다.
                                    </p>

                                    <h4 className="font-bold mb-2">제6조 (회원의 의무)</h4>
                                    <p className="mb-4">
                                        ① 회원은 다음 행위를 하여서는 안 됩니다.<br />
                                        1. 회원가입 신청 또는 변경 시 허위 내용의 등록<br />
                                        2. 타인의 정보 도용 또는 부정 사용<br />
                                        3. 회사 및 제3자의 지적재산권 침해<br />
                                        4. 회사 및 제3자의 명예를 손상시키거나 업무를 방해하는 행위<br />
                                        5. 외설 또는 폭력적인 메시지, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위<br />
                                        6. 서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 배포하거나 상업적으로 이용하는 행위<br />
                                        7. 기타 불법적이거나 부당한 행위<br />
                                        ② 회원은 자신의 아이디 및 비밀번호를 관리할 책임이 있으며, 이를 제3자에게 이용하게 하여서는 안 됩니다.
                                    </p>

                                    <h4 className="font-bold mb-2">제7조 (서비스 이용제한 및 계정 정지)</h4>
                                    <p className="mb-4">
                                        회사는 회원이 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 사전 통보 후 서비스 이용을 제한하거나 계정을 정지할 수 있습니다. 다만, 긴급히 조치할 필요가 있는 경우 사전 통보 없이 조치할 수 있습니다.
                                    </p>

                                    <h4 className="font-bold mb-2">제8조 (회원 탈퇴 및 자격 상실)</h4>
                                    <p className="mb-4">
                                        ① 회원은 언제든지 서비스 내 탈퇴 기능을 통해 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.<br />
                                        ② 회원 탈퇴 시 회원의 개인정보 및 학습 데이터는 관계 법령에서 정한 경우를 제외하고 즉시 파기됩니다.
                                    </p>

                                    <h4 className="font-bold mb-2">제9조 (저작권의 귀속 및 이용제한)</h4>
                                    <p className="mb-4">
                                        ① 서비스에 포함된 콘텐츠(문제, 해설, 학습자료 등)에 대한 저작권 및 기타 지적재산권은 회사에 귀속됩니다.<br />
                                        ② 회원은 서비스를 이용함으로써 얻은 정보를 회사의 사전 서면 동의 없이 복제, 전송, 출판, 배포, 방송 기타 방법으로 이용하거나 제3자에게 제공할 수 없습니다.
                                    </p>

                                    <h4 className="font-bold mb-2">제10조 (면책조항)</h4>
                                    <p className="mb-4">
                                        ① 회사는 천재지변, 전쟁, 서비스 설비의 장애 또는 이용량 폭주 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.<br />
                                        ② 회사는 회원의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.<br />
                                        ③ 서비스에서 제공하는 학습 콘텐츠는 참고용이며, 실제 KIIP 시험 결과와 다를 수 있습니다.
                                    </p>

                                    <h4 className="font-bold mb-2">제11조 (분쟁 해결)</h4>
                                    <p className="mb-4">
                                        ① 이 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.<br />
                                        ② 서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.
                                    </p>

                                    <p className="mt-6 text-gray-500 text-xs">부칙: 이 약관은 2025년 1월 1일부터 시행됩니다.</p>
                                </>
                            ) : (
                                <>
                                    <p className="mb-4 text-gray-500">시행일: 2025년 1월 1일</p>

                                    <p className="mb-4">
                                        KIIP 튜터(이하 &quot;회사&quot;)는 개인정보 보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 관련 법령을 준수하며, 이용자의 개인정보 보호에 최선을 다하고 있습니다.
                                    </p>

                                    <h4 className="font-bold mb-2">1. 수집하는 개인정보 항목</h4>
                                    <p className="mb-4">
                                        회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.<br /><br />
                                        <strong>가. 필수 수집 항목</strong><br />
                                        - 아이디, 비밀번호, 별명<br />
                                        - 생년월일, 성별, 국적<br /><br />
                                        <strong>나. 자동 수집 항목</strong><br />
                                        - 학습 기록 (진도율, 정답률, 학습 시간 등)<br />
                                        - 오답 데이터 및 문제 풀이 기록<br />
                                        - 접속 IP 주소, 접속 일시, 서비스 이용 기록<br />
                                        - 기기 정보 (브라우저 종류, OS)
                                    </p>

                                    <h4 className="font-bold mb-2">2. 개인정보의 수집 및 이용 목적</h4>
                                    <p className="mb-4">
                                        수집한 개인정보는 다음 목적으로만 이용됩니다.<br /><br />
                                        <strong>가. 서비스 제공</strong><br />
                                        - 회원 식별 및 인증<br />
                                        - 학습 콘텐츠 제공 및 학습 이력 관리<br />
                                        - AI 튜터 기능 제공<br /><br />
                                        <strong>나. 회원 관리</strong><br />
                                        - 회원제 서비스 이용에 따른 본인 확인<br />
                                        - 부정 이용 방지 및 비인가 사용 방지<br /><br />
                                        <strong>다. 서비스 개선</strong><br />
                                        - 맞춤형 학습 콘텐츠 추천<br />
                                        - 학습 통계 분석 및 서비스 품질 개선<br />
                                        - 신규 기능 개발 및 연구
                                    </p>

                                    <h4 className="font-bold mb-2">3. 개인정보의 보유 및 이용 기간</h4>
                                    <p className="mb-4">
                                        ① 회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다.<br />
                                        ② 단, 관계 법령에 의한 보존이 필요한 경우 해당 기간 동안 보관합니다.<br />
                                        - 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)<br />
                                        - 소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)<br />
                                        - 접속에 관한 기록: 3개월 (통신비밀보호법)
                                    </p>

                                    <h4 className="font-bold mb-2">4. 개인정보의 제3자 제공</h4>
                                    <p className="mb-4">
                                        회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.<br />
                                        - 이용자가 사전에 동의한 경우<br />
                                        - 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우
                                    </p>

                                    <h4 className="font-bold mb-2">5. 개인정보의 처리 위탁</h4>
                                    <p className="mb-4">
                                        회사는 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.<br /><br />
                                        - 클라우드 서버 운영: Supabase Inc. (데이터 저장·관리)<br />
                                        - AI 서비스: OpenAI, Google (AI 튜터 기능 제공)
                                    </p>

                                    <h4 className="font-bold mb-2">6. 개인정보의 파기 절차 및 방법</h4>
                                    <p className="mb-4">
                                        ① 파기 절차: 수집·이용 목적이 달성된 후 내부 방침 및 관련 법령에 따라 일정 기간 보관 후 파기합니다.<br />
                                        ② 파기 방법<br />
                                        - 전자적 파일 형태: 복구 불가능한 방법으로 영구 삭제<br />
                                        - 종이 문서: 분쇄 또는 소각
                                    </p>

                                    <h4 className="font-bold mb-2">7. 이용자의 권리와 행사 방법</h4>
                                    <p className="mb-4">
                                        ① 이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있습니다.<br />
                                        ② 이용자는 회원탈퇴를 통해 개인정보의 수집·이용 동의를 철회할 수 있습니다.<br />
                                        ③ 개인정보 열람, 정정, 삭제, 처리정지 요청은 서비스 내 설정 또는 고객센터를 통해 가능합니다.
                                    </p>

                                    <h4 className="font-bold mb-2">8. 개인정보 보호를 위한 기술적·관리적 대책</h4>
                                    <p className="mb-4">
                                        ① 비밀번호 암호화: 회원의 비밀번호는 암호화되어 저장·관리됩니다.<br />
                                        ② 해킹 등에 대비한 대책: SSL 암호화 통신, 방화벽 등 보안 시스템을 갖추고 있습니다.<br />
                                        ③ 개인정보 취급 직원의 최소화 및 교육 실시
                                    </p>

                                    <h4 className="font-bold mb-2">9. 개인정보 보호책임자</h4>
                                    <p className="mb-4">
                                        - 직책: 개인정보 보호책임자<br />
                                        - 연락처: support@kiip-tutor.com
                                    </p>

                                    <h4 className="font-bold mb-2">10. 동의 거부권 및 불이익 안내</h4>
                                    <p className="mb-4">
                                        이용자는 필수 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수 항목에 대한 동의를 거부할 경우 회원가입 및 서비스 이용이 제한됩니다.
                                    </p>

                                    <h4 className="font-bold mb-2">11. 개인정보 처리방침의 변경</h4>
                                    <p className="mb-4">
                                        이 개인정보 처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용의 추가, 삭제 및 수정이 있을 수 있으며, 변경 시에는 서비스 내 공지사항을 통해 안내드립니다.
                                    </p>

                                    <p className="mt-6 text-gray-500 text-xs">부칙: 이 개인정보 처리방침은 2025년 1월 1일부터 시행됩니다.</p>
                                </>
                            )}
                        </div>
                        <div className="p-4 border-t">
                            <button
                                onClick={() => {
                                    if (showTerms === "service") {
                                        setTermsAgreed({ ...termsAgreed, service: true });
                                    } else {
                                        setTermsAgreed({ ...termsAgreed, privacy: true });
                                    }
                                    setShowTerms(null);
                                }}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                            >
                                동의합니다
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
