import level0Data from './vocabulary/level0.json';
import level1Data from './vocabulary/level1.json';
import level2Data from './vocabulary/level2.json';
import level3Data from './vocabulary/level3.json';
import level4Data from './vocabulary/level4.json';
import level5Data from './vocabulary/level5.json';
import conversationsData from './conversations.json';

export interface Vocabulary {
    word: string;
    meaning: string;
    pronunciation: string;
    examples: string[];
    topic: string;
}

export interface DialogueLine {
    speaker: string;
    korean: string;
    english: string;
}

export interface Dialogue {
    id?: number;
    situation: string;
    lines: DialogueLine[];
}

// 한글 자모 학습용 인터페이스
export interface HangulItem {
    character: string;
    name: string;
    romanization: string;
    exampleWord: string;
    exampleMeaning: string;
}

export interface LevelContent {
    level: number;
    title: string;
    description: string;
    vocabulary: Vocabulary[];
    dialogues: Dialogue[];
    // 0단계 전용: 한글 자모
    hangulVowels?: HangulItem[];
    hangulConsonants?: HangulItem[];
    hangulDoubleVowels?: HangulItem[];
    hangulDoubleConsonants?: HangulItem[];
}

// Helper to map conversations to Dialogue format
// Also filters out duplicates if necessary, though we assume level separation is clean
const getDialoguesForLevel = (level: number): Dialogue[] => {
    // @ts-ignore
    if (!conversationsData || !conversationsData.conversations || !Array.isArray(conversationsData.conversations)) return [];

    // @ts-ignore
    return conversationsData.conversations
        .filter((c: any) => c && c.level === level)
        .map((c: any) => ({
            id: c.id,
            situation: c.title || "",
            lines: (c.dialogue || []).map((d: any) => ({
                speaker: (d.speaker || "").replace(/\s*\(.*?\)/, ""), // Remove (나) etc if needed
                korean: d.text || "",
                english: d.translation || ""
            }))
        }));
};

