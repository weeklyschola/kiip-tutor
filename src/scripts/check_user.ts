import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually load env
function loadEnv(filename: string) {
    try {
        const envPath = path.resolve(process.cwd(), filename);
        console.log(`Looking for env at: ${envPath}`);
        if (fs.existsSync(envPath)) {
            console.log(`Found ${filename}`);
            const content = fs.readFileSync(envPath, "utf8");
            const lines = content.replace(/\r\n/g, "\n").split("\n");

            lines.forEach(line => {
                // Skip comments and empty lines
                if (line.trim().startsWith("#") || !line.trim()) return;

                const parts = line.split("=");
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, ""); // Remove quotes

                    if (key) {
                        process.env[key] = value;
                        // Mask sensitive keys in logs
                        const displayValue = key.includes("KEY") || key.includes("SECRET") ? "***" : value;
                        console.log(`Loaded: ${key}=${displayValue}`);
                    }
                }
            });
        } else {
            console.log(`File not found: ${envPath}`);
        }
    } catch (e) {
        console.error("Failed to load env:", filename);
    }
}

loadEnv(".env");
loadEnv(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env vars");
    console.log("URL:", supabaseUrl);
    console.log("Key:", supabaseServiceKey ? "Set" : "Missing");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser(userId: string) {
    console.log(`Checking user: ${userId}`);
    // 1. Check Auth (by email) - simulating the logic in login route
    const email = `${userId}@kiip-tutor.local`;
    console.log(`Constructed Email: ${email}`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("List users error:", error);
        return;
    }

    const user = users.find(u => u.email === email);

    if (user) {
        console.log("Auth User Found:");
        console.log(`- ID: ${user.id}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Confirmed: ${user.email_confirmed_at}`);
        console.log(`- Last Sign In: ${user.last_sign_in_at}`);

        // 2. Check Profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId) // Check by user_id column
            .maybeSingle();

        if (profile) {
            console.log("Profile Found (by user_id):", profile);
        } else {
            console.error("Profile NOT Found (by user_id):", profileError);
            // Try by ID
            const { data: profileById } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();

            if (profileById) {
                console.log("Profile Found (by UUID match):", profileById);
            } else {
                console.log("Profile completely missing.");
            }
        }

    } else {
        console.error("Auth User NOT Found for email:", email);
        console.log("Listing similar users:");
        users.forEach(u => {
            if (u.email?.includes(userId)) {
                console.log(`- ${u.email}`);
            }
        });
    }
}

// Get ID from args
const targetId = process.argv[2] || "1234";
checkUser(targetId);
