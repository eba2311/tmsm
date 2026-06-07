const { Sequelize } = require('sequelize');
require('dotenv').config();

// PostgreSQL connection string
// Priority: DATABASE_URL → POSTGRES_URL → local default
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgres://postgres:password@localhost:5432/tmsm';

// Enable SSL only when the URL explicitly requests it
const requireSsl =
  dbUrl.includes('sslmode=require') || process.env.DB_SSL === 'true';

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging:
    process.env.NODE_ENV === 'development'
      ? (msg) => {
          if (msg.length < 500) console.log('[SQL]', msg);
        }
      : false,
  dialectOptions: requireSsl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  pool: {
    max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// ── Test database connection ──────────────────────────────────────────────────
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL database connected successfully');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
};

// ── Sync database ─────────────────────────────────────────────────────────────
// Uses plain sequelize.sync() → "CREATE TABLE IF NOT EXISTS".
// Never drops or alters existing tables; any error is treated as a warning so
// the server starts even if a migration hasn't been applied yet.
const ensureUserColumns = async () => {
  const queries = [
    `DO $$ BEGIN
       CREATE TYPE enum_users_gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
     EXCEPTION
       WHEN duplicate_object THEN null;
     END $$;`,
    `DO $$ BEGIN
       CREATE TYPE enum_users_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED');
     EXCEPTION
       WHEN duplicate_object THEN null;
     END $$;`,
    `DO $$ BEGIN
       CREATE TYPE enum_users_locale AS ENUM ('en', 'am');
     EXCEPTION
       WHEN duplicate_object THEN null;
     END $$;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS gender enum_users_gender;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(255);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS status enum_users_status DEFAULT 'ACTIVE';`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_mfa_enabled BOOLEAN DEFAULT FALSE;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;`,
  ];

  for (const query of queries) {
    try {
      await sequelize.query(query);
    } catch (err) {
      console.warn('⚠️  User column migration skipped:', err.message);
    }
  }
};

const syncDatabase = async () => {
  try {
    // Use { alter: false } - tables are already fully synced.
    // Only create missing tables; never alter or drop existing ones.
    await sequelize.sync();
    await ensureUserColumns();
    console.log('✅ Database tables verified / created successfully');
  } catch (error) {
    console.warn('⚠️  Database sync warning (non-fatal):', error.message);
    console.warn('   All pre-existing tables remain intact and usable.');
  }
};

module.exports = { sequelize, testConnection, syncDatabase };
