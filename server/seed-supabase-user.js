require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');

async function seedUser() {
  try {
    console.log('Seeding admin user into PostgreSQL...');
    const hashedPassword = await bcrypt.hash('password123', 12);

    const [user, created] = await User.findOrCreate({
      where: { email: 'admin@semenconnect.com' },
      defaults: {
        name: 'Admin User',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        locale: 'en',
      },
    });

    if (created) {
      console.log('✅ Successfully created user! You can now log in with:');
    } else {
      console.log('ℹ️  User already exists. Resetting password...');
      await user.update({ password: hashedPassword }, { hooks: false });
      console.log('✅ Password reset. You can now log in with:');
    }
    console.log('   Email:    admin@semenconnect.com');
    console.log('   Password: password123');
  } catch (err) {
    console.error('❌ Failed to create user:', err.message);
  } finally {
    await sequelize.close();
  }
}

seedUser();
