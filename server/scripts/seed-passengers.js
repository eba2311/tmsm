const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');

async function seedPassengers() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Sample passengers with complete data
    const passengers = [
      {
        name: 'Eba bayana',
        email: 'eba@gmail.com',
        phone: '+251992408063',
        address: 'Arba Minch, Ethiopia',
        dateOfBirth: '1990-05-15',
        gender: 'MALE',
        emergencyContact: 'Meron Tadesse',
        emergencyPhone: '+251911223344',
        locale: 'en',
        role: 'PASSENGER',
        password: 'DefaultPass@123',
        isActive: true,
        status: 'ACTIVE',
        totalTrips: 15
      },
      {
        name: 'Eba Bayana',
        email: 'eba.duplicate@gmail.com',
        phone: '+251992408063',
        address: 'Hawassa, Ethiopia', 
        dateOfBirth: '1988-03-22',
        gender: 'FEMALE',
        emergencyContact: 'Daniel Kebede',
        emergencyPhone: '+251922334455',
        locale: 'en',
        role: 'PASSENGER',
        password: 'DefaultPass@123',
        isActive: true,
        status: 'ACTIVE',
        totalTrips: 8
      },
      {
        name: 'Admin User',
        email: 'admin@semenconnect.com',
        phone: '+251911998877',
        address: 'Main Office, Arba Minch',
        dateOfBirth: '1985-12-10',
        gender: 'MALE',
        emergencyContact: 'System Admin',
        emergencyPhone: '+251911000000',
        locale: 'en',
        role: 'SUPER_ADMIN',
        password: 'Admin@1234',
        isActive: true,
        status: 'ACTIVE',
        totalTrips: 0
      }
    ];

    for (const passengerData of passengers) {
      const existing = await User.findOne({ where: { email: passengerData.email } });
      if (existing) {
        // Update existing user with new fields
        await existing.update({
          address: passengerData.address,
          dateOfBirth: passengerData.dateOfBirth,
          gender: passengerData.gender,
          emergencyContact: passengerData.emergencyContact,
          emergencyPhone: passengerData.emergencyPhone,
          status: passengerData.status,
          totalTrips: passengerData.totalTrips
        });
        console.log(`✅ Updated existing user: ${passengerData.name}`);
      } else {
        await User.create(passengerData);
        console.log(`✅ Created new user: ${passengerData.name}`);
      }
    }

    console.log('✅ All passengers seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding passengers:', error);
    process.exit(1);
  }
}

seedPassengers();