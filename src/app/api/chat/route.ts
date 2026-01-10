import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const runtime = 'edge';

export async function POST(req: Request) {
    const { messages, questionContext } = await req.json();

    // KIIP 전문 강사 시스템 프롬프트
    const systemPrompt = `당신은 KIIP(사회통합프로그램) 전문 강사입니다. 
한국어를 배우는 외국인 학습자를 위해 친절하고 이해하기 쉽게 설명해주세요.

[틀린 문제 정보]
${questionContext ? `
문제: ${questionContext.question}
학습자가 선택한 답: ${questionContext.selectedAnswer}
정답: ${questionContext.correctAnswer}
해설: ${questionContext.explanation}
` : '정보 없음'}

학습자가 이 문제에 대해 질문하면:
1. 왜 틀렸는지 친절하게 설명해주세요
2. 관련된 한국 문화나 역사 배경을 추가로 알려주세요
3. 비슷한 유형의 문제가 나올 수 있다고 알려주고, 어떻게 구별하는지 팁을 주세요
4. 격려의 말로 마무리해주세요

응답은 한국어로 하되, 필요하면 쉬운 표현을 사용해주세요.`;

    const result = streamText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        messages,
    });

    return result.toDataStreamResponse();
}
