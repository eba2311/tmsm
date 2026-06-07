/**
 * mock-data.js — inject quick demo data into the local PostgreSQL database.
 *
 * Uses Sequelize (same ORM as the server) so no Supabase client is required.
 * Usage: node scripts/mock-data.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');
const Route = require('../src/models/Route');
const Driver = require('../src/models/Driver');
const Vehicle = require('../src/models/Vehicle');
const Notification = require('../src/models/Notification');

// Load associations so FK constraints are understood by Sequelize
require('../src/models');

async function injectData() {
  console.log('==========================================');
  console.log('🚀 INJECTING MOCK DATA TO LOCAL DATABASE...');
  console.log('==========================================');

  await sequelize.authenticate();

  console.log('⏳ Hashing passwords...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const suffix = Date.now();

  // ── Admin ─────────────────────────────────────────────────────────────────
  console.log('⏳ Adding System Admin...');
  let admin;
  try {
    [admin] = await User.findOrCreate({
      where: { email: 'admin@tmsm.local' },
      defaults: {
        name: 'System Admin',
        phone: '0900000000',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      },
    });
  } catch (err) {
    console.error('❌ Failed to add admin:', err.message);
  }

  // ── Passengers ────────────────────────────────────────────────────────────
  console.log('⏳ Adding Passengers...');
  const passengersToCreate = [
    { name: 'Kalkidan Bekele', email: `kalkidan_${suffix}@tmsm.local`, phone: `094${suffix.toString().slice(-7)}` },
    { name: 'Yohannes Alemu', email: `yohannes_${suffix}@tmsm.local`, phone: `095${suffix.toString().slice(-7)}` },
  ];
  for (const p of passengersToCreate) {
    try {
      await User.create({ ...p, password: hashedPassword, role: 'PASSENGER' });
    } catch (err) {
      console.error('❌ Failed to add passenger:', err.message);
    }
  }

  // ── Route ─────────────────────────────────────────────────────────────────
  console.log('⏳ Adding Routes...');
  let route;
  try {
    route = await Route.create({
      name: `Arba Minch - Addis Ababa (${suffix})`,
      code: `AM-AA-${suffix}`,
      origin: { name: 'Arba Minch', coordinates: { type: 'Point', coordinates: [37.5543, 6.0333] } },
      destination: { name: 'Addis Ababa', coordinates: { type: 'Point', coordinates: [38.7525, 9.0301] } },
      stops: [],
      distance: 500,
      estimatedDuration: 480,
      baseFare: 850,
      status: 'ACTIVE',
      operatorId: admin ? admin.id : null,
    });
  } catch (err) {
    console.error('❌ Failed to add route:', err.message);
  }

  // ── Drivers & Vehicles ────────────────────────────────────────────────────
  console.log('⏳ Adding Drivers and Vehicles...');
  const driversToCreate = [
    { name: 'Abebe Kebede', email: `abebe_${suffix}@tmsm.local`, phone: `091${suffix.toString().slice(-7)}`, lic: `LIC-1-${suffix}`, plate: `AA-1-${suffix}` },
    { name: 'Chala Gemechu', email: `chala_${suffix}@tmsm.local`, phone: `092${suffix.toString().slice(-7)}`, lic: `LIC-2-${suffix}`, plate: `AA-2-${suffix}` },
  ];

  for (const d of driversToCreate) {
    try {
      const dUser = await User.create({
        name: d.name,
        email: d.email,
        phone: d.phone,
        password: hashedPassword,
        role: 'DRIVER',
      });

      const driver = await Driver.create({
        userId: dUser.id,
        licenseNumber: d.lic,
        licenseClass: 'C',
        status: 'ACTIVE',
        assignedRouteId: route ? route.id : null,
      });

      await Vehicle.create({
        plateNumber: d.plate,
        type: 'BUS',
        make: 'Yutong',
        model: 'ZK6122H',
        year: 2022,
        capacity: 50,
        status: 'ACTIVE',
        assignedDriverId: driver.id,
        assignedRouteId: route ? route.id : null,
        operatorId: admin ? admin.id : null,
      });
    } catch (err) {
      console.error('❌ Failed to add driver/vehicle:', err.message);
    }
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  if (admin) {
    console.log('⏳ Adding Notifications...');
    try {
      await Notification.bulkCreate([
        { recipientId: admin.id, type: 'SYSTEM', title: 'System Ready', message: 'System deployment successful! All services running.', isRead: false, channel: ['IN_APP'] },
        { recipientId: admin.id, type: 'ALERT', title: 'Driver Approval', message: 'New driver registration requires approval.', isRead: false, channel: ['IN_APP'] },
      ]);
    } catch (err) {
      console.error('❌ Failed to add notifications:', err.message);
    }
  }

  console.log('==========================================');
  console.log('✅ SUCCESS! ALL MOCK DATA ADDED TO DATABASE.');
  console.log('👉 YOU CAN NOW LOG IN WITH THESE EXACT CREDENTIALS:');
  console.log('   Email: admin@tmsm.local');
  console.log('   Password: password123');
  console.log('==========================================');

  await sequelize.close();
}

injectData().catch((err) => {
  console.error('❌ Mock data injection failed:', err);
  process.exit(1);
});
