/**
 * fix-admin.js
 * Run this once to ensure the admin user exists with the correct password.
 * Usage: node fix-admin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not set in .env file!');
  process.exit(1);
}

const requireSsl =
  dbUrl.includes('sslmode=require') || process.env.DB_SSL === 'true';

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: requireSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING },
  role: { type: DataTypes.ENUM('SUPER_ADMIN', 'OPERATOR', 'DRIVER', 'AGENT', 'PASSENGER'), defaultValue: 'PASSENGER' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  locale: { type: DataTypes.ENUM('en', 'am'), defaultValue: 'en' },
  refreshToken: { type: DataTypes.STRING },
  passwordResetToken: { type: DataTypes.STRING },
  passwordResetExpires: { type: DataTypes.DATE },
  lastLogin: { type: DataTypes.DATE },
  isMfaEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  avatar: { type: DataTypes.STRING, defaultValue: '' },
  phone: { type: DataTypes.STRING },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

async function fixAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    const ADMIN_EMAIL = 'admin@semenconnect.com';
    const ADMIN_PASSWORD = 'Admin@1234';

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const [user, created] = await User.findOrCreate({
      where: { email: ADMIN_EMAIL },
      defaults: {
        name: 'Admin User',
        email: ADMIN_EMAIL,
        password: hashed,
        role: 'SUPER_ADMIN',
        isActive: true,
        locale: 'en',
      }
    });

    if (!created) {
      // User exists - force update password directly using raw query to bypass hooks
      await sequelize.query(
        `UPDATE users SET password = :password, is_active = true, role = 'SUPER_ADMIN' WHERE email = :email`,
        { replacements: { password: hashed, email: ADMIN_EMAIL } }
      );
      console.log('✅ Admin user password RESET successfully!');
    } else {
      console.log('✅ Admin user CREATED successfully!');
    }

    console.log('');
    console.log('========================================');
    console.log('   LOGIN CREDENTIALS');
    console.log('========================================');
    console.log(`   Email   : ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('========================================');
    console.log('');
    console.log('🚀 You can now log in at http://localhost:5177/login');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

fixAdmin();
