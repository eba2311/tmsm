/**
 * test-driver.js — quickly test driver creation against local PostgreSQL.
 * Usage: node test-driver.js
 */
require('dotenv').config({ path: require('path').join(__dirname, 'server/.env') });
const bcrypt = require('bcryptjs');
const { sequelize } = require('./server/src/config/database');
const User = require('./server/src/models/User');
const Driver = require('./server/src/models/Driver');
require('./server/src/models'); // load associations

async function testAddDriver() {
  try {
    await sequelize.authenticate();
    console.log('Testing driver creation...');

    const email = 'testdriver123@example.com';
    const licenseNumber = 'TEST-LIC-' + Date.now();

    // 1. Find or create user
    let user = await User.findOne({ where: { email } });
    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await User.create({ name: 'Test Driver', email, phone: '0911223344', password: hashedPassword, role: 'DRIVER' });
      console.log('Created user:', user.id);
    } else {
      console.log('Existing user:', user.id);
    }

    // 2. Create driver profile
    const driver = await Driver.create({
      userId: user.id,
      licenseNumber,
      licenseClass: 'C',
      status: 'ACTIVE',
    });

    console.log('✅ Successfully created driver:', driver.id);

    // 3. Cleanup
    await driver.destroy();
    await user.destroy();
    console.log('✅ Cleanup done.');
  } catch (err) {
    console.error('❌ Exception:', err.message);
  } finally {
    await sequelize.close();
  }
}

testAddDriver();
