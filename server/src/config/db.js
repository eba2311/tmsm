/**
 * connectDB – verifies the PostgreSQL connection at startup.
 *
 * Uses Sequelize (which in turn uses the pg driver) so the test
 * exercises exactly the same code-path as every ORM query.
 */
const { testConnection } = require('./database');
const logger = require('./logger');

const connectDB = async () => {
  try {
    await testConnection();
    logger.info('✅ PostgreSQL connected successfully');
  } catch (error) {
    logger.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
