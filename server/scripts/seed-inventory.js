require('dotenv').config();
const { testConnection, syncDatabase } = require('../src/config/database');
const Inventory = require('../src/models/Inventory');
const Route = require('../src/models/Route');

async function seedInventory() {
  try {
    await testConnection();
    await syncDatabase(false);

    const routes = await Route.findAll({ order: [['created_at', 'ASC']] });
    if (!routes || routes.length < 2) {
      console.log('Not enough routes found. Please create at least 2 routes first.');
      process.exit(1);
    }

    const items = [
      {
        type: 'PHYSICAL_TICKET',
        quantity: 1500,
        price: 850.00,
        routeId: routes[0].id,
        description: 'Batch 2024-A: Arba Minch to Addis Ababa. High-security thermal paper.',
        status: 'AVAILABLE',
      },
      {
        type: 'DIGITAL_TICKET',
        quantity: 5000,
        price: 850.00,
        routeId: routes[0].id,
        description: 'Electronic booking vouchers for the morning express service.',
        status: 'AVAILABLE',
      },
      {
        type: 'MONTHLY_PASS',
        quantity: 100,
        price: 12000.00,
        routeId: routes[1].id,
        description: 'Student Monthly Pass: Arba Minch to Hawassa. valid for 30 days.',
        status: 'AVAILABLE',
      },
      {
        type: 'PHYSICAL_TICKET',
        quantity: 50,
        price: 450.00,
        routeId: routes[1].id,
        description: 'Batch 2024-B: Local service tickets. Low stock alert.',
        status: 'RESERVED',
      },
    ];

    await Inventory.destroy({ where: {} });
    await Inventory.bulkCreate(items);

    console.log('Inventory seeded successfully (PostgreSQL)!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding inventory:', err);
    process.exit(1);
  }
}

seedInventory();
