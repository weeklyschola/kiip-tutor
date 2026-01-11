import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key !== "debug1234") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

    return NextResponse.json({
        NEXT_PUBLIC_SUPABASE_URL: url ? `${url.substring(0, 8)}... (${url.length} chars)` : "MISSING",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anon ? `Exists (${anon.length} chars)` : "MISSING",
        SUPABASE_SERVICE_ROLE_KEY: service ? `Exists (${service.length} chars)` : "MISSING",
        NODE_ENV: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
}
