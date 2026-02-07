// 화자별 음성 매핑
// 화자 이름 또는 성별에 따라 다른 목소리를 자동 할당
export const getSpeakerVoice = (speaker: string, gender?: "male" | "female"): string => {
    // 1. 명시적인 성별이 제공된 경우 우선 적용
    if (gender === "male") return "ko-KR-Neural2-C";
    if (gender === "female") return "ko-KR-Neural2-A";

    // 2. 역할/명칭 기반 자동 감지 (여성)
    const femaleRoles = ["선생님", "은행원", "접수직원", "직원", "약사", "상대방"];
    const femaleNames = ["투이", "민지", "수지", "지은", "혜진", "서연", "유진", "은지", "나나", "링링"];

    // 3. 역할/명칭 기반 자동 감지 (남성)
    const maleRoles = ["팀장", "공인중개사", "택시 기사", "부동산 중개인"];
    const maleNames = ["민수", "철수", "영수", "준호", "지훈", "성민", "태양", "동현", "마크", "폴"];

    const speakerLower = speaker.toLowerCase();

    // 여성 체크
    if (
        femaleNames.some(name => speakerLower.includes(name.toLowerCase())) ||
        femaleRoles.some(role => speakerLower.includes(role.toLowerCase()))
    ) {
        return "ko-KR-Neural2-A";
    }

    // 남성 체크
    if (
        maleNames.some(name => speakerLower.includes(name.toLowerCase())) ||
        maleRoles.some(role => speakerLower.includes(role.toLowerCase()))
    ) {
        return "ko-KR-Neural2-C";
    }

    // 4. 화자 순서로 교대 (기본값)
    // 화자 이름의 해시값을 사용하여 남/여 목소리 교대
    const hash = speaker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % 2 === 0 ? "ko-KR-Neural2-A" : "ko-KR-Neural2-C";
};
