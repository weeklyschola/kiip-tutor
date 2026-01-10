"use client";

interface DetailedExplanationProps {
    question: string;
    options: string[];
    selectedAnswer: number;
    correctAnswer: number;
    explanation: string;
    category: string;
    additionalInfo?: {
        background?: string;
        tips?: string[];
        relatedTopics?: string[];
    };
}

export default function DetailedExplanation({
    question,
    options,
    selectedAnswer,
    correctAnswer,
    explanation,
    category,
    additionalInfo,
}: DetailedExplanationProps) {
    // 기본 추가 정보 생성 (실제로는 문제 데이터에 포함되어야 함)
    const defaultInfo = {
        background: getBackgroundInfo(category),
        tips: getTips(category),
        relatedTopics: getRelatedTopics(category),
    };

    const info = additionalInfo || defaultInfo;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* 문제 요약 */}
            <div className="p-4 bg-red-50 border-b border-red-100">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-500">❌</span>
                    <span className="text-sm font-medium text-red-700">오답</span>
                    <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {category}
                    </span>
                </div>
                <p className="text-gray-800 font-medium">{question}</p>
            </div>

            {/* 정오답 비교 */}
            <div className="p-4 border-b">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-xs text-red-600 mb-1">내 답변</div>
                        <div className="text-red-700 font-medium">{options[selectedAnswer]}</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-xs text-green-600 mb-1">정답</div>
                        <div className="text-green-700 font-medium">{options[correctAnswer]}</div>
                    </div>
                </div>
            </div>

            {/* 해설 */}
            <div className="p-4 border-b">
                <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
                    <span className="text-lg">💡</span> 해설
                </h4>
                <p className="text-gray-700 leading-relaxed">{explanation}</p>
            </div>

            {/* 배경 지식 */}
            {info.background && (
                <div className="p-4 border-b bg-blue-50">
                    <h4 className="flex items-center gap-2 font-bold text-blue-800 mb-3">
                        <span className="text-lg">📚</span> 배경 지식
                    </h4>
                    <p className="text-blue-700 leading-relaxed">{info.background}</p>
                </div>
            )}

            {/* 학습 팁 */}
            {info.tips && info.tips.length > 0 && (
                <div className="p-4 border-b">
                    <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
                        <span className="text-lg">✨</span> 학습 팁
                    </h4>
                    <ul className="space-y-2">
                        {info.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-700">
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 연관 주제 */}
            {info.relatedTopics && info.relatedTopics.length > 0 && (
                <div className="p-4">
                    <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
                        <span className="text-lg">🔗</span> 연관 주제
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {info.relatedTopics.map((topic, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// 카테고리별 기본 배경 정보
function getBackgroundInfo(category: string): string {
    const backgrounds: Record<string, string> = {
        "한국 역사/문화": "한국의 역사와 문화는 KIIP 시험에서 중요한 비중을 차지합니다. 특히 조선시대, 일제강점기, 현대사는 자주 출제됩니다.",
        "한국 생활": "한국에서의 일상생활에 필요한 정보들입니다. 공공기관 이용, 의료, 교육 등 실생활에서 꼭 필요한 내용입니다.",
        "한국어": "한국어의 기본 문법과 표현은 의사소통의 기초입니다. 존댓말과 반말의 사용, 상황에 맞는 표현을 익히세요.",
        "법과 제도": "대한민국 법률과 제도에 관한 기본 지식입니다. 외국인 체류, 비자, 취업 관련 법규를 알아두면 좋습니다.",
    };
    return backgrounds[category] || "이 분야는 KIIP 시험에서 자주 출제되는 중요한 주제입니다.";
}

// 카테고리별 기본 팁
function getTips(category: string): string[] {
    const tips: Record<string, string[]> = {
        "한국 역사/문화": [
            "주요 역사 인물과 그들의 업적을 연결해서 기억하세요",
            "국경일의 날짜와 의미를 함께 외우세요",
            "역사적 사건의 순서를 타임라인으로 정리하면 도움이 됩니다",
        ],
        "한국 생활": [
            "실제 생활에서 경험한 상황과 연결해서 기억하세요",
            "공공기관 방문 시 필요한 서류를 미리 알아두세요",
            "주변 한국인 친구에게 실제 경험담을 들어보세요",
        ],
        "한국어": [
            "드라마나 예능을 통해 자연스러운 표현을 익히세요",
            "매일 10분씩 한국어로 일기를 써보세요",
            "상황별 표현을 묶어서 외우면 효과적입니다",
        ],
        "법과 제도": [
            "출입국관리사무소 홈페이지에서 최신 정보를 확인하세요",
            "비자 종류별 차이점을 표로 정리해보세요",
            "자주 바뀌는 규정은 뉴스를 통해 업데이트하세요",
        ],
    };
    return tips[category] || ["문제 유형을 파악하고 비슷한 문제를 많이 풀어보세요", "오답 노트를 만들어 반복 학습하세요"];
}

// 카테고리별 연관 주제
function getRelatedTopics(category: string): string[] {
    const topics: Record<string, string[]> = {
        "한국 역사/문화": ["조선시대", "대한민국 정부", "전통문화", "국경일"],
        "한국 생활": ["주민센터", "건강보험", "교육제도", "주거"],
        "한국어": ["존댓말", "일상회화", "문법", "발음"],
        "법과 제도": ["체류자격", "근로계약", "사회보험", "입출국"],
    };
    return topics[category] || [];
}
