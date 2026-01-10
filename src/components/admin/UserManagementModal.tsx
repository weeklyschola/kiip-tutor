"use client";

import { useState, useEffect } from "react";

interface User {
    id: string;
    user_id: string;
    nickname: string;
    created_at: string;
    premium_until: string | null;
    purchased_levels: number[]; // DB에서 가져온 레벨 목록
    email?: string;
}

interface UserManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    adminKey: string;
}

export default function UserManagementModal({ isOpen, onClose, adminKey }: UserManagementModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // 선택된 유저 및 지급 모달 상태
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [grantType, setGrantType] = useState<"subscription" | "level">("subscription");
    const [showGrantModal, setShowGrantModal] = useState(false);

    // 사용자 목록 불러오기
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users", {
                headers: { "x-admin-key": adminKey }
            });
            const data = await res.json();
            if (data.users) {
                // purchased_levels가 null일 경우 빈 배열로 처리
                const sanitizedUsers = data.users.map((u: any) => ({
                    ...u,
                    purchased_levels: u.purchased_levels || []
                }));
                setUsers(sanitizedUsers);
            }
        } catch (error) {
            console.error(error);
            alert("사용자 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    // 이용권 지급 (구독 기간)
    const grantSubscription = async (days: number) => {
        if (!selectedUser) return;

        const date = new Date();
        // 기존 만료일이 남아있으면 그 이후부터 연장하고 싶지만, 
        // 관리자 권한으로 '지금부터 N일' 또는 '특정 날짜까지'로 덮어쓰는 게 명확함.
        // 여기서는 오늘부터 +days로 설정. (만료일 연장 로직은 복잡해지므로 단순화)

        let targetDate = new Date();
        if (selectedUser.premium_until && new Date(selectedUser.premium_until) > new Date()) {
            targetDate = new Date(selectedUser.premium_until);
        }
        targetDate.setDate(targetDate.getDate() + days);

        if (days === 9999) {
            targetDate = new Date();
            targetDate.setFullYear(targetDate.getFullYear() + 100);
        }

        const finalDate = targetDate.toISOString();

        await callApi({
            userId: selectedUser.id,
            type: "subscription",
            value: finalDate
        });
    };

    // 이용권 지급 (레벨 해금)
    const grantLevel = async (level: number) => {
        if (!selectedUser) return;
        await callApi({
            userId: selectedUser.id,
            type: "level",
            value: level
        });
    };

    const callApi = async (body: any) => {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert("적용되었습니다.");
                fetchUsers(); // 목록 갱신
                // 모달 닫지 않음 (연속 지급 가능하게)
            } else {
                alert("실패했습니다.");
            }
        } catch (e) {
            alert("오류가 발생했습니다.");
        }
    };

    const handleEmail = (user: User) => {
        let email = user.email;
        if (!email && user.user_id.includes("@")) email = user.user_id;

        if (email) {
            window.location.href = `mailto:${email}`;
        } else {
            alert("이메일 정보가 없습니다.");
        }
    };

    const handleEmailAll = () => {
        // 모든 유저의 이메일 수집 (또는 이메일 형식 아이디)
        const emails = users
            .map(u => u.email || (u.user_id.includes("@") ? u.user_id : null))
            .filter(e => e !== null);

        if (emails.length === 0) {
            alert("발송 가능한 이메일이 없습니다.");
            return;
        }

        // BCC로 전체 발송 (개인정보 보호)
        window.location.href = `mailto:?bcc=${emails.join(",")}&subject=[KIIP 튜터] 전체 공지`;
    };

    // 필터링
    const filteredUsers = users.filter(u =>
        u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* 헤더 */}
                <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">👥 회원 관리</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleEmailAll}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-bold flex items-center gap-2"
                        >
                            <span>📢</span> 전체 공지 메일
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl px-2">×</button>
                    </div>
                </div>

                {/* 툴바 */}
                <div className="p-4 border-b flex gap-4 bg-white">
                    <input
                        type="text"
                        placeholder="이름, 아이디 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        onClick={fetchUsers}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        새로고침
                    </button>
                </div>

                {/* 테이블 */}
                <div className="flex-1 overflow-auto bg-white">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">회원정보</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">구독 상태</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">보유 레벨</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map(user => {
                                    const isPremium = user.premium_until && new Date(user.premium_until) > new Date();
                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900">{user.nickname}</div>
                                                <div className="text-xs text-gray-400">@{user.user_id}</div>
                                            </td>
                                            <td className="p-4">
                                                {isPremium ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        AI 구독중 (~{new Date(user.premium_until!).toLocaleDateString()})
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-1 flex-wrap">
                                                    {[2, 3, 4, 5].map(level => {
                                                        const hasLevel = user.purchased_levels.includes(level);
                                                        return (
                                                            <span key={level} className={`px-2 py-0.5 rounded text-xs font-bold ${hasLevel ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-300"
                                                                }`}>
                                                                Lv.{level}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEmail(user)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                                >
                                                    ✉️
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowGrantModal(true);
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
                                                >
                                                    🎁 지급
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* 이용권 지급 모달 */}
            {showGrantModal && selectedUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">🎁 이용권 지급</h3>
                            <button onClick={() => setShowGrantModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <p className="text-sm text-gray-600 mb-6">
                            <span className="font-bold text-blue-600">{selectedUser.nickname}</span>님에게<br />
                            어떤 혜택을 제공할까요?
                        </p>

                        {/* 탭 */}
                        <div className="flex border-b border-gray-200 mb-4">
                            <button
                                onClick={() => setGrantType("subscription")}
                                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${grantType === "subscription"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                📅 AI 구독 (기간)
                            </button>
                            <button
                                onClick={() => setGrantType("level")}
                                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${grantType === "level"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                🔓 레벨 해금 (영구)
                            </button>
                        </div>

                        {grantType === "subscription" ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                <button onClick={() => grantSubscription(30)} className="w-full p-3 text-left hover:bg-gray-50 rounded-xl border transition-colors flex justify-between group">
                                    <span>1개월 (30일)</span>
                                    <span className="text-gray-400 group-hover:text-blue-500">+추가</span>
                                </button>
                                <button onClick={() => grantSubscription(90)} className="w-full p-3 text-left hover:bg-gray-50 rounded-xl border transition-colors flex justify-between group">
                                    <span>3개월 (90일)</span>
                                    <span className="text-gray-400 group-hover:text-blue-500">+추가</span>
                                </button>
                                <button onClick={() => grantSubscription(365)} className="w-full p-3 text-left hover:bg-gray-50 rounded-xl border transition-colors flex justify-between group">
                                    <span>1년 (365일)</span>
                                    <span className="text-gray-400 group-hover:text-blue-500">+추가</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500 mb-2">원하는 레벨을 영구적으로 잠금 해제합니다.</p>
                                {[2, 3, 4, 5].map(level => {
                                    const isOwned = selectedUser.purchased_levels.includes(level);
                                    return (
                                        <button
                                            key={level}
                                            onClick={() => !isOwned && grantLevel(level)}
                                            disabled={isOwned}
                                            className={`w-full p-3 text-left rounded-xl border transition-colors flex justify-between items-center ${isOwned
                                                    ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                                                    : "hover:bg-blue-50 border-gray-200 hover:border-blue-300"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                                                    {level}
                                                </span>
                                                <span className={isOwned ? "text-gray-400" : "text-gray-800"}>
                                                    Level {level}
                                                </span>
                                            </div>
                                            {isOwned ? (
                                                <span className="text-xs text-green-600 font-bold">보유중</span>
                                            ) : (
                                                <span className="text-xs text-blue-600 font-bold">지급하기</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <button
                            onClick={() => setShowGrantModal(false)}
                            className="mt-6 w-full py-3 text-sm text-gray-500 hover:bg-gray-100 rounded-xl"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes scale-up {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-up {
                    animation: scale-up 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
