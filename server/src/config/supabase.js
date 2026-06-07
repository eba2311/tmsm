/**
 * pgPool – a lightweight native pg.Pool for raw SQL queries.
 *
 * The Sequelize instance (database.js) handles ORM-level queries.
 * This pool is exposed for any service that needs to run raw SQL
 * directly (e.g. analytics aggregations, health checks).
 */
const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/tmsm',
  // Enable SSL only if the DATABASE_URL explicitly contains ssl=true or sslmode=require
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected pg pool error:', err.message);
});

module.exports = pool;
