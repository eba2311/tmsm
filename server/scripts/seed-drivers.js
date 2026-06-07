const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');
const Driver = require('../src/models/Driver');

async function seedDrivers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sample drivers with complete data
    const driversData = [
      {
        user: {
          name: 'Admin User',
          email: 'admin@semenconnect.com',
          phone: '+251911998877',
          role: 'SUPER_ADMIN',
          password: 'Admin@1234',
          isActive: true
        },
        driver: {
          licenseNumber: 'ETH001',
          licenseClass: 'Class 3',
          licenseExpiry: '2026-12-31',
          nationalId: 'ETH123456789',
          dateOfBirth: '1985-05-15',
          address: {
            woreda: 'Worado 01',
            kebele: 'Kebele 02',
            city: 'Arba Minch',
            region: 'SNNPR'
          },
          experience: 8,
          status: 'ACTIVE',
          emergencyContact: {
            name: 'Almaz Tadesse',
            phone: '+251911223344',
            relation: 'Wife'
          },
          salary: 15000.00,
          rating: 5.0,
          totalTrips: 250,
          totalDistance: 15500.75,
          bankAccount: '1000123456789',
          bankName: 'Commercial Bank of Ethiopia',
          joiningDate: '2020-01-15'
        }
      }
    ];

    for (const driverData of driversData) {
      // Find existing user by email
      let user = await User.findOne({ where: { email: driverData.user.email } });
      
      if (user) {
        // Update user with complete information
        await user.update({
          phone: driverData.user.phone,
          role: driverData.user.role,
          isActive: driverData.user.isActive
        });
        console.log(`✅ Updated existing user: ${driverData.user.name}`);
        
        // Check if driver profile exists
        let driver = await Driver.findOne({ where: { userId: user.id } });
        
        if (driver) {
          // Update existing driver with complete data
          await driver.update({
            licenseNumber: driverData.driver.licenseNumber,
            licenseClass: driverData.driver.licenseClass,
            licenseExpiry: driverData.driver.licenseExpiry,
            nationalId: driverData.driver.nationalId,
            dateOfBirth: driverData.driver.dateOfBirth,
            address: driverData.driver.address,
            experience: driverData.driver.experience,
            status: driverData.driver.status,
            emergencyContact: driverData.driver.emergencyContact,
            salary: driverData.driver.salary,
            rating: driverData.driver.rating,
            totalTrips: driverData.driver.totalTrips,
            totalDistance: driverData.driver.totalDistance,
            bankAccount: driverData.driver.bankAccount,
            bankName: driverData.driver.bankName,
            joiningDate: driverData.driver.joiningDate
          });
          console.log(`✅ Updated existing driver profile for: ${driverData.user.name}`);
        } else {
          // Create new driver profile
          await Driver.create({
            userId: user.id,
            ...driverData.driver
          });
          console.log(`✅ Created new driver profile for: ${driverData.user.name}`);
        }
      } else {
        // Create new user
        user = await User.create(driverData.user);
        console.log(`✅ Created new user: ${driverData.user.name}`);
        
        // Create driver profile
        await Driver.create({
          userId: user.id,
          ...driverData.driver
        });
        console.log(`✅ Created new driver profile for: ${driverData.user.name}`);
      }
    }

    console.log('✅ All drivers seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding drivers:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

seedDrivers();