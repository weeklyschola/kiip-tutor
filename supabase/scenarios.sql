-- 대화 시나리오 테이블 생성
CREATE TABLE public.scenarios (
  id SERIAL PRIMARY KEY,
  level INTEGER NOT NULL CHECK (level >= 0 AND level <= 5),
  title TEXT NOT NULL,
  category VARCHAR(100),
  icon VARCHAR(10),
  description TEXT,
  dialogue JSONB NOT NULL DEFAULT '[]', -- [{speaker, role, text, avatar, translation}]
  vocabulary JSONB NOT NULL DEFAULT '[]', -- [word1, word2]
  grammar JSONB NOT NULL DEFAULT '[]', -- [grammar1, grammar2]
  culture_tip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- 정책: 누구나 시나리오 읽기 가능
CREATE POLICY "Anyone can read scenarios" ON public.scenarios
  FOR SELECT USING (true);
