"use client";

import { useState, useEffect } from "react";

interface Question {
    id: number;
    level: number;
    question_text: string;
    options: string[];
    correct_answer: number;
    explanation: string;
    category: string;
}

interface QuestionManagerProps {
    isOpen: boolean;
    onClose: () => void;
    adminKey: string;
}

export default function QuestionManager({ isOpen, onClose, adminKey }: QuestionManagerProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterLevel, setFilterLevel] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchQuestions();
        }
    }, [isOpen, filterLevel]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const url = filterLevel !== null
                ? `/api/admin/questions?level=${filterLevel}`
                : "/api/admin/questions";
            const response = await fetch(url, {
                headers: { "x-admin-key": adminKey }
            });
            const data = await response.json();
            if (response.ok) setQuestions(data);
        } catch (error) {
            console.error("Failed to fetch questions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = currentQuestion?.id ? "PUT" : "POST";
            const response = await fetch("/api/admin/questions", {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-key": adminKey
                },
                body: JSON.stringify(currentQuestion)
            });
            if (response.ok) {
                setIsEditing(false);
                setCurrentQuestion(null);
                fetchQuestions();
            }
        } catch (error) {
            console.error("Failed to save question:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("이 문제를 정말 삭제하시겠습니까?")) return;
        try {
            const response = await fetch(`/api/admin/questions?id=${id}`, {
                method: "DELETE",
                headers: { "x-admin-key": adminKey }
            });
            if (response.ok) fetchQuestions();
        } catch (error) {
            console.error("Failed to delete question:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-700">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>📝</span> 문제 관리 (CBT 퀴즈)
                        </h2>
                        <p className="text-gray-400 text-xs mt-1">사회통합프로그램 레벨별 기출 및 연습 문제를 관리합니다.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
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
                                                        ? "bg-blue-600 text-white"
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
                                        setCurrentQuestion({ level: 3, options: ["", "", "", ""], correct_answer: 0, category: "한국어" });
                                        setIsEditing(true);
                                    }}
                                    className="px-4 py-2 bg-green-600 rounded-xl hover:bg-green-700 transition-colors text-sm font-bold shadow-lg flex items-center gap-2"
                                >
                                    <span>➕</span> 새 문제 등록
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-20 text-gray-500">데이터를 불러오는 중...</div>
                            ) : (
                                <div className="space-y-4">
                                    {questions.map((q) => (
                                        <div key={q.id} className="bg-gray-700/30 rounded-2xl p-5 border border-gray-700 hover:border-gray-500 transition-all group">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="bg-blue-900/50 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-800">Lv.{q.level}</span>
                                                        <span className="bg-gray-600 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{q.category}</span>
                                                        <span className="text-gray-500 text-[10px]">ID: {q.id}</span>
                                                    </div>
                                                    <h3 className="text-white text-lg font-bold mb-3 font-medium leading-relaxed">{q.question_text}</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {q.options.map((opt, i) => (
                                                            <div key={i} className={`text-sm py-2 px-3 rounded-lg border ${i === q.correct_answer
                                                                    ? "bg-green-900/20 border-green-800/50 text-green-400"
                                                                    : "bg-gray-800/50 border-gray-700 text-gray-400"
                                                                }`}>
                                                                <span className="font-bold mr-2">{i + 1}.</span> {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {q.explanation && (
                                                        <p className="mt-4 text-xs text-gray-500 italic px-3 py-2 bg-gray-900/30 rounded-lg">
                                                            💡 <b>해설:</b> {q.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setCurrentQuestion(q);
                                                            setIsEditing(true);
                                                        }}
                                                        className="p-2 bg-gray-600 text-white rounded-xl hover:bg-blue-600 transition-colors"
                                                        title="수정"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(q.id)}
                                                        className="p-2 bg-gray-600 text-white rounded-xl hover:bg-red-600 transition-colors"
                                                        title="삭제"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {questions.length === 0 && (
                                        <div className="text-center py-20 text-gray-600 bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-700">
                                            해당 레벨의 문제가 없습니다.
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <form onSubmit={handleSave} className="max-w-3xl mx-auto py-4 space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white">
                                    {currentQuestion?.id ? "📝 문제 수정" : "➕ 새 문제 등록"}
                                </h3>
                                <div className="text-xs text-gray-500">ID: {currentQuestion?.id || "NEW"}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">난이도 (Level)</label>
                                    <select
                                        value={currentQuestion?.level}
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, level: parseInt(e.target.value) })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        {[0, 1, 2, 3, 4, 5].map(lv => <option key={lv} value={lv}>Level {lv}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">카테고리</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentQuestion?.category}
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, category: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="예: 한국어, 한국 역사/문화"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">문제 내용</label>
                                <textarea
                                    required
                                    value={currentQuestion?.question_text}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white min-h-[100px] focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="질문을 입력하세요"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-gray-400 text-sm mb-1">보기 선택 (정답을 표시하세요)</label>
                                {currentQuestion?.options?.map((opt, i) => (
                                    <div key={i} className="flex gap-3 items-center">
                                        <input
                                            type="radio"
                                            name="correct_answer"
                                            checked={currentQuestion.correct_answer === i}
                                            onChange={() => setCurrentQuestion({ ...currentQuestion, correct_answer: i })}
                                            className="w-5 h-5 text-green-600 bg-gray-900 border-gray-700 focus:ring-0 cursor-pointer"
                                        />
                                        <input
                                            required
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...(currentQuestion.options || [])];
                                                newOpts[i] = e.target.value;
                                                setCurrentQuestion({ ...currentQuestion, options: newOpts });
                                            }}
                                            className={`flex-1 bg-gray-900 border rounded-xl px-4 py-2 text-white focus:outline-none transition-colors ${currentQuestion.correct_answer === i ? "border-green-600 focus:border-green-500" : "border-gray-700 focus:border-blue-500"
                                                }`}
                                            placeholder={`보기 ${i + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">정답 해설 (Explanation)</label>
                                <textarea
                                    required
                                    value={currentQuestion?.explanation}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white min-h-[80px] focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="정답에 대한 부연 설명을 입력하세요"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-4 bg-gray-700 text-white rounded-2xl font-bold hover:bg-gray-600 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/30"
                                >
                                    저장하기
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
