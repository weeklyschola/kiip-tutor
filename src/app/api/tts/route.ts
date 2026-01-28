import { NextRequest, NextResponse } from "next/server";
import { getSpeakerVoice } from "@/lib/voiceMapping";

export async function POST(req: NextRequest) {
    try {
        const { text, speaker } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        // 화자에 따른 음성 선택
        const voice = speaker ? getSpeakerVoice(speaker) : "ko-KR-Neural2-A";

        console.log(`[TTS] Text: "${text.substring(0, 20)}...", Speaker: ${speaker}, Voice: ${voice}`);

        // API Key 방식 (Vercel 배포 호환) - Service Account 대신 API Key 사용
        // [임시] 사용자 요청에 따라 Vercel 환경변수 설정 대신 코드에 직접 키 입력 (테스트 후 삭제 필요)
        const apiKey = "AQ.Ab8RN6J2zR3InCH0kJlJ1Jk3qDxTm3LwY1xg0YrwmbV5mwKTeg" || process.env.GOOGLE_MAPPED_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_TTS_API_KEY;

        if (!apiKey) {
            console.error("[TTS] API Key Missing. Please set GOOGLE_MAPPED_API_KEY in Vercel.");
            return NextResponse.json(
                { error: "Server Configuration Error: TTS Key missing", useBrowserTTS: true },
                { status: 500 }
            );
        }

        // Cloud Text-to-Speech API 호출 (API Key via Query Param)
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                input: { text },
                voice: {
                    languageCode: "ko-KR",
                    name: voice,
                },
                audioConfig: {
                    audioEncoding: "MP3",
                    pitch: 0,
                    speakingRate: 0.9,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("=== Cloud TTS Error ===");
            console.error("Status:", response.status);
            console.error("Response:", errorText);
            console.error("======================");

            // Try to parse JSON error if possible
            let detailedError = errorText;
            try {
                const jsonError = JSON.parse(errorText);
                if (jsonError.error && jsonError.error.message) {
                    detailedError = jsonError.error.message;
                }
            } catch (e) {
                // Not JSON, keep text
            }

            return NextResponse.json(
                { error: `Cloud TTS Error (${response.status}): ${detailedError}`, useBrowserTTS: true },
                { status: 500 }
            );
        }

        const data = await response.json();
        const audioContent = data.audioContent;

        if (!audioContent) {
            console.error("No audio data in response");
            return NextResponse.json(
                { error: "No audio data", useBrowserTTS: true },
                { status: 500 }
            );
        }

        // Base64 디코딩
        const audioBuffer = Buffer.from(audioContent, "base64");

        // MP3 오디오 반환
        return new NextResponse(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("=== TTS Exception ===");
        console.error("Type:", error instanceof Error ? error.constructor.name : typeof error);
        console.error("Message:", error instanceof Error ? error.message : String(error));
        console.error("Stack:", error instanceof Error ? error.stack : "N/A");
        console.error("====================");
        return NextResponse.json(
            { error: "TTS generation failed", useBrowserTTS: true },
            { status: 500 }
        );
    }
}
