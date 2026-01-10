# KIIP 튜터

KIIP(사회통합프로그램) 학습을 위한 웹 애플리케이션입니다.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Database/Auth**: Supabase
- **UI**: Tailwind CSS
- **AI SDK**: Vercel AI SDK + OpenAI

## 기능

- 📝 **CBT 모의고사**: 실제 시험과 동일한 환경에서 연습
- 🤖 **1:1 AI 튜터**: 틀린 문제에 대한 맞춤형 설명
- 📊 **데이터 분석**: 전체 사용자의 오답률 기반 취약점 분석

## 설치 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 환경 변수 설정

`.env.local.example`을 `.env.local`로 복사하고 값을 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. `supabase/schema.sql` 파일을 SQL Editor에서 실행
3. 환경 변수에 URL과 Anon Key 설정

## 개인정보 처리

- 이름, 이메일 등 개인정보를 수집하지 않습니다
- 익명화된 UUID로 학습 데이터만 수집합니다
- 학습 분석을 위한 목적으로만 데이터를 사용합니다
