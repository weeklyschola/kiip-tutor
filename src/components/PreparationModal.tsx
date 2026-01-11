"use client";

interface PreparationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}

export default function PreparationModal({
    isOpen,
    onClose,
    title = "준비 중입니다",
    message = "더 좋은 서비스를 위해 열심히 준비하고 있습니다.\n곧 만나요!"
}: PreparationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all animate-scaleIn">
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl animate-bounce">🚧</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
                    <p className="text-gray-500 whitespace-pre-line leading-relaxed mb-8">
                        {message}
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}
