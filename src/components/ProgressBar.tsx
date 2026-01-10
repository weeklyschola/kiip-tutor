interface ProgressBarProps {
    value: number; // 0-100
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    color?: "primary" | "success" | "warning";
}

export default function ProgressBar({
    value,
    size = "md",
    showLabel = false,
    color = "primary"
}: ProgressBarProps) {
    const heights = {
        sm: "h-1.5",
        md: "h-2",
        lg: "h-3",
    };

    const colors = {
        primary: "from-blue-400 to-blue-600",
        success: "from-green-400 to-green-600",
        warning: "from-yellow-400 to-orange-500",
    };

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">진행률</span>
                    <span className="text-xs font-medium text-blue-600">{Math.round(value)}%</span>
                </div>
            )}
            <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heights[size]}`}>
                <div
                    className={`h-full bg-gradient-to-r ${colors[color]} rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
            </div>
        </div>
    );
}

// Circular Progress Component
interface CircularProgressProps {
    value: number;
    size?: number;
    strokeWidth?: number;
    children?: React.ReactNode;
}

export function CircularProgress({
    value,
    size = 80,
    strokeWidth = 8,
    children
}: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                />
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="100%" stopColor="#2563EB" />
                    </linearGradient>
                </defs>
            </svg>
            {children && (
                <div className="absolute inset-0 flex items-center justify-center">
                    {children}
                </div>
            )}
        </div>
    );
}
