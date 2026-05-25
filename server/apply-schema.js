const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres.ixfjermoridarypknxpr:W85xSMdffVQnEJ8T@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

const applySchema = async () => {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected!');

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
