interface AdBannerProps {
    className?: string;
    size?: "small" | "medium" | "large";
}

export default function AdBanner({ className = "", size = "medium" }: AdBannerProps) {
    const heights = {
        small: "h-16",
        medium: "h-24",
        large: "h-32",
    };

    return (
        <div
            className={`bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-500 text-sm border border-gray-200 ${heights[size]} ${className}`}
        >
            <p>📢 광고 영역</p>
            <p className="text-xs mt-1">이 광고 수익은 서비스 운영에 사용됩니다</p>

            {/* 
      Google AdSense Integration:
      1. Sign up at https://adsense.google.com
      2. Replace below with your ad code:
      
      <ins className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
        data-ad-slot="YOUR_AD_SLOT_ID"
        data-ad-format="auto"
        data-full-width-responsive="true">
      </ins>
      */}
        </div>
    );
}
