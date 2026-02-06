-- 공지사항 테이블 생성
CREATE TABLE public.notices (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_important BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 정책: 누구나 공지사항 읽기 가능
CREATE POLICY "Anyone can read active notices" ON public.notices
  FOR SELECT USING (is_active = true);

-- 샘플 데이터 삽입
INSERT INTO public.notices (title, content, is_important) VALUES
('KIIP 튜터 베타 서비스 시작', '사회통합프로그램 학습을 위한 KIIP 튜터 베타 서비스를 시작합니다. 많은 이용 바랍니다.', true),
('구글 로그인 단일화 안내', '사용자 편의를 위해 로그인 방식을 구글 계정으로 단일화하였습니다.', false);
