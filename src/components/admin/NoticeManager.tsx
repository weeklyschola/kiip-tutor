"use client";

import { useState, useEffect } from "react";

interface Notice {
    id: number;
    title: string;
    content: string;
    is_active: boolean;
    is_important: boolean;
    created_at: string;
}

interface NoticeManagerProps {
    isOpen: boolean;
    onClose: () => void;
    adminKey: string;
}

export default function NoticeManager({ isOpen, onClose, adminKey }: NoticeManagerProps) {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newNotice, setNewNotice] = useState({ title: "", content: "", is_important: false });

    useEffect(() => {
        if (isOpen) {
            fetchNotices();
        }
    }, [isOpen]);

    const fetchNotices = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/notices", {
                headers: { "x-admin-key": adminKey }
            });
            const data = await response.json();
            if (response.ok) setNotices(data);
        } catch (error) {
            console.error("Failed to fetch notices:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/admin/notices", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-key": adminKey
                },
                body: JSON.stringify(newNotice)
            });
            if (response.ok) {
                setIsAdding(false);
                setNewNotice({ title: "", content: "", is_important: false });
                fetchNotices();
            }
        } catch (error) {
            console.error("Failed to add notice:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            const response = await fetch(`/api/admin/notices?id=${id}`, {
                method: "DELETE",
                headers: { "x-admin-key": adminKey }
            });
            if (response.ok) fetchNotices();
        } catch (error) {
            console.error("Failed to delete notice:", error);
        }
    };

    const toggleStatus = async (notice: Notice) => {
        try {
            const response = await fetch("/api/admin/notices", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-key": adminKey
                },
                body: JSON.stringify({ ...notice, is_active: !notice.is_active })
            });
            if (response.ok) fetchNotices();
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-700">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>📢</span> 공지사항 관리
                        </h2>
                        <p className="text-gray-400 text-xs mt-1">학습자에게 노출될 공지사항을 관리합니다.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {!isAdding ? (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-400 text-sm">전체 {notices.length}개</span>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="px-4 py-2 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors text-sm font-bold shadow-lg flex items-center gap-2"
                                >
                                    <span>➕</span> 새 공지 등록
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-20 text-gray-500">로딩 중...</div>
                            ) : (
                                <div className="space-y-3">
                                    {notices.map((notice) => (
                                        <div key={notice.id} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600 hover:border-gray-500 transition-all">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {notice.is_important && (
                                                            <span className="bg-red-900/50 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-800">중요</span>
                                                        )}
                                                        {!notice.is_active && (
                                                            <span className="bg-gray-600 text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded">비활성</span>
                                                        )}
                                                        <h3 className="text-white font-bold">{notice.title}</h3>
                                                    </div>
                                                    <p className="text-gray-400 text-sm line-clamp-1">{notice.content}</p>
                                                    <p className="text-gray-500 text-[10px] mt-2">
                                                        {new Date(notice.created_at).toLocaleDateString("ko-KR")}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => toggleStatus(notice)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${notice.is_active ? "bg-amber-900/30 text-amber-400 border border-amber-800 hover:bg-amber-800/40" : "bg-green-900/30 text-green-400 border border-green-800 hover:bg-green-800/40"
                                                            }`}
                                                    >
                                                        {notice.is_active ? "숨기기" : "보이기"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(notice.id)}
                                                        className="px-3 py-1.5 bg-red-900/30 text-red-400 rounded-lg text-xs font-bold border border-red-800 hover:bg-red-800/40 transition-colors"
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {notices.length === 0 && (
                                        <div className="text-center py-20 text-gray-600 bg-gray-900/30 rounded-2xl border border-dashed border-gray-700">
                                            등록된 공지사항이 없습니다.
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <form onSubmit={handleAdd} className="space-y-6 max-w-2xl mx-auto py-4">
                            <h3 className="text-lg font-bold text-white mb-4">📢 새 공지사항 등록</h3>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">제목</label>
                                <input
                                    autoFocus
                                    required
                                    type="text"
                                    value={newNotice.title}
                                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="공지 제목을 입력하세요"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">내용</label>
                                <textarea
                                    required
                                    value={newNotice.content}
                                    onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white min-h-[150px] focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="공지 내용을 상세히 입력하세요"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={newNotice.is_important}
                                        onChange={(e) => setNewNotice({ ...newNotice, is_important: e.target.checked })}
                                        className="w-5 h-5 rounded-lg border-gray-700 text-red-600 focus:ring-0 focus:ring-offset-0 bg-gray-900"
                                    />
                                    <span className="text-gray-300 text-sm group-hover:text-white transition-colors">중요 공지로 표시 (리스트 상단 노출)</span>
                                </label>
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
                                >
                                    등록하기
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
