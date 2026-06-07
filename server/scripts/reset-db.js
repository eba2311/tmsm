require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');

// Load all models
require('../src/models');
const User = require('../src/models/User');

async function resetDatabase() {
  console.log('==========================================');
  console.log('⚠️  WARNING: THIS WILL DROP ALL TABLES IN POSTGRESQL');
  console.log('==========================================');

  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected.');

    // Force sync will DROP all existing tables and CREATE them fresh from the models
    console.log('⏳ Dropping and recreating all tables...');
    await sequelize.sync({ force: true });
    console.log('✅ All tables successfully created!');

    // Create default Admin
    console.log('⏳ Seeding default Admin user...');
    const hashedPassword = await bcrypt.hash('Admin@1234', 12);
    await User.create({
      name: 'System Admin',
      email: 'admin@semenconnect.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    });
    console.log('✅ Admin user created (admin@semenconnect.com / Admin@1234)');

    console.log('==========================================');
    console.log('✅ DATABASE RESET SUCCESSFUL.');
    console.log('👉 You can now run `npm run seed` to add mock data, or start the server.');
    console.log('==========================================');
  } catch (error) {
    console.error('❌ Database Reset Failed:', error);
  } finally {
    await sequelize.close();
  }
}

resetDatabase();
