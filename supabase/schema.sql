-- KIIP 튜터 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. 문제 테이블
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  level INTEGER NOT NULL CHECK (level >= 0 AND level <= 5),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- ["보기1", "보기2", "보기3", "보기4"]
  correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
  explanation TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CBT 응답 테이블 (익명화된 User_ID 사용)
CREATE TABLE cbt_attempts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL, -- 익명화된 UUID (이름, 이메일 등 개인정보 없음)
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER NOT NULL, -- 초 단위
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 사용자 프리미엄 상태 테이블
CREATE TABLE user_status (
  user_id UUID PRIMARY KEY,
  is_premium BOOLEAN DEFAULT FALSE,
  daily_chat_count INTEGER DEFAULT 0,
  last_chat_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_questions_level ON questions(level);
CREATE INDEX idx_attempts_user ON cbt_attempts(user_id);
CREATE INDEX idx_attempts_question ON cbt_attempts(question_id);
CREATE INDEX idx_attempts_created ON cbt_attempts(created_at);

-- Row Level Security (RLS) 활성화
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- 정책: 누구나 문제 읽기 가능
CREATE POLICY "Anyone can read questions" ON questions
  FOR SELECT USING (true);

-- 정책: 누구나 자신의 응답 기록 가능
CREATE POLICY "Anyone can insert attempts" ON cbt_attempts
  FOR INSERT WITH CHECK (true);

-- 정책: 자신의 응답만 읽기 가능
CREATE POLICY "Users can read own attempts" ON cbt_attempts
  FOR SELECT USING (true);

-- 샘플 문제 데이터 삽입
INSERT INTO questions (level, question_text, options, correct_answer, explanation, category) VALUES
(3, '대한민국의 수도는 어디입니까?', '["부산", "서울", "대구", "인천"]', 1, '대한민국의 수도는 서울입니다. 서울은 한강을 중심으로 발달한 도시입니다.', '한국 역사/문화'),
(3, '다음 중 한글을 창제한 왕은 누구입니까?', '["태종", "세종대왕", "정조", "영조"]', 1, '한글은 1443년 세종대왕이 창제하고 1446년에 반포하였습니다.', '한국 역사/문화'),
(3, '대한민국의 국기 이름은 무엇입니까?', '["일장기", "태극기", "성조기", "삼색기"]', 1, '대한민국의 국기는 태극기입니다. 중앙의 태극 문양과 네 모서리의 건곤감리로 구성됩니다.', '한국 역사/문화'),
(3, '다음 중 대한민국의 공휴일이 아닌 것은?', '["삼일절", "광복절", "어린이날", "추석 다음날"]', 3, '삼일절(3.1), 광복절(8.15), 어린이날(5.5)은 공휴일입니다.', '한국 생활'),
(3, '''안녕하세요''의 올바른 사용 시간대는?', '["아침에만", "저녁에만", "언제든지", "밤에만"]', 2, '''안녕하세요''는 시간에 관계없이 언제든지 사용할 수 있는 인사말입니다.', '한국어');

-- =============================================
-- 4. 단어장 테이블
-- =============================================
CREATE TABLE vocabulary (
  id SERIAL PRIMARY KEY,
  level INTEGER NOT NULL CHECK (level >= 0 AND level <= 5),
  word VARCHAR(100) NOT NULL,
  meaning VARCHAR(500) NOT NULL,
  pronunciation VARCHAR(200),
  examples JSONB NOT NULL DEFAULT '[]', -- ["예문1", "예문2"]
  topic VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_vocabulary_level ON vocabulary(level);
CREATE INDEX idx_vocabulary_topic ON vocabulary(topic);

-- RLS 활성화
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

-- 정책: 누구나 단어 읽기 가능
CREATE POLICY "Anyone can read vocabulary" ON vocabulary
  FOR SELECT USING (true);

-- 교재 단어 데이터 삽입 (levelContent.ts 기준)
INSERT INTO vocabulary (level, word, meaning, pronunciation, examples, topic) VALUES

-- =============================================
-- Level 0: 기초 (인사말, 수업 표현, 학교)
-- =============================================

-- 인사말
(0, '안녕하세요', 'Hello', 'annyeonghaseyo', '["안녕하세요? 만나서 반갑습니다.", "선생님, 안녕하세요!", "안녕하세요? 저는 김민수예요."]', '인사말'),
(0, '안녕히 가세요', 'Goodbye (to leaving person)', 'annyeonghi gaseyo', '["안녕히 가세요. 다음에 또 봐요.", "선생님, 안녕히 가세요!", "내일 봐요. 안녕히 가세요."]', '인사말'),
(0, '안녕히 계세요', 'Goodbye (to staying person)', 'annyeonghi gyeseyo', '["저 먼저 갈게요. 안녕히 계세요.", "안녕히 계세요. 좋은 하루 보내세요.", "어머니, 안녕히 계세요."]', '인사말'),
(0, '감사합니다', 'Thank you', 'gamsahamnida', '["도와주셔서 감사합니다.", "선물 감사합니다.", "정말 감사합니다."]', '인사말'),
(0, '죄송합니다', 'I''m sorry', 'joesonghamnida', '["늦어서 죄송합니다.", "죄송합니다, 다시 한번 말씀해 주세요.", "정말 죄송합니다."]', '인사말'),
(0, '만나서 반갑습니다', 'Nice to meet you', 'mannaseo bangapseumnida', '["안녕하세요, 만나서 반갑습니다.", "처음 뵙겠습니다. 만나서 반갑습니다.", "저도 만나서 반갑습니다."]', '인사말'),
(0, '주말 잘 보내세요', 'Have a good weekend', 'jumal jal bonaeseyo', '["주말 잘 보내세요!", "다음 주에 봐요. 주말 잘 보내세요.", "선생님도 주말 잘 보내세요."]', '인사말'),
(0, '잘 먹겠습니다', 'I will eat well (before meal)', 'jal meokgesseumnida', '["잘 먹겠습니다!", "어머니, 잘 먹겠습니다.", "맛있겠다! 잘 먹겠습니다."]', '인사말'),
(0, '잘 먹었습니다', 'I ate well (after meal)', 'jal meogeosseumnida', '["잘 먹었습니다. 맛있었어요.", "식사 잘 먹었습니다.", "정말 잘 먹었습니다."]', '인사말'),

-- 수업 표현
(0, '잘 들어 보세요', 'Listen carefully', 'jal deureo boseyo', '["잘 들어 보세요. 발음 연습합니다.", "음악을 잘 들어 보세요.", "선생님 말씀 잘 들어 보세요."]', '수업 표현'),
(0, '따라 하세요', 'Repeat after me', 'ttara haseyo', '["저를 따라 하세요.", "발음을 따라 하세요.", "천천히 따라 하세요."]', '수업 표현'),
(0, '책을 보세요', 'Look at the book', 'chaegeul boseyo', '["10쪽을 보세요.", "교과서를 보세요.", "책을 보세요. 연습 문제입니다."]', '수업 표현'),
(0, '칠판을 보세요', 'Look at the board', 'chilpaneul boseyo', '["칠판을 보세요.", "앞에 칠판을 보세요.", "칠판을 보세요. 써 보겠습니다."]', '수업 표현'),
(0, '읽어 보세요', 'Please read', 'ilgeo boseyo', '["큰 소리로 읽어 보세요.", "다 같이 읽어 보세요.", "혼자 읽어 보세요."]', '수업 표현'),
(0, '말해 보세요', 'Please speak/say', 'malhae boseyo', '["한국어로 말해 보세요.", "다시 말해 보세요.", "큰 소리로 말해 보세요."]', '수업 표현'),
(0, '써 보세요', 'Please write', 'sseo boseyo', '["공책에 써 보세요.", "이름을 써 보세요.", "따라서 써 보세요."]', '수업 표현'),
(0, '시작하세요', 'Please start', 'sijakhaseyo', '["지금부터 시작하세요.", "시험 시작하세요.", "연습 시작하세요."]', '수업 표현'),
(0, '질문 있어요?', 'Do you have questions?', 'jilmun isseoyo?', '["질문 있어요?", "모르는 것 있어요? 질문 있어요?", "질문 있어요? 없으면 끝내겠습니다."]', '수업 표현'),
(0, '네, 있어요', 'Yes, I have', 'ne, isseoyo', '["네, 질문 있어요.", "네, 있어요. 잠시만요.", "네, 있어요. 선생님!"]', '수업 표현'),
(0, '아니요, 없어요', 'No, I don''t have', 'aniyo, eopseoyo', '["아니요, 질문 없어요.", "아니요, 없어요. 다 이해했어요.", "아니요, 없어요. 감사합니다."]', '수업 표현'),

-- 학교
(0, '가방', 'Bag', 'gabang', '["가방이 있어요.", "가방을 메고 학교에 가요.", "저 가방은 누구 거예요?"]', '학교'),
(0, '공책', 'Notebook', 'gongchaek', '["공책에 써요.", "새 공책을 샀어요.", "공책이 몇 권 있어요?"]', '학교'),
(0, '연필', 'Pencil', 'yeonpil', '["연필로 써요.", "연필을 깎아요.", "연필이 짧아요."]', '학교'),
(0, '지우개', 'Eraser', 'jiugae', '["지우개를 빌려요.", "지우개로 지워요.", "지우개가 필요해요."]', '학교'),
(0, '책', 'Book', 'chaek', '["책을 읽어요.", "이 책 재미있어요.", "책을 펴세요."]', '학교'),
(0, '책상', 'Desk', 'chaeksang', '["책상 위에 책이 있어요.", "책상이 커요.", "책상을 정리해요."]', '학교'),
(0, '의자', 'Chair', 'uija', '["의자에 앉아요.", "의자가 편해요.", "의자를 옮겨요."]', '학교'),
(0, '칠판', 'Blackboard', 'chilpan', '["칠판을 봐요.", "칠판에 글을 써요.", "칠판을 지워요."]', '학교'),
(0, '선생님', 'Teacher', 'seonsaengnim', '["선생님 안녕하세요.", "선생님이 친절해요.", "선생님께 질문해요."]', '학교'),
(0, '학생', 'Student', 'haksaeng', '["저는 학생이에요.", "학생들이 공부해요.", "우리 반 학생이 많아요."]', '학교'),

-- =============================================
-- Level 1: 초급 1 (장소, 동사, 형용사, 시간)
-- =============================================

-- 장소
(1, '도서관', 'Library', 'doseogwan', '["도서관에서 공부해요.", "도서관이 조용해요.", "도서관에서 책을 빌려요."]', '장소'),
(1, '식당', 'Restaurant', 'sikdang', '["식당에서 밥을 먹어요.", "이 식당이 맛있어요.", "한국 식당에 가요."]', '장소'),
(1, '병원', 'Hospital', 'byeongwon', '["병원에 가요.", "병원에서 검사해요.", "병원이 가까워요."]', '장소'),
(1, '약국', 'Pharmacy', 'yakguk', '["약국에서 약을 사요.", "약국이 어디예요?", "약국에 가야 해요."]', '장소'),
(1, '은행', 'Bank', 'eunhaeng', '["은행에 가요.", "은행에서 돈을 찾아요.", "은행이 몇 시에 열어요?"]', '장소'),
(1, '시장', 'Market', 'sijang', '["시장이 싸요.", "시장에서 채소를 사요.", "전통 시장에 가요."]', '장소'),
(1, '마트', 'Mart', 'mateu', '["마트에 가요.", "마트에서 장을 봐요.", "마트가 24시간이에요."]', '장소'),
(1, '공원', 'Park', 'gongwon', '["공원에서 운동해요.", "공원이 넓어요.", "주말에 공원에 가요."]', '장소'),

-- 동사
(1, '가다', 'To go', 'gada', '["집에 가요.", "학교에 가요.", "어디 가요?"]', '동사'),
(1, '오다', 'To come', 'oda', '["친구가 와요.", "한국에 왔어요.", "빨리 오세요."]', '동사'),
(1, '먹다', 'To eat', 'meokda', '["밥을 먹어요.", "맛있게 먹었어요.", "뭐 먹을래요?"]', '동사'),
(1, '마시다', 'To drink', 'masida', '["물을 마셔요.", "커피 마셔요.", "주스를 마셔요."]', '동사'),
(1, '보다', 'To see/watch', 'boda', '["영화를 봐요.", "텔레비전을 봐요.", "친구를 봤어요."]', '동사'),
(1, '사다', 'To buy', 'sada', '["옷을 사요.", "과일을 사요.", "선물 사러 가요."]', '동사'),
(1, '공부하다', 'To study', 'gongbuhada', '["한국어를 공부해요.", "열심히 공부해요.", "시험 공부해요."]', '동사'),
(1, '일하다', 'To work', 'ilhada', '["회사에서 일해요.", "열심히 일해요.", "몇 시까지 일해요?"]', '동사'),

-- 형용사
(1, '크다', 'Big', 'keuda', '["집이 커요.", "가방이 너무 커요.", "큰 것 주세요."]', '형용사'),
(1, '작다', 'Small', 'jakda', '["가방이 작아요.", "글씨가 작아요.", "작은 사이즈 있어요?"]', '형용사'),
(1, '좋다', 'Good', 'jota', '["날씨가 좋아요.", "기분이 좋아요.", "좋은 생각이에요."]', '형용사'),
(1, '비싸다', 'Expensive', 'bissada', '["옷이 비싸요.", "너무 비싸요.", "비싼 레스토랑이에요."]', '형용사'),
(1, '싸다', 'Cheap', 'ssada', '["이거 싸요.", "시장이 싸요.", "싼 거 찾아요."]', '형용사'),
(1, '맛있다', 'Delicious', 'masitda', '["불고기가 맛있어요.", "정말 맛있어요.", "맛있게 드세요."]', '형용사'),

-- 시간
(1, '오늘', 'Today', 'oneul', '["오늘 뭐 해요?", "오늘 바빠요.", "오늘 날씨 좋아요."]', '시간'),
(1, '내일', 'Tomorrow', 'naeil', '["내일 만나요.", "내일 시험이에요.", "내일 뭐 할 거예요?"]', '시간'),
(1, '어제', 'Yesterday', 'eoje', '["어제 공부했어요.", "어제 뭐 했어요?", "어제 비가 왔어요."]', '시간'),
(1, '지금', 'Now', 'jigeum', '["지금 몇 시예요?", "지금 바빠요.", "지금 출발해요."]', '시간'),

-- =============================================
-- Level 2: 초급 2 (사회생활)
-- =============================================
(2, '초대하다', 'To invite', 'chodaehada', '["친구를 집에 초대해요.", "생일 파티에 초대해요.", "결혼식에 초대받았어요."]', '사회생활'),
(2, '선물', 'Gift', 'seonmul', '["생일 선물을 줘요.", "선물 고마워요.", "선물 뭐가 좋을까요?"]', '사회생활');

