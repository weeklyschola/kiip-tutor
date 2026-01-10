import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// WAV 헤더 생성 함수
function createWavHeader(dataLength: number, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
    const header = Buffer.alloc(44);
    const byteRate = sampleRate * channels * (bitsPerSample / 8);
    const blockAlign = channels * (bitsPerSample / 8);

    header.write("RIFF", 0);
    header.writeUInt32LE(36 + dataLength, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write("data", 36);
    header.writeUInt32LE(dataLength, 40);

    return header;
}

export async function POST(req: NextRequest) {
    try {
        const { text, premium = false, voice = "Kore" } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        // 프리미엄 사용자만 Gemini TTS 사용 가능
        if (!premium) {
            // 무료 사용자는 클라이언트에서 Web Speech API 사용하도록 안내
            return NextResponse.json(
                { error: "Premium feature", useBrowserTTS: true },
                { status: 402 }
            );
        }

        // 프리미엄: Gemini 2.5 Flash TTS
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "TTS API not configured", useBrowserTTS: true },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!data) {
            return NextResponse.json(
                { error: "No audio data", useBrowserTTS: true },
                { status: 500 }
            );
        }

        const pcmBuffer = Buffer.from(data, "base64");
        const wavHeader = createWavHeader(pcmBuffer.length);
        const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

        return new NextResponse(wavBuffer, {
            headers: {
                "Content-Type": "audio/wav",
                "Content-Length": wavBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("TTS Server Error:", error);
        return NextResponse.json(
            { error: "TTS generation failed", useBrowserTTS: true },
            { status: 500 }
        );
    }
}
