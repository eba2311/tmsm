const mongoose = require('mongoose');
const Inventory = require('../src/models/Inventory');
const Route = require('../src/models/Route');
require('dotenv').config();

async function seedInventory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const routes = await Route.find();
    if (routes.length === 0) {
      console.log('No routes found. Please seed routes first.');
      process.exit(1);
    }

    const items = [
      {
        type: 'PHYSICAL_TICKET',
        quantity: 1500,
        price: 850,
        route: routes[0]._id,
        description: 'Batch 2024-A: Arba Minch to Addis Ababa. High-security thermal paper.',
        status: 'AVAILABLE'
      },
      {
        type: 'DIGITAL_TICKET',
        quantity: 5000,
        price: 850,
        route: routes[0]._id,
        description: 'Electronic booking vouchers for the morning express service.',
        status: 'AVAILABLE'
      },
      {
        type: 'MONTHLY_PASS',
        quantity: 100,
        price: 12000,
        route: routes[1]._id,
        description: 'Student Monthly Pass: Arba Minch to Hawassa. valid for 30 days.',
        status: 'AVAILABLE'
      },
      {
        type: 'PHYSICAL_TICKET',
        quantity: 50,
        price: 450,
        route: routes[1]._id,
        description: 'Batch 2024-B: Local service tickets. Low stock alert.',
        status: 'RESERVED'
      }
    ];

    await Inventory.deleteMany({});
    await Inventory.insertMany(items);

    console.log('Inventory seeded successfully with detailed information!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding inventory:', err);
    process.exit(1);
  }
}

seedInventory();
