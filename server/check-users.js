require('dotenv').config();
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');

async function checkUsers() {
  try {
    console.log('Checking PostgreSQL connection...');
    await sequelize.authenticate();
    const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role'] });
    console.log(`✅ PostgreSQL connection successful! Found ${users.length} users.`);
    console.log(users.map(u => u.toJSON()));
  } catch (err) {
    console.error('❌ Error fetching users:', err.message);
  } finally {
    await sequelize.close();
  }
}

checkUsers();
