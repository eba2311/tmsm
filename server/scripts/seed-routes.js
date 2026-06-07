const { sequelize } = require('../src/config/database');
const Route = require('../src/models/Route');
const Driver = require('../src/models/Driver');

async function seedRoutes() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sample routes
    const routesData = [
      {
        name: 'Arba Minch - Hawassa',
        nameAm: 'አርባ ምንጭ - ሀዋሳ',
        code: 'AM-HW-001',
        origin: {
          name: 'Arba Minch',
          nameAm: 'አርባ ምንጭ',
          coordinates: { type: 'Point', coordinates: [37.5543, 6.0333] }
        },
        destination: {
          name: 'Hawassa',
          nameAm: 'ሀዋሳ',
          coordinates: { type: 'Point', coordinates: [38.4762, 7.0621] }
        },
        stops: [
          { name: 'Shashemene', coordinates: { type: 'Point', coordinates: [38.6007, 7.2000] } }
        ],
        distance: 275.5,
        estimatedDuration: 240, // 4 hours in minutes
        baseFare: 150.00,
        status: 'ACTIVE',
        transportType: ['BUS', 'MINIBUS'],
        isIntercity: true
      },
      {
        name: 'Arba Minch City Route',
        nameAm: 'አርባ ምንጭ ከተማ መስመር',
        code: 'AM-CITY-001',
        origin: {
          name: 'Sikela',
          nameAm: 'ሲቀላ',
          coordinates: { type: 'Point', coordinates: [37.5543, 6.0333] }
        },
        destination: {
          name: 'Shecha',
          nameAm: 'ሸጫ',
          coordinates: { type: 'Point', coordinates: [37.5700, 6.0500] }
        },
        stops: [
          { name: 'Town Center', coordinates: { type: 'Point', coordinates: [37.5600, 6.0400] } }
        ],
        distance: 8.5,
        estimatedDuration: 25, // 25 minutes
        baseFare: 15.00,
        status: 'ACTIVE',
        transportType: ['MINIBUS', 'TAXI'],
        isIntercity: false
      }
    ];

    for (const routeData of routesData) {
      const existingRoute = await Route.findOne({ where: { code: routeData.code } });
      
      if (!existingRoute) {
        const route = await Route.create(routeData);
        console.log(`✅ Created route: ${routeData.name}`);

        // Assign route to existing drivers
        const drivers = await Driver.findAll({ where: { assignedRouteId: null }, limit: 1 });
        if (drivers.length > 0) {
          await drivers[0].update({ assignedRouteId: route.id });
          console.log(`✅ Assigned route "${routeData.name}" to driver`);
        }
      } else {
        console.log(`⏭️  Route already exists: ${routeData.name}`);
      }
    }

    console.log('✅ All routes seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding routes:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

seedRoutes();