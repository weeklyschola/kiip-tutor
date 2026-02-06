import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function checkAdmin(req: NextRequest) {
    const adminKey = req.headers.get("x-admin-key");
    const expectedKey = process.env.ADMIN_SECRET_KEY || "kiip-admin-2026";
    return adminKey === expectedKey;
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST(req: NextRequest) {
    if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const filePath = path.join(process.cwd(), "src/data/conversations.json");
        const fileContent = fs.readFileSync(filePath, "utf8");
        const { conversations } = JSON.parse(fileContent);

        console.log(`Migrating ${conversations.length} scenarios...`);

        // 기존 데이터 삭제 (중복 방지, 필요 시 선택)
        // await supabase.from("scenarios").delete().neq("id", 0);

        const { data, error } = await supabase
            .from("scenarios")
            .upsert(conversations.map((c: any) => ({
                id: c.id,
                level: c.level,
                title: c.title,
                category: c.category,
                icon: c.icon,
                description: c.description,
                dialogue: c.dialogue,
                vocabulary: c.vocabulary,
                grammar: c.grammar,
                culture_tip: c.cultureTip
            })))
            .select();

        if (error) throw error;
        return NextResponse.json({ success: true, count: data.length });
    } catch (error: any) {
        console.error("Migration Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
