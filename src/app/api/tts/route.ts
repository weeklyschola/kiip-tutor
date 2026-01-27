import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import path from "path";
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

        // Service Account 인증
        const keyFilePath = path.join(process.cwd(), "service-account.json");
        const auth = new GoogleAuth({
            keyFile: keyFilePath,
            scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        });

        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        if (!accessToken.token) {
            console.error("Failed to get access token");
            return NextResponse.json(
                { error: "Authentication failed", useBrowserTTS: true },
                { status: 500 }
            );
        }

        // Cloud Text-to-Speech API 호출
        const url = "https://texttospeech.googleapis.com/v1/text:synthesize";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken.token}`,
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
            return NextResponse.json(
                { error: "TTS generation failed", useBrowserTTS: true },
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
