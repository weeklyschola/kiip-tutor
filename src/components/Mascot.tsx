export default function Mascot({ emotion = "happy", size = "md" }: { emotion?: "happy" | "neutral" | "sad" | "talking"; size?: "sm" | "md" | "lg" }) {
    const sizeClass = size === "sm" ? "w-16 h-16" : size === "lg" ? "w-32 h-32" : "w-24 h-24";

    // 간단한 SVG 캐릭터 (귀여운 곰돌이)
    return (
        <div className={`${sizeClass} relative`}>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                {/* 몸통 */}
                <circle cx="50" cy="50" r="45" fill="#FFC107" />
                <circle cx="50" cy="50" r="40" fill="#FFD54F" />

                {/* 귀 */}
                <circle cx="20" cy="20" r="15" fill="#FFC107" />
                <circle cx="80" cy="20" r="15" fill="#FFC107" />
                <circle cx="20" cy="20" r="10" fill="#FFD54F" />
                <circle cx="80" cy="20" r="10" fill="#FFD54F" />

                {/* 눈 */}
                <circle cx="35" cy="45" r="5" fill="#3E2723" />
                <circle cx="65" cy="45" r="5" fill="#3E2723" />

                {/* 눈 하이라이트 */}
                <circle cx="37" cy="43" r="2" fill="white" />
                <circle cx="67" cy="43" r="2" fill="white" />

                {/* 입 (감정에 따라 변화) */}
                {emotion === "happy" && (
                    <path d="M 35 60 Q 50 75 65 60" fill="none" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
                )}
                {emotion === "neutral" && (
                    <path d="M 40 65 L 60 65" fill="none" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
                )}
                {emotion === "sad" && (
                    <path d="M 35 70 Q 50 60 65 70" fill="none" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" />
                )}
                {emotion === "talking" && (
                    <ellipse cx="50" cy="65" rx="10" ry="8" fill="#3E2723" />
                )}

                {/* 코 */}
                <ellipse cx="50" cy="55" rx="6" ry="4" fill="#3E2723" />

                {/* 볼터치 */}
                <ellipse cx="25" cy="60" rx="6" ry="3" fill="#FFAB91" opacity="0.6" />
                <ellipse cx="75" cy="60" rx="6" ry="3" fill="#FFAB91" opacity="0.6" />
            </svg>
        </div>
    );
}
