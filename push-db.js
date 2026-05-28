require('dotenv').config({ path: './server/.env' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function pushToSupabase() {
    console.log("==========================================");
    console.log("🚀 INITIATING SUPABASE SQL PUSH...");
    console.log("==========================================");

    let dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("❌ ERROR: DATABASE_URL is missing in server/.env");
        process.exit(1);
    }
    
    // Add SSL to Supabase connection if it's missing
    if (!dbUrl.includes('sslmode')) {
        dbUrl += '?sslmode=require';
    }

    const client = new Client({ connectionString: dbUrl });

    try {
        console.log("⏳ Connecting to Supabase Database...");
        await client.connect();
        console.log("✅ Connected Successfully!");

        const sqlFilePath = path.join(__dirname, 'supabase_schema.sql');
        console.log("⏳ Reading supabase_schema.sql...");
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log("⏳ Executing SQL Schema...");
        await client.query(sql);

        console.log("==========================================");
        console.log("✅ SUCCESS! ALL TABLES AND POLICIES PUSHED TO SUPABASE!");
        console.log("==========================================");
    } catch (err) {
        console.error("❌ ERROR PUSHING TO SUPABASE:");
        console.error(err.message);
    } finally {
        await client.end();
    }
}

pushToSupabase();
