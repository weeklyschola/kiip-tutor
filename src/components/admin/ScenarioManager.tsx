"use client";

import { useState, useEffect } from "react";

interface DialogueLine {
    speaker: string;
    role: "user" | "other";
    text: string;
    avatar: string;
    translation: string;
}

interface Scenario {
    id: number;
    level: number;
    title: string;
    category: string;
    icon: string;
    description: string;
    dialogue: DialogueLine[];
    vocabulary: string[];
    grammar: string[];
    culture_tip: string;
}

interface ScenarioManagerProps {
    isOpen: boolean;
    onClose: () => void;
    adminKey: string;
}

export default function ScenarioManager({ isOpen, onClose, adminKey }: ScenarioManagerProps) {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterLevel, setFilterLevel] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentScenario, setCurrentScenario] = useState<Partial<Scenario> | null>(null);
    const [migrating, setMigrating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchScenarios();
        }
    }, [isOpen, filterLevel]);

    const fetchScenarios = async () => {
        try {
            setLoading(true);
            const url = filterLevel !== null
                ? `/api/admin/scenarios?level=${filterLevel}`
                : "/api/admin/scenarios";
            const response = await fetch(url, {
                headers: { "x-admin-key": adminKey }
            });
            const data = await response.json();
            if (response.ok) setScenarios(data);
        } catch (error) {
            console.error("Failed to fetch scenarios:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunMigration = async () => {
        if (!confirm("JSON 데이터를 DB로 마이그레이션 하시겠습니까? (기존 ID가 같은 데이터는 덮어씌워집니다)")) return;
        try {
            setMigrating(true);
            const response = await fetch("/api/admin/migrate-scenarios", {
                method: "POST",
                headers: { "x-admin-key": adminKey }
            });
            if (response.ok) {
                alert("마이그레이션이 완료되었습니다.");
                fetchScenarios();
            } else {
                alert("마이그레이션 실패");
            }
        } catch (error) {
            console.error("Migration error:", error);
        } finally {
            setMigrating(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = currentScenario?.id ? "PUT" : "POST";
            const response = await fetch("/api/admin/scenarios", {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-key": adminKey
                },
                body: JSON.stringify(currentScenario)
            });
            if (response.ok) {
                setIsEditing(false);
                setCurrentScenario(null);
                fetchScenarios();
            }
        } catch (error) {
            console.error("Failed to save scenario:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("이 시나리오를 정말 삭제하시겠습니까?")) return;
        try {
            const response = await fetch(`/api/admin/scenarios?id=${id}`, {
                method: "DELETE",
                headers: { "x-admin-key": adminKey }
            });
            if (response.ok) fetchScenarios();
        } catch (error) {
            console.error("Failed to delete scenario:", error);
        }
    };

    const addDialogueLine = () => {
        const newLine: DialogueLine = { speaker: "", role: "other", text: "", avatar: "👤", translation: "" };
        setCurrentScenario({
            ...currentScenario,
            dialogue: [...(currentScenario?.dialogue || []), newLine]
        });
    };

    const removeDialogueLine = (index: number) => {
        const newDialogue = [...(currentScenario?.dialogue || [])];
        newDialogue.splice(index, 1);
        setCurrentScenario({ ...currentScenario, dialogue: newDialogue });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-gray-700">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>💬</span> 대화 시나리오 관리
                        </h2>
                        <p className="text-gray-400 text-xs mt-1">학습 레벨별 상황 대화 및 관련 어휘/문법/문화를 관리합니다.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            disabled={migrating}
                            onClick={handleRunMigration}
                            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors uppercase font-bold tracking-tighter"
                        >
                            {migrating ? "마이그레이션 중..." : "🔄 JSON 마이그레이션"}
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {!isEditing ? (
                        <>
                            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm font-medium">레벨 필터:</span>
                                    <div className="flex gap-1">
                                        {[null, 0, 1, 2, 3, 4, 5].map((lv) => (
                                            <button
                                                key={lv === null ? "all" : lv}
                                                onClick={() => setFilterLevel(lv)}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterLevel === lv
                                                        ? "bg-amber-600 text-white"
                                                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                                    }`}
                                            >
                                                {lv === null ? "전체" : `Lv.${lv}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setCurrentScenario({
                                            level: 1,
                                            title: "",
                                            category: "일상",
                                            icon: "🗣️",
                                            description: "",
                                            dialogue: [],
                                            vocabulary: [],
                                            grammar: [],
                                            culture_tip: ""
                                        });
                                        setIsEditing(true);
                                    }}
                                    className="px-4 py-2 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors text-sm font-bold shadow-lg flex items-center gap-2"
                                >
                                    <span>➕</span> 새 시나리오 등록
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {loading ? (
                                    <div className="col-span-full text-center py-20 text-gray-500">데이터를 불러오는 중...</div>
                                ) : (
                                    scenarios.map((s) => (
                                        <div key={s.id} className="bg-gray-700/30 rounded-2xl p-4 border border-gray-700 hover:border-gray-500 transition-all flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{s.icon}</span>
                                                    <div>
                                                        <h3 className="text-white font-bold leading-tight">{s.title}</h3>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{s.category} • Lv.{s.level}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => { setCurrentScenario(s); setIsEditing(true); }} className="p-1.5 text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-lg">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors bg-gray-800 rounded-lg">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-gray-400 text-xs line-clamp-2 mb-4 flex-1">{s.description}</p>
                                            <div className="flex gap-2">
                                                <div className="flex-1 text-center bg-gray-800/50 rounded-lg py-1">
                                                    <p className="text-blue-400 text-[10px] font-bold">대화 {s.dialogue?.length || 0}</p>
                                                </div>
                                                <div className="flex-1 text-center bg-gray-800/50 rounded-lg py-1">
                                                    <p className="text-green-400 text-[10px] font-bold">어휘 {s.vocabulary?.length || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleSave} className="max-w-4xl mx-auto py-4 space-y-8">
                            <h3 className="text-xl font-bold text-white border-l-4 border-blue-500 pl-3">
                                {currentScenario?.id ? "📝 시나리오 수정" : "➕ 새 시나리오 등록"}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-1">
                                    <label className="block text-gray-400 text-xs mb-1 uppercase font-bold">난이도</label>
                                    <select
                                        value={currentScenario?.level}
                                        onChange={(e) => setCurrentScenario({ ...currentScenario, level: parseInt(e.target.value) })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                    >
                                        {[0, 1, 2, 3, 4, 5].map(lv => <option key={lv} value={lv}>Level {lv}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-gray-400 text-xs mb-1 uppercase font-bold">아이콘</label>
                                    <input
                                        type="text"
                                        value={currentScenario?.icon}
                                        onChange={(e) => setCurrentScenario({ ...currentScenario, icon: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                        placeholder="🔍"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-400 text-xs mb-1 uppercase font-bold">카테고리</label>
                                    <input
                                        type="text"
                                        value={currentScenario?.category}
                                        onChange={(e) => setCurrentScenario({ ...currentScenario, category: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                        placeholder="예: 교통, 학교, 쇼핑"
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-gray-400 text-xs mb-1 uppercase font-bold">제목</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentScenario?.title}
                                        onChange={(e) => setCurrentScenario({ ...currentScenario, title: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                        placeholder="시나리오 제목"
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-gray-400 text-xs mb-1 uppercase font-bold">설명</label>
                                    <textarea
                                        value={currentScenario?.description}
                                        onChange={(e) => setCurrentScenario({ ...currentScenario, description: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm min-h-[60px] focus:border-blue-500 outline-none"
                                        placeholder="어떤 상황에 대한 대화인지 설명하세요"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest">🗣️ 대화 구성 (Dialogues)</h4>
                                    <button
                                        type="button"
                                        onClick={addDialogueLine}
                                        className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-800 rounded hover:bg-blue-800/40"
                                    >
                                        + 줄 추가
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {currentScenario?.dialogue?.map((line, idx) => (
                                        <div key={idx} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 relative group">
                                            <button
                                                type="button"
                                                onClick={() => removeDialogueLine(idx)}
                                                className="absolute -right-2 -top-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-2">
                                                <div className="md:col-span-1">
                                                    <select
                                                        value={line.role}
                                                        onChange={(e) => {
                                                            const newD = [...(currentScenario.dialogue || [])];
                                                            newD[idx].role = e.target.value as "user" | "other";
                                                            setCurrentScenario({ ...currentScenario, dialogue: newD });
                                                        }}
                                                        className="w-full bg-gray-800 border-none rounded-lg px-2 py-1 text-[10px] text-white outline-none"
                                                    >
                                                        <option value="user">User (나)</option>
                                                        <option value="other">Other (상대)</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <input
                                                        type="text"
                                                        value={line.speaker}
                                                        onChange={(e) => {
                                                            const newD = [...(currentScenario.dialogue || [])];
                                                            newD[idx].speaker = e.target.value;
                                                            setCurrentScenario({ ...currentScenario, dialogue: newD });
                                                        }}
                                                        className="w-full bg-gray-800 border-none rounded-lg px-2 py-1 text-[10px] text-white outline-none"
                                                        placeholder="이름 (예: 민수, 점원)"
                                                    />
                                                </div>
                                                <div className="md:col-span-1">
                                                    <input
                                                        type="text"
                                                        value={line.avatar}
                                                        onChange={(e) => {
                                                            const newD = [...(currentScenario.dialogue || [])];
                                                            newD[idx].avatar = e.target.value;
                                                            setCurrentScenario({ ...currentScenario, dialogue: newD });
                                                        }}
                                                        className="w-full bg-gray-800 border-none rounded-lg px-2 py-1 text-[10px] text-white text-center outline-none"
                                                        placeholder="아바타(Emoji)"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    value={line.text}
                                                    onChange={(e) => {
                                                        const newD = [...(currentScenario.dialogue || [])];
                                                        newD[idx].text = e.target.value;
                                                        setCurrentScenario({ ...currentScenario, dialogue: newD });
                                                    }}
                                                    className="w-full bg-gray-800 border-none rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                                                    placeholder="한국어 대사"
                                                />
                                                <input
                                                    type="text"
                                                    value={line.translation}
                                                    onChange={(e) => {
                                                        const newD = [...(currentScenario.dialogue || [])];
                                                        newD[idx].translation = e.target.value;
                                                        setCurrentScenario({ ...currentScenario, dialogue: newD });
                                                    }}
                                                    className="w-full bg-gray-800 border-none rounded-lg px-3 py-1.5 text-xs text-gray-400 outline-none"
                                                    placeholder="영어 번역"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {(!currentScenario?.dialogue || currentScenario.dialogue.length === 0) && (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-xl text-gray-500 text-xs">
                                            대화 내용이 없습니다. '줄 추가' 버튼으로 대화를 구성하세요.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-3">🏷️ 어휘 & 문법</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-gray-500 text-[10px] mb-1">어휘 (Vocabulary, 쉼표로 구분)</label>
                                            <textarea
                                                value={currentScenario?.vocabulary?.join(", ")}
                                                onChange={(e) => setCurrentScenario({ ...currentScenario, vocabulary: e.target.value.split(",").map(v => v.trim()).filter(v => v) })}
                                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-xs min-h-[60px] outline-none"
                                                placeholder="안녕, 반갑다, 학교"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-500 text-[10px] mb-1">문법 (Grammar, 쉼표로 구분)</label>
                                            <textarea
                                                value={currentScenario?.grammar?.join(", ")}
                                                onChange={(e) => setCurrentScenario({ ...currentScenario, grammar: e.target.value.split(",").map(v => v.trim()).filter(v => v) })}
                                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-xs min-h-[60px] outline-none"
                                                placeholder="~예요, ~았/었어요"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-3">💡 문화 팁</h4>
                                    <textarea
                                        value={currentScenario?.culture_tip}
                                        onChange={(e) => setCurrentScenario({ ...currentScenario, culture_tip: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-xs min-h-[148px] outline-none"
                                        placeholder="관련된 한국 문화를 설명해 주세요."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-4 bg-gray-700 text-white rounded-2xl font-bold hover:bg-gray-600 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/30"
                                >
                                    시나리오 저장하기
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
