const supabase = require('./supabase');
const logger = require('./logger');

const connectDB = async () => {
  try {
    // Verify that Supabase client is initialized
    if (!supabase) {
      throw new Error('Supabase client is missing or misconfigured');
    }

    // Ping the Supabase project to ensure the connection works
    const { error } = await supabase.from('users').select('id').limit(1);
    
    if (error && error.code !== '42P01') { 
      // 42P01 is "undefined_table", meaning connection works but table is missing
      throw new Error(`Supabase ping failed: ${error.message}`);
    }

    logger.info(`✅ Supabase (PostgreSQL) connected successfully`);
  } catch (error) {
    logger.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
