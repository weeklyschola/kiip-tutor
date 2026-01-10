import level0Data from './vocabulary/level0.json';
import level1Data from './vocabulary/level1.json';
import level2Data from './vocabulary/level2.json';
import level3Data from './vocabulary/level3.json';
import level4Data from './vocabulary/level4.json';
import level5Data from './vocabulary/level5.json';

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
        vocabulary: [
            // 인사말
            { word: "안녕하세요", meaning: "Hello", pronunciation: "annyeonghaseyo", topic: "인사말", examples: ["안녕하세요? 만나서 반갑습니다.", "선생님, 안녕하세요!", "안녕하세요? 저는 김민수예요."] },
            { word: "안녕히 가세요", meaning: "Goodbye (to leaving person)", pronunciation: "annyeonghi gaseyo", topic: "인사말", examples: ["안녕히 가세요. 다음에 또 봐요.", "선생님, 안녕히 가세요!", "내일 봐요. 안녕히 가세요."] },
            { word: "안녕히 계세요", meaning: "Goodbye (to staying person)", pronunciation: "annyeonghi gyeseyo", topic: "인사말", examples: ["저 먼저 갈게요. 안녕히 계세요.", "안녕히 계세요. 좋은 하루 보내세요.", "어머니, 안녕히 계세요."] },
            { word: "감사합니다", meaning: "Thank you", pronunciation: "gamsahamnida", topic: "인사말", examples: ["도와주셔서 감사합니다.", "선물 감사합니다.", "정말 감사합니다."] },
            { word: "죄송합니다", meaning: "I'm sorry", pronunciation: "joesonghamnida", topic: "인사말", examples: ["늦어서 죄송합니다.", "죄송합니다, 다시 한번 말씀해 주세요.", "정말 죄송합니다."] },
            { word: "만나서 반갑습니다", meaning: "Nice to meet you", pronunciation: "mannaseo bangapseumnida", topic: "인사말", examples: ["안녕하세요, 만나서 반갑습니다.", "처음 뵙겠습니다. 만나서 반갑습니다.", "저도 만나서 반갑습니다."] },
            { word: "주말 잘 보내세요", meaning: "Have a good weekend", pronunciation: "jumal jal bonaeseyo", topic: "인사말", examples: ["주말 잘 보내세요!", "다음 주에 봐요. 주말 잘 보내세요.", "선생님도 주말 잘 보내세요."] },
            { word: "잘 먹겠습니다", meaning: "I will eat well (before meal)", pronunciation: "jal meokgesseumnida", topic: "인사말", examples: ["잘 먹겠습니다!", "어머니, 잘 먹겠습니다.", "맛있겠다! 잘 먹겠습니다."] },
            { word: "잘 먹었습니다", meaning: "I ate well (after meal)", pronunciation: "jal meogeosseumnida", topic: "인사말", examples: ["잘 먹었습니다. 맛있었어요.", "식사 잘 먹었습니다.", "정말 잘 먹었습니다."] },

            // 수업 관련 표현
            { word: "잘 들어 보세요", meaning: "Listen carefully", pronunciation: "jal deureo boseyo", topic: "수업 표현", examples: ["잘 들어 보세요. 발음 연습합니다.", "음악을 잘 들어 보세요.", "선생님 말씀 잘 들어 보세요."] },
            { word: "따라 하세요", meaning: "Repeat after me", pronunciation: "ttara haseyo", topic: "수업 표현", examples: ["저를 따라 하세요.", "발음을 따라 하세요.", "천천히 따라 하세요."] },
            { word: "책을 보세요", meaning: "Look at the book", pronunciation: "chaegeul boseyo", topic: "수업 표현", examples: ["10쪽을 보세요.", "교과서를 보세요.", "책을 보세요. 연습 문제입니다."] },
            { word: "칠판을 보세요", meaning: "Look at the board", pronunciation: "chilpaneul boseyo", topic: "수업 표현", examples: ["칠판을 보세요.", "앞에 칠판을 보세요.", "칠판을 보세요. 써 보겠습니다."] },
            { word: "읽어 보세요", meaning: "Please read", pronunciation: "ilgeo boseyo", topic: "수업 표현", examples: ["큰 소리로 읽어 보세요.", "다 같이 읽어 보세요.", "혼자 읽어 보세요."] },
            { word: "말해 보세요", meaning: "Please speak/say", pronunciation: "malhae boseyo", topic: "수업 표현", examples: ["한국어로 말해 보세요.", "다시 말해 보세요.", "큰 소리로 말해 보세요."] },
            { word: "써 보세요", meaning: "Please write", pronunciation: "sseo boseyo", topic: "수업 표현", examples: ["공책에 써 보세요.", "이름을 써 보세요.", "따라서 써 보세요."] },
            { word: "시작하세요", meaning: "Please start", pronunciation: "sijakhaseyo", topic: "수업 표현", examples: ["지금부터 시작하세요.", "시험 시작하세요.", "연습 시작하세요."] },
            { word: "질문 있어요?", meaning: "Do you have questions?", pronunciation: "jilmun isseoyo?", topic: "수업 표현", examples: ["질문 있어요?", "모르는 것 있어요? 질문 있어요?", "질문 있어요? 없으면 끝내겠습니다."] },
            { word: "네, 있어요", meaning: "Yes, I have", pronunciation: "ne, isseoyo", topic: "수업 표현", examples: ["네, 질문 있어요.", "네, 있어요. 잠시만요.", "네, 있어요. 선생님!"] },
            { word: "아니요, 없어요", meaning: "No, I don't have", pronunciation: "aniyo, eopseoyo", topic: "수업 표현", examples: ["아니요, 질문 없어요.", "아니요, 없어요. 다 이해했어요.", "아니요, 없어요. 감사합니다."] },

            // 기본 사물 (학교)
            { word: "가방", meaning: "Bag", pronunciation: "gabang", topic: "학교", examples: ["가방이 있어요.", "가방을 메고 학교에 가요.", "저 가방은 누구 거예요?"] },
            { word: "공책", meaning: "Notebook", pronunciation: "gongchaek", topic: "학교", examples: ["공책에 써요.", "새 공책을 샀어요.", "공책이 몇 권 있어요?"] },
            { word: "연필", meaning: "Pencil", pronunciation: "yeonpil", topic: "학교", examples: ["연필로 써요.", "연필을 깎아요.", "연필이 짧아요."] },
            { word: "지우개", meaning: "Eraser", pronunciation: "jiugae", topic: "학교", examples: ["지우개를 빌려요.", "지우개로 지워요.", "지우개가 필요해요."] },
            { word: "책", meaning: "Book", pronunciation: "chaek", topic: "학교", examples: ["책을 읽어요.", "이 책 재미있어요.", "책을 펴세요."] },
            { word: "책상", meaning: "Desk", pronunciation: "chaeksang", topic: "학교", examples: ["책상 위에 책이 있어요.", "책상이 커요.", "책상을 정리해요."] },
            { word: "의자", meaning: "Chair", pronunciation: "uija", topic: "학교", examples: ["의자에 앉아요.", "의자가 편해요.", "의자를 옮겨요."] },
            { word: "칠판", meaning: "Blackboard", pronunciation: "chilpan", topic: "학교", examples: ["칠판을 봐요.", "칠판에 글을 써요.", "칠판을 지워요."] },
            { word: "선생님", meaning: "Teacher", pronunciation: "seonsaengnim", topic: "학교", examples: ["선생님 안녕하세요.", "선생님이 친절해요.", "선생님께 질문해요."] },
            { word: "학생", meaning: "Student", pronunciation: "haksaeng", topic: "학교", examples: ["저는 학생이에요.", "학생들이 공부해요.", "우리 반 학생이 많아요."] },
        ],

        dialogues: [
            {
                situation: "첫 만남 인사",
                lines: [
                    { speaker: "민수", korean: "안녕하세요?", english: "Hello?" },
                    { speaker: "투이", korean: "네, 안녕하세요.", english: "Yes, hello." },
                    { speaker: "민수", korean: "저는 이민수예요. 만나서 반갑습니다.", english: "I am Lee Minsu. Nice to meet you." },
                    { speaker: "투이", korean: "저는 투이예요. 저도 반가워요.", english: "I am Thuy. Nice to meet you too." },
                ]
            },
            {
                situation: "수업 시간",
                lines: [
                    { speaker: "선생님", korean: "자, 책을 펴세요.", english: "Now, open your books." },
                    { speaker: "학생", korean: "몇 페이지예요?", english: "What page is it?" },
                    { speaker: "선생님", korean: "10쪽이에요. 잘 들어 보세요.", english: "It is page 10. Listen carefully." },
                    { speaker: "학생", korean: "네, 알겠습니다.", english: "Yes, I understand." },
                ]
            },
            {
                situation: "수업 끝",
                lines: [
                    { speaker: "선생님", korean: "오늘 수업은 여기까지예요.", english: "Today's class ends here." },
                    { speaker: "학생", korean: "감사합니다, 선생님.", english: "Thank you, teacher." },
                    { speaker: "선생님", korean: "수고했어요. 안녕히 가세요.", english: "Good work. Goodbye." },
                    { speaker: "학생", korean: "안녕히 계세요.", english: "Goodbye." },
                ]
            },
            {
                situation: "질문하기",
                lines: [
                    { speaker: "선생님", korean: "질문 있어요?", english: "Do you have any questions?" },
                    { speaker: "학생", korean: "네, 있어요. 이 단어 뜻이 뭐예요?", english: "Yes, I have one. What does this word mean?" },
                    { speaker: "선생님", korean: "아, '가방'은 영어로 'bag'이에요.", english: "Ah, 'gabang' means 'bag' in English." },
                    { speaker: "학생", korean: "아, 알겠습니다. 감사합니다.", english: "Ah, I understand. Thank you." },
                ]
            },
        ]
    },
    1: {
        level: 1,
        title: "초급 1",
        description: "기초적인 일상 대화가 가능해집니다",
        vocabulary: [
            // 장소
            { word: "도서관", meaning: "Library", pronunciation: "doseogwan", topic: "장소", examples: ["도서관에서 공부해요.", "도서관이 조용해요.", "도서관에서 책을 빌려요."] },
            { word: "식당", meaning: "Restaurant", pronunciation: "sikdang", topic: "장소", examples: ["식당에서 밥을 먹어요.", "이 식당이 맛있어요.", "한국 식당에 가요."] },
            { word: "병원", meaning: "Hospital", pronunciation: "byeongwon", topic: "장소", examples: ["병원에 가요.", "병원에서 검사해요.", "병원이 가까워요."] },
            { word: "약국", meaning: "Pharmacy", pronunciation: "yakguk", topic: "장소", examples: ["약국에서 약을 사요.", "약국이 어디예요?", "약국에 가야 해요."] },
            { word: "은행", meaning: "Bank", pronunciation: "eunhaeng", topic: "장소", examples: ["은행에 가요.", "은행에서 돈을 찾아요.", "은행이 몇 시에 열어요?"] },
            { word: "시장", meaning: "Market", pronunciation: "sijang", topic: "장소", examples: ["시장이 싸요.", "시장에서 채소를 사요.", "전통 시장에 가요."] },
            { word: "마트", meaning: "Mart", pronunciation: "mateu", topic: "장소", examples: ["마트에 가요.", "마트에서 장을 봐요.", "마트가 24시간이에요."] },
            { word: "공원", meaning: "Park", pronunciation: "gongwon", topic: "장소", examples: ["공원에서 운동해요.", "공원이 넓어요.", "주말에 공원에 가요."] },

            // 동사
            { word: "가다", meaning: "To go", pronunciation: "gada", topic: "동사", examples: ["집에 가요.", "학교에 가요.", "어디 가요?"] },
            { word: "오다", meaning: "To come", pronunciation: "oda", topic: "동사", examples: ["친구가 와요.", "한국에 왔어요.", "빨리 오세요."] },
            { word: "먹다", meaning: "To eat", pronunciation: "meokda", topic: "동사", examples: ["밥을 먹어요.", "맛있게 먹었어요.", "뭐 먹을래요?"] },
            { word: "마시다", meaning: "To drink", pronunciation: "masida", topic: "동사", examples: ["물을 마셔요.", "커피 마셔요.", "주스를 마셔요."] },
            { word: "보다", meaning: "To see/watch", pronunciation: "boda", topic: "동사", examples: ["영화를 봐요.", "텔레비전을 봐요.", "친구를 봤어요."] },
            { word: "사다", meaning: "To buy", pronunciation: "sada", topic: "동사", examples: ["옷을 사요.", "과일을 사요.", "선물 사러 가요."] },
            { word: "공부하다", meaning: "To study", pronunciation: "gongbuhada", topic: "동사", examples: ["한국어를 공부해요.", "열심히 공부해요.", "시험 공부해요."] },
            { word: "일하다", meaning: "To work", pronunciation: "ilhada", topic: "동사", examples: ["회사에서 일해요.", "열심히 일해요.", "몇 시까지 일해요?"] },

            // 형용사
            { word: "크다", meaning: "Big", pronunciation: "keuda", topic: "형용사", examples: ["집이 커요.", "가방이 너무 커요.", "큰 것 주세요."] },
            { word: "작다", meaning: "Small", pronunciation: "jakda", topic: "형용사", examples: ["가방이 작아요.", "글씨가 작아요.", "작은 사이즈 있어요?"] },
            { word: "좋다", meaning: "Good", pronunciation: "jota", topic: "형용사", examples: ["날씨가 좋아요.", "기분이 좋아요.", "좋은 생각이에요."] },
            { word: "비싸다", meaning: "Expensive", pronunciation: "bissada", topic: "형용사", examples: ["옷이 비싸요.", "너무 비싸요.", "비싼 레스토랑이에요."] },
            { word: "싸다", meaning: "Cheap", pronunciation: "ssada", topic: "형용사", examples: ["이거 싸요.", "시장이 싸요.", "싼 거 찾아요."] },
            { word: "맛있다", meaning: "Delicious", pronunciation: "masitda", topic: "형용사", examples: ["불고기가 맛있어요.", "정말 맛있어요.", "맛있게 드세요."] },

            // 시간
            { word: "오늘", meaning: "Today", pronunciation: "oneul", topic: "시간", examples: ["오늘 뭐 해요?", "오늘 바빠요.", "오늘 날씨 좋아요."] },
            { word: "내일", meaning: "Tomorrow", pronunciation: "naeil", topic: "시간", examples: ["내일 만나요.", "내일 시험이에요.", "내일 뭐 할 거예요?"] },
            { word: "어제", meaning: "Yesterday", pronunciation: "eoje", topic: "시간", examples: ["어제 공부했어요.", "어제 뭐 했어요?", "어제 비가 왔어요."] },
            { word: "지금", meaning: "Now", pronunciation: "jigeum", topic: "시간", examples: ["지금 몇 시예요?", "지금 바빠요.", "지금 출발해요."] },
        ],
        dialogues: [
            {
                situation: "물건 사기",
                lines: [
                    { speaker: "손님", korean: "아저씨, 이 사과 얼마예요?", english: "Sir, how much are these apples?" },
                    { speaker: "주인", korean: "세 개에 오천 원이에요.", english: "Three for 5,000 won." },
                    { speaker: "손님", korean: "너무 비싸요. 조금 깎아 주세요.", english: "That's too expensive. Please give me a discount." },
                    { speaker: "주인", korean: "그럼 사천 원만 주세요.", english: "Then just give me 4,000 won." },
                ]
            },
            {
                situation: "길 묻기",
                lines: [
                    { speaker: "행인", korean: "실례합니다. 은행이 어디에 있어요?", english: "Excuse me. Where is the bank?" },
                    { speaker: "주민", korean: "저기 병원 옆에 있어요.", english: "It's over there next to the hospital." },
                    { speaker: "행인", korean: "여기서 멀어요?", english: "Is it far from here?" },
                    { speaker: "주민", korean: "아니요, 걸어서 5분 걸려요.", english: "No, it takes 5 minutes on foot." },
                ]
            },
            {
                situation: "음식 주문하기",
                lines: [
                    { speaker: "직원", korean: "어서 오세요. 뭐 드릴까요?", english: "Welcome. What can I get you?" },
                    { speaker: "손님", korean: "비빔밥 하나 주세요.", english: "Please give me one bibimbap." },
                    { speaker: "직원", korean: "네, 알겠습니다. 물은 셀프입니다.", english: "Yes, understood. Water is self-service." },
                    { speaker: "손님", korean: "네, 감사합니다.", english: "Yes, thank you." },
                ]
            }
        ]
    },
    2: {
        level: 2,
        title: "초급 2",
        description: "일상생활에서 자주 사용하는 표현을 배웁니다",
        vocabulary: level2Data.vocabulary as Vocabulary[],
        dialogues: []
    },
    3: {
        level: 3,
        title: "중급 1",
        description: "한국 생활 정착과 사회 이해",
        vocabulary: level3Data.vocabulary as Vocabulary[],
        dialogues: []
    },
    4: {
        level: 4,
        title: "중급 2",
        description: "한국 사회와 문화 이해",
        vocabulary: level4Data.vocabulary as Vocabulary[],
        dialogues: []
    },
    5: {
        level: 5,
        title: "고급",
        description: "귀화 시험 대비 및 시민권",
        vocabulary: level5Data.vocabulary as Vocabulary[],
        dialogues: []
    },
};

export const getLevelContent = (level: number) => levelContents[level];
export const getTopicsForLevel = (level: number): string[] => {
    const content = levelContents[level];
    if (!content) return [];
    return Array.from(new Set(content.vocabulary.map(v => v.topic)));
};
export const getVocabularyByTopic = (level: number, topic: string): Vocabulary[] => {
    const content = levelContents[level];
    if (!content) return [];
    return content.vocabulary.filter(v => v.topic === topic);
};

// 모든 레벨 콘텐츠를 배열로 export
export const allLevelContents: LevelContent[] = Object.values(levelContents);
