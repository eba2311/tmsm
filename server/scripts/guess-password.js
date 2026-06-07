const { Sequelize } = require('sequelize');

const passwords = [
  'postgres',
  'root',
  'admin',
  'password',
  'secretpassword',
  '1234',
  '12345',
  '123456',
  '12345678',
  'password123',
  ''
];

async function guessPassword() {
  console.log('Testing common PostgreSQL passwords...');
  for (const pwd of passwords) {
    const url = `postgresql://postgres:${pwd}@localhost:5432/tmsm`;
    const sequelize = new Sequelize(url, { logging: false });
    try {
      await sequelize.authenticate();
      console.log(`\n✅ SUCCESS! The password is: "${pwd}"`);
      process.exit(0);
    } catch (err) {
      process.stdout.write('.');
    }
  }
  
  console.log('\n❌ Could not find the correct password.');
}

guessPassword();
