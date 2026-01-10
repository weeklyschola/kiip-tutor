"use client";

import { useState, useEffect } from "react";

interface User {
    id: string;
    user_id: string;
    nickname: string;
    created_at: string;
    premium_until: string | null;
    email?: string; // profiles에 없으면 undefined 가능성 높음
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
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showPremiumOptions, setShowPremiumOptions] = useState(false);

    // 사용자 목록 불러오기
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users", {
                headers: { "x-admin-key": adminKey }
            });
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
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

    const handleGrantPremium = async (days: number) => {
        if (!selectedUser) return;

        const date = new Date();
        date.setDate(date.getDate() + days); // 현재 날짜 + days
        const premiumUntil = date.toISOString();

        if (days === 9999) { // 무제한 (약 100년)
            const farFuture = new Date();
            farFuture.setFullYear(farFuture.getFullYear() + 100);
            // premiumUntil = farFuture.toISOString(); // scope 이슈로 재할당 불가하므로 아래에서 처리
        }

        const finalDate = days === 9999
            ? new Date(new Date().setFullYear(new Date().getFullYear() + 100)).toISOString()
            : premiumUntil;

        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-key": adminKey
                },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    premiumUntil: finalDate
                })
            });

            if (res.ok) {
                alert(`${selectedUser.nickname}님에게 프리미엄 이용권을 지급했습니다.`);
                fetchUsers(); // 목록 갱신
                setShowPremiumOptions(false);
                setSelectedUser(null);
            } else {
                alert("이용권 지급 실패");
            }
        } catch (e) {
            alert("오류가 발생했습니다.");
        }
    };

    const handleEmail = (user: User) => {
        // 실제 이메일이 profile에 없으면 user_id를 확인 (가짜 이메일인지)
        // 여기서는 user_id가 이메일 형식이면 그걸 쓰고, 아니면 물어봄
        let email = user.email;
        if (!email && user.user_id.includes("@")) {
            email = user.user_id;
        }

        if (email) {
            window.location.href = `mailto:${email}?subject=[KIIP 튜터] 학습 관련 안내&body=안녕하세요, ${user.nickname}님.`;
        } else {
            alert("등록된 이메일 정보가 없습니다.\n(회원가입 시 이메일을 수집하지 않았습니다)");
        }
    };

    // 필터링
    const filteredUsers = users.filter(u =>
        u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* 헤더 */}
                <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">👥 회원 관리</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                {/* 툴바 */}
                <div className="p-4 border-b flex gap-4">
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
                    <div className="text-sm text-gray-500 self-center">
                        총 {filteredUsers.length}명
                    </div>
                </div>

                {/* 테이블 */}
                <div className="flex-1 overflow-auto bg-white p-0">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">회원정보</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">가입일</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">상태</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">관리</th>
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
                                            <td className="p-4 text-sm text-gray-600">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                {isPremium ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Premium (~{new Date(user.premium_until!).toLocaleDateString()})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        무료 회원
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEmail(user)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                                >
                                                    ✉️ 연락
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowPremiumOptions(true);
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
                                                >
                                                    🎁 이용권 지급
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

            {/* 이용권 지급 옵션 모달 */}
            {showPremiumOptions && selectedUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-up">
                        <h3 className="text-lg font-bold mb-2">🎁 무료 이용권 지급</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            <span className="font-bold text-blue-600">{selectedUser.nickname}</span>님에게<br />
                            얼마나 이용권을 드릴까요?
                        </p>

                        <div className="space-y-2">
                            <button onClick={() => handleGrantPremium(30)} className="w-full p-3 text-left hover:bg-gray-50 rounded-xl border transition-colors flex justify-between group">
                                <span>1개월 (30일)</span>
                                <span className="text-gray-400 group-hover:text-blue-500">지급 →</span>
                            </button>
                            <button onClick={() => handleGrantPremium(90)} className="w-full p-3 text-left hover:bg-gray-50 rounded-xl border transition-colors flex justify-between group">
                                <span>3개월 (90일)</span>
                                <span className="text-gray-400 group-hover:text-blue-500">지급 →</span>
                            </button>
                            <button onClick={() => handleGrantPremium(365)} className="w-full p-3 text-left hover:bg-gray-50 rounded-xl border transition-colors flex justify-between group">
                                <span>1년 (365일)</span>
                                <span className="text-gray-400 group-hover:text-blue-500">지급 →</span>
                            </button>
                            <button onClick={() => handleGrantPremium(9999)} className="w-full p-3 text-left bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border-yellow-200 rounded-xl border transition-colors flex justify-between group">
                                <span className="font-bold text-yellow-800">👑 평생 무제한</span>
                                <span className="text-yellow-600">지급 →</span>
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setShowPremiumOptions(false);
                                setSelectedUser(null);
                            }}
                            className="mt-6 w-full py-3 text-sm text-gray-500 hover:bg-gray-100 rounded-xl"
                        >
                            취소
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
