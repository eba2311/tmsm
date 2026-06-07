#!/usr/bin/env node

/**
 * Database Migration Script
 * Handles database schema migrations and updates
 * Run: npm run migrate
 */

require('dotenv').config();
const { syncDatabase } = require('../src/config/database');
const logger = require('../src/config/logger');

async function migrate() {
  console.log('📦 Running Database Migrations...\n');

  try {
    // Sync all models with database
    // This creates tables if they don't exist and adds missing columns
    await syncDatabase();

    console.log('✅ Database migrations completed successfully\n');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
