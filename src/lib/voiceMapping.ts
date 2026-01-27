// 화자별 음성 매핑
// 화자 이름에 따라 다른 목소리를 자동 할당
export const getSpeakerVoice = (speaker: string): string => {
    // 남성 이름 (일반적인 한국 남자 이름)
    const maleNames = ["민수", "철수", "영수", "준호", "지훈", "성민", "태양", "동현"];
    // 여성 이름 (일반적인 한국 여자 이름)
    const femaleNames = ["투이", "민지", "수지", "지은", "혜진", "서연", "유진", "은지"];

    const speakerLower = speaker.toLowerCase();

    // 남성 이름인 경우 - 남성 목소리 (Neural2 - 최신 자연스러운 음성)
    if (maleNames.some(name => speakerLower.includes(name.toLowerCase()))) {
        return "ko-KR-Neural2-C";
    }

    // 여성 이름인 경우 - 여성 목소리 (Neural2)
    if (femaleNames.some(name => speakerLower.includes(name.toLowerCase()))) {
        return "ko-KR-Neural2-A";
    }

    // 화자 순서로 교대 (기본값)
    // 첫 번째 화자: 여성, 두 번째: 남성
    // Neural2 음성 모델 사용 (Wavenet보다 자연스러움)
    const hash = speaker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % 2 === 0 ? "ko-KR-Neural2-A" : "ko-KR-Neural2-C";
};
