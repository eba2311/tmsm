/**
 * apply-schema.js — Apply SQL schema to any PostgreSQL database.
 *
 * Reads DATABASE_URL from environment (server/.env) and applies
 * the SQL schema file (supabase_schema.sql) to it.
 *
 * Usage: node server/apply-schema.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tmsm';

const requireSsl =
  connectionString.includes('sslmode=require') || process.env.DB_SSL === 'true';

const applySchema = async () => {
  const client = new Client({
    connectionString,
    ssl: requireSsl ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected!');

    // Look for the schema SQL file in the project root
    const schemaPath = path.join(__dirname, '..', 'supabase_schema.sql');
    console.log(`Reading schema from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema...');
    await client.query(schemaSql);
    console.log('✅ Schema applied successfully!');
  } catch (err) {
    console.error('❌ Error applying schema:', err.message);
  } finally {
    await client.end();
  }
};

applySchema();
