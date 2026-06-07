const { sequelize } = require('../src/config/database');
const Driver = require('../src/models/Driver');
const User = require('../src/models/User');

async function ensureDriversExist() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check existing drivers
    const drivers = await Driver.findAll({
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
    });

    console.log(`📊 Found ${drivers.length} existing drivers:`);
    drivers.forEach((driver, index) => {
      console.log(`   ${index + 1}. ${driver.user?.name || 'Unknown'} (${driver.licenseNumber}) - ID: ${driver.id}`);
    });

    if (drivers.length === 0) {
      console.log('⚠️  No drivers found. Creating a sample driver...');
      
      // Create a test user first
      const testUser = await User.create({
        name: 'Test Driver',
        email: 'test.driver@tmsm.local',
        phone: '+251911123456',
        role: 'DRIVER',
        password: 'TestPass@123',
        isActive: true
      });

      // Create driver profile
      const testDriver = await Driver.create({
        userId: testUser.id,
        licenseNumber: 'TEST001',
        licenseClass: 'Class 3',
        experience: 5,
        salary: 10000,
        status: 'ACTIVE'
      });

      console.log('✅ Created test driver:', {
        id: testDriver.id,
        name: testUser.name,
        license: testDriver.licenseNumber
      });
    }

    console.log('\n✅ Driver system ready for document uploads!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ensuring drivers exist:', error);
    process.exit(1);
  }
}

ensureDriversExist();