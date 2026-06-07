const { sequelize } = require('../src/config/database');
const Driver = require('../src/models/Driver');
const User = require('../src/models/User');
const DriverDocument = require('../src/models/DriverDocument');

async function testDriverDocuments() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get existing drivers
    const drivers = await Driver.findAll({
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
      limit: 5
    });

    console.log('📋 Available drivers:');
    drivers.forEach(driver => {
      console.log(`   - ID: ${driver.id}, Name: ${driver.user?.name || 'Unknown'}, License: ${driver.licenseNumber}`);
    });

    if (drivers.length === 0) {
      console.log('⚠️  No drivers found. Please run seed-drivers.js first.');
      process.exit(1);
    }

    // Test document creation
    const testDriver = drivers[0];
    console.log(`\n🧪 Testing document creation for driver: ${testDriver.user?.name}`);

    const testDocument = {
      driverId: testDriver.id,
      documentType: 'LICENSE',
      documentNumber: 'TEST001',
      expiryDate: '2026-12-31',
      issuingAuthority: 'Test Authority',
      status: 'VERIFIED'
    };

    const created = await DriverDocument.create(testDocument);
    console.log('✅ Document created successfully:', {
      id: created.id,
      driverId: created.driverId,
      documentType: created.documentType,
      documentNumber: created.documentNumber
    });

    // Clean up test document
    await created.destroy();
    console.log('🧹 Test document cleaned up');

    console.log('\n✅ Driver document system is working correctly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing driver documents:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testDriverDocuments();