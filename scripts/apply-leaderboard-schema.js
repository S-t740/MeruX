// apply-leaderboard-schema.js
// Run with: node apply-leaderboard-schema.js
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabase = createClient(
    "https://twnaxwvkxsjgogekawxq.supabase.co",
    // Using service role key to bypass RLS for schema changes
    process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3bmF4d3ZreHNqZ29nZWthd3hxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg3MTQxOSwiZXhwIjoyMDg4NDQ3NDE5fQ.2WSmotDf89O1GWStZzooPrO_bXDhj615vK1HpWwFejs"
);

async function run() {
    console.log("🚀 Applying leaderboard schema...\n");

    const sqlFile = fs.readFileSync(path.join(__dirname, "add_leaderboard_schema.sql"), "utf8");

    // Split into individual statements (semicolon-separated)
    const statements = sqlFile
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith("--"));

    let success = 0;
    let failed = 0;

    for (const stmt of statements) {
        // Skip pure comment blocks
        const cleanStmt = stmt.replace(/--[^\n]*/g, "").trim();
        if (!cleanStmt) continue;

        try {
            const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" });
            if (error) {
                // Try direct query for simple statements
                const { error: err2 } = await supabase.from("_exec").select().throwOnError();
                console.log(`⚠️  Statement needs manual execution: ${stmt.substring(0, 60)}...`);
                failed++;
            } else {
                success++;
            }
        } catch (e) {
            // Skip - will handle below
            failed++;
        }
    }

    console.log(`\n✅ ${success} statements succeeded`);
    if (failed > 0) {
        console.log(`⚠️  ${failed} statements need manual execution in Supabase SQL Editor`);
    }

    // Test if the table exists now
    console.log("\n🔍 Checking if user_reputation table exists...");
    const { data, error } = await supabase
        .from("user_reputation")
        .select("user_id, score, rank_tier")
        .limit(5);

    if (error) {
        console.log("❌ Table not found. Please run the SQL in Supabase SQL Editor:");
        console.log("   File: add_leaderboard_schema.sql");
        console.log("   Go to: https://supabase.com/dashboard → SQL Editor → Paste & Run");
    } else {
        console.log(`✅ Table exists! Found ${data.length} rows.`);
        if (data.length > 0) {
            console.log("📊 Sample data:", JSON.stringify(data, null, 2));
        }
    }
}

run().catch(console.error);
