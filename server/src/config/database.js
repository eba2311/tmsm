const { Sequelize } = require('sequelize');
require('dotenv').config();

// PostgreSQL connection configuration
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgres://localhost:5432/tmsm';
const isSupabase = dbUrl.includes('supabase.com') || dbUrl.includes('pooler.supabase');

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: isSupabase ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL database connected successfully');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
};

// Sync database (create/align tables to models)
const syncDatabase = async (force = false) => {
  try {
    if (force) {
      await sequelize.sync({ force: true });
    } else {
      await sequelize.sync({ alter: true });
    }
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    const canFallbackToForce =
      !force &&
      isDev &&
      (String(error?.message || '').includes('cannot cast type') ||
        String(error?.message || '').includes('column') ||
        String(error?.message || '').includes('enum'));

    if (canFallbackToForce) {
      console.warn(`⚠️ Sync alter failed (${error.message}). Retrying with force sync (dev only).`);
      await sequelize.sync({ force: true });
      console.log('✅ Database synchronized successfully (force sync)');
      return;
    }

    console.error('❌ Database synchronization failed:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
