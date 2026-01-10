
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load environment variables manually
function loadEnv() {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, "utf-8");
        envConfig.split(/\r?\n/).forEach((line) => {
            const [key, value] = line.split("=");
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase env vars.");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function runDebug() {
    console.log("Starting Debug Script...");

    // 1. Fetch a user (specifically '1234' or any existing one)
    const { data: users, error: fetchError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .limit(1);

    if (fetchError) {
        console.error("Fetch Error:", fetchError);
        return;
    }

    if (!users || users.length === 0) {
        console.log("No users found to test update.");
        return;
    }

    const testUser = users[0];
    console.log(`Testing with user: ${testUser.nickname} (${testUser.id})`);
    console.log("Current State:", testUser);

    // 2. Try Update: Grant Level 2
    console.log("\n--- Test 1: Grant Level 2 ---");
    const currentLevels = testUser.purchased_levels || [];
    const newLevels = [...new Set([...currentLevels, 2])].sort((a, b) => a - b);

    const { data: update1, error: error1 } = await supabaseAdmin
        .from("profiles")
        .update({ purchased_levels: newLevels })
        .eq("id", testUser.id)
        .select();

    if (error1) {
        console.error("failed grant level:", JSON.stringify(error1, null, 2));
    } else {
        console.log("Success grant level:", update1);
    }

    // 3. Try Update: Revoke Subscription (Set to null)
    console.log("\n--- Test 2: Revoke Subscription ---");
    const { data: update2, error: error2 } = await supabaseAdmin
        .from("profiles")
        .update({ premium_until: null })
        .eq("id", testUser.id)
        .select();

    if (error2) {
        console.error("failed revoke subscription:", JSON.stringify(error2, null, 2));
    } else {
        console.log("Success revoke subscription:", update2);
    }
}

runDebug();