export const levelContents: Record<number, LevelContent> = {
    0: {
        level: 0,
        title: "기초",
        description: "한글의 구조와 발음, 기초 표현을 배웁니다",

        // ========== 기본 모음 (단원 1) ==========
        hangulVowels: [
            { character: "ㅏ", name: "아", romanization: "a", exampleWord: "아이", exampleMeaning: "child" },
            { character: "ㅑ", name: "야", romanization: "ya", exampleWord: "야구", exampleMeaning: "baseball" },
            { character: "ㅓ", name: "어", romanization: "eo", exampleWord: "어머니", exampleMeaning: "mother" },
            { character: "ㅕ", name: "여", romanization: "yeo", exampleWord: "여자", exampleMeaning: "woman" },
            { character: "ㅗ", name: "오", romanization: "o", exampleWord: "오리", exampleMeaning: "duck" },
            { character: "ㅛ", name: "요", romanization: "yo", exampleWord: "요리", exampleMeaning: "cooking" },
            { character: "ㅜ", name: "우", romanization: "u", exampleWord: "우유", exampleMeaning: "milk" },
            { character: "ㅠ", name: "유", romanization: "yu", exampleWord: "유리", exampleMeaning: "glass" },
            { character: "ㅡ", name: "으", romanization: "eu", exampleWord: "으악", exampleMeaning: "ahh" },
            { character: "ㅣ", name: "이", romanization: "i", exampleWord: "이름", exampleMeaning: "name" },
        ],

        // ========== 기본 자음 (단원 1) ==========
        hangulConsonants: [
            { character: "ㄱ", name: "기역", romanization: "g/k", exampleWord: "가방", exampleMeaning: "bag" },
            { character: "ㄴ", name: "니은", romanization: "n", exampleWord: "나무", exampleMeaning: "tree" },
            { character: "ㄷ", name: "디귿", romanization: "d/t", exampleWord: "다리", exampleMeaning: "leg/bridge" },
            { character: "ㄹ", name: "리을", romanization: "r/l", exampleWord: "라면", exampleMeaning: "ramen" },
            { character: "ㅁ", name: "미음", romanization: "m", exampleWord: "모자", exampleMeaning: "hat" },
            { character: "ㅂ", name: "비읍", romanization: "b/p", exampleWord: "바나나", exampleMeaning: "banana" },
            { character: "ㅅ", name: "시옷", romanization: "s", exampleWord: "사과", exampleMeaning: "apple" },
            { character: "ㅇ", name: "이응", romanization: "-/ng", exampleWord: "아기", exampleMeaning: "baby" },
            { character: "ㅈ", name: "지읒", romanization: "j", exampleWord: "자동차", exampleMeaning: "car" },
            { character: "ㅊ", name: "치읓", romanization: "ch", exampleWord: "치마", exampleMeaning: "skirt" },
            { character: "ㅋ", name: "키읔", romanization: "k", exampleWord: "카메라", exampleMeaning: "camera" },
            { character: "ㅌ", name: "티읕", romanization: "t", exampleWord: "타조", exampleMeaning: "ostrich" },
            { character: "ㅍ", name: "피읖", romanization: "p", exampleWord: "포도", exampleMeaning: "grape" },
            { character: "ㅎ", name: "히읗", romanization: "h", exampleWord: "하마", exampleMeaning: "hippo" },
        ],

        // ========== 이중 모음 (단원 2) ==========
        hangulDoubleVowels: [
            { character: "ㅐ", name: "애", romanization: "ae", exampleWord: "개", exampleMeaning: "dog" },
            { character: "ㅒ", name: "얘", romanization: "yae", exampleWord: "얘기", exampleMeaning: "story" },
            { character: "ㅔ", name: "에", romanization: "e", exampleWord: "세수", exampleMeaning: "washing face" },
            { character: "ㅖ", name: "예", romanization: "ye", exampleWord: "예쁘다", exampleMeaning: "pretty" },
            { character: "ㅘ", name: "와", romanization: "wa", exampleWord: "과일", exampleMeaning: "fruit" },
            { character: "ㅙ", name: "왜", romanization: "wae", exampleWord: "왜", exampleMeaning: "why" },
            { character: "ㅚ", name: "외", romanization: "oe", exampleWord: "외국", exampleMeaning: "foreign country" },
            { character: "ㅝ", name: "워", romanization: "wo", exampleWord: "원", exampleMeaning: "won (currency)" },
            { character: "ㅞ", name: "웨", romanization: "we", exampleWord: "웨딩", exampleMeaning: "wedding" },
            { character: "ㅟ", name: "위", romanization: "wi", exampleWord: "위", exampleMeaning: "above" },
            { character: "ㅢ", name: "의", romanization: "ui", exampleWord: "의사", exampleMeaning: "doctor" },
        ],

        // ========== 쌍자음 (단원 2) ==========
        hangulDoubleConsonants: [
            { character: "ㄲ", name: "쌍기역", romanization: "kk", exampleWord: "까치", exampleMeaning: "magpie" },
            { character: "ㄸ", name: "쌍디귿", romanization: "tt", exampleWord: "딸기", exampleMeaning: "strawberry" },
            { character: "ㅃ", name: "쌍비읍", romanization: "pp", exampleWord: "빵", exampleMeaning: "bread" },
            { character: "ㅆ", name: "쌍시옷", romanization: "ss", exampleWord: "쓰다", exampleMeaning: "to write" },
            { character: "ㅉ", name: "쌍지읒", romanization: "jj", exampleWord: "짜다", exampleMeaning: "salty" },
        ],

        // ========== 유용한 표현 (단원 3) ==========
        vocabulary: level0Data.vocabulary as Vocabulary[],
        dialogues: getDialoguesForLevel(0)
    },
    1: {
        level: 1,
        title: "초급 1",
        description: "기초적인 일상 대화가 가능해집니다",
        vocabulary: level1Data.vocabulary as Vocabulary[],
        dialogues: getDialoguesForLevel(1)
    },
    2: {
        level: 2,
        title: "초급 2",
        description: "일상생활에서 자주 사용하는 표현을 배웁니다",
        vocabulary: level2Data.vocabulary as Vocabulary[],
        dialogues: getDialoguesForLevel(2)
    },
    3: {
        level: 3,
        title: "중급 1",
        description: "한국 생활 정착과 사회 이해",
        vocabulary: level3Data.vocabulary as Vocabulary[],
        dialogues: getDialoguesForLevel(3)
    },
    4: {
        level: 4,
        title: "중급 2",
        description: "한국 사회와 문화 이해",
        vocabulary: level4Data.vocabulary as Vocabulary[],
        dialogues: getDialoguesForLevel(4)
    },
    5: {
        level: 5,
        title: "고급",
        description: "귀화 시험 대비 및 시민권",
        vocabulary: level5Data.vocabulary as Vocabulary[],
        dialogues: getDialoguesForLevel(5)
    },
};

export const getLevelContent = (level: number) => levelContents[level];
export const getTopicsForLevel = (level: number): string[] => {
    const content = levelContents[level];
    if (!content || !content.vocabulary || !Array.isArray(content.vocabulary)) return [];
    return Array.from(new Set(content.vocabulary.map(v => v ? v.topic : ""))).filter(t => t);
};
export const getVocabularyByTopic = (level: number, topic: string): Vocabulary[] => {
    const content = levelContents[level];
    if (!content || !content.vocabulary || !Array.isArray(content.vocabulary)) return [];
    return content.vocabulary.filter(v => v && v.topic === topic);
};

// 모든 레벨 콘텐츠를 배열로 export
export const allLevelContents: LevelContent[] = Object.values(levelContents);
