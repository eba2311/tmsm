/**
 * Seeds Dabub Connect (AMTMS) demo data: admin, routes, fleet, drivers, schedules.
 * Usage: MONGO_URI=mongodb://localhost:27017/amtms node scripts/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Route = require('../src/models/Route');
const Vehicle = require('../src/models/Vehicle');
const Driver = require('../src/models/Driver');
const Schedule = require('../src/models/Schedule');
const Booking = require('../src/models/Booking');
const Payment = require('../src/models/Payment');
const Notification = require('../src/models/Notification');

const point = (lng, lat) => ({ type: 'Point', coordinates: [lng, lat] });

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Clearing demo collections…');
  await Promise.all([
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Schedule.deleteMany({}),
    Notification.deleteMany({}),
    Driver.deleteMany({}),
    Vehicle.deleteMany({}),
    Route.deleteMany({}),
    User.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Semen Admin',
    email: 'admin@semenconnect.et',
    phone: '+251911000001',
    password: 'Admin@123456',
    role: 'SUPER_ADMIN',
    locale: 'en',
  });

  const agent = await User.create({
    name: 'Ticket Agent',
    email: 'agent@semenconnect.et',
    phone: '+251911000002',
    password: 'Agent@123456',
    role: 'AGENT',
  });

  const passenger = await User.create({
    name: 'Demo Passenger',
    email: 'passenger@semenconnect.et',
    phone: '+251911000003',
    password: 'Passenger@123456',
    role: 'PASSENGER',
  });

  const routes = await Route.insertMany([
    {
      name: 'Arba Minch → Addis Ababa',
      nameAm: 'አርባ ምንጭ → አዲስ አበባ',
      code: 'AM-AA',
      origin: { name: 'Arba Minch Terminal', nameAm: 'አርባ ምንጭ', coordinates: point(37.5543, 6.0333) },
      destination: { name: 'Meskel Square', nameAm: 'መስቀል አደባባይ', coordinates: point(38.7525, 9.0301) },
      stops: [
        { name: 'Wolaita Sodo', nameAm: 'ወላይታ ሶዶ', city: 'Sodo', coordinates: point(37.7641, 6.8596), distanceFromOrigin: 120, estimatedTime: 150 },
        { name: 'Hawassa', nameAm: 'ሀዋሳ', city: 'Hawassa', coordinates: point(38.4783, 7.0621), distanceFromOrigin: 275, estimatedTime: 300 },
      ],
      distance: 505,
      estimatedDuration: 480,
      baseFare: 400,
      status: 'ACTIVE',
      transportType: ['BUS'],
      isIntercity: true,
      operator: admin._id,
    },
    {
      name: 'Arba Minch → Hawassa',
      nameAm: 'አርባ ምንጭ → ሀዋሳ',
      code: 'AM-HW',
      origin: { name: 'Arba Minch Terminal', coordinates: point(37.5543, 6.0333) },
      destination: { name: 'Hawassa Terminal', coordinates: point(38.4783, 7.0621) },
      stops: [{ name: 'Wolaita Sodo', coordinates: point(37.7641, 6.8596), distanceFromOrigin: 120, estimatedTime: 150 }],
      distance: 275,
      estimatedDuration: 300,
      baseFare: 200,
      status: 'ACTIVE',
      transportType: ['BUS', 'MINIBUS'],
      isIntercity: true,
      operator: admin._id,
    },
    {
      name: 'Arba Minch → Jinka',
      nameAm: 'አርባ ምንጭ → ጂንካ',
      code: 'AM-JK',
      origin: { name: 'Arba Minch Terminal', coordinates: point(37.5543, 6.0333) },
      destination: { name: 'Jinka Bus Station', coordinates: point(36.65, 6.0667) },
      stops: [{ name: 'Konso', coordinates: point(37.4833, 5.3167), distanceFromOrigin: 87, estimatedTime: 120 }],
      distance: 245,
      estimatedDuration: 300,
      baseFare: 180,
      status: 'ACTIVE',
      transportType: ['BUS', 'MINIBUS'],
      isIntercity: true,
      operator: admin._id,
    },
    {
      name: 'Arba Minch → Konso',
      code: 'AM-KN',
      origin: { name: 'Arba Minch Terminal', coordinates: point(37.5543, 6.0333) },
      destination: { name: 'Konso', coordinates: point(37.4833, 5.3167) },
      stops: [],
      distance: 87,
      estimatedDuration: 120,
      baseFare: 80,
      status: 'ACTIVE',
      transportType: ['MINIBUS'],
      isIntercity: true,
      operator: admin._id,
    },
    {
      name: 'Arba Minch → Wolaita Sodo',
      code: 'AM-WS',
      origin: { name: 'Arba Minch Terminal', coordinates: point(37.5543, 6.0333) },
      destination: { name: 'Sodo Terminal', coordinates: point(37.7641, 6.8596) },
      stops: [],
      distance: 120,
      estimatedDuration: 150,
      baseFare: 100,
      status: 'ACTIVE',
      transportType: ['BUS', 'MINIBUS'],
      isIntercity: true,
      operator: admin._id,
    },
  ]);

  const vehicles = await Vehicle.insertMany([
    {
      plateNumber: 'AM-3-12345',
      type: 'BUS',
      make: 'Yutong',
      model: 'ZK6122',
      year: 2022,
      color: 'White',
      capacity: 45,
      status: 'ACTIVE',
      fuelType: 'DIESEL',
      mileage: 45200,
      operator: admin._id,
      assignedRoute: routes[0]._id,
      currentLocation: point(37.5543, 6.0333),
      gpsEnabled: true,
    },
    {
      plateNumber: 'AM-3-67890',
      type: 'MINIBUS',
      make: 'Toyota',
      model: 'HiAce',
      year: 2021,
      color: 'Blue',
      capacity: 14,
      status: 'ACTIVE',
      fuelType: 'DIESEL',
      mileage: 78300,
      operator: admin._id,
      assignedRoute: routes[1]._id,
      currentLocation: point(37.6, 6.1),
      gpsEnabled: true,
    },
    {
      plateNumber: 'AM-3-22222',
      type: 'BUS',
      make: 'King Long',
      model: 'XMQ6120',
      year: 2020,
      color: 'Red',
      capacity: 50,
      status: 'ACTIVE',
      fuelType: 'DIESEL',
      mileage: 102000,
      operator: admin._id,
      assignedRoute: routes[2]._id,
      currentLocation: point(37.5, 6.05),
      gpsEnabled: true,
    },
  ]);

  const driverUser1 = await User.create({
    name: 'Abebe Kebede',
    email: 'driver1@semenconnect.et',
    phone: '+251911100001',
    password: 'Driver@123456',
    role: 'DRIVER',
  });
  const driverUser2 = await User.create({
    name: 'Dawit Tesfaye',
    email: 'driver2@semenconnect.et',
    phone: '+251911100002',
    password: 'Driver@123456',
    role: 'DRIVER',
  });
  const driverUser3 = await User.create({
    name: 'Mulugeta Haile',
    email: 'driver3@semenconnect.et',
    phone: '+251911100003',
    password: 'Driver@123456',
    role: 'DRIVER',
  });

  const drivers = await Driver.insertMany([
    {
      user: driverUser1._id,
      licenseNumber: 'DL-AM-0001',
      licenseClass: 'C',
      licenseExpiry: new Date('2028-12-31'),
      status: 'ACTIVE',
      operator: admin._id,
      assignedVehicle: vehicles[0]._id,
      assignedRoute: routes[0]._id,
    },
    {
      user: driverUser2._id,
      licenseNumber: 'DL-AM-0002',
      licenseClass: 'B',
      licenseExpiry: new Date('2027-06-30'),
      status: 'ACTIVE',
      operator: admin._id,
      assignedVehicle: vehicles[1]._id,
      assignedRoute: routes[1]._id,
    },
    {
      user: driverUser3._id,
      licenseNumber: 'DL-AM-0003',
      licenseClass: 'C',
      licenseExpiry: new Date('2029-01-15'),
      status: 'ACTIVE',
      operator: admin._id,
      assignedVehicle: vehicles[2]._id,
      assignedRoute: routes[2]._id,
    },
  ]);

  await Vehicle.updateOne({ _id: vehicles[0]._id }, { assignedDriver: drivers[0]._id });
  await Vehicle.updateOne({ _id: vehicles[1]._id }, { assignedDriver: drivers[1]._id });
  await Vehicle.updateOne({ _id: vehicles[2]._id }, { assignedDriver: drivers[2]._id });

  const mkSchedule = (route, vehicle, driver, dayOffset, hour, fare, seats, status = 'SCHEDULED') => {
    const dep = new Date();
    dep.setDate(dep.getDate() + dayOffset);
    dep.setHours(hour, 0, 0, 0);
    const arr = new Date(dep.getTime() + 4 * 60 * 60 * 1000);
    return {
      route: route._id,
      vehicle: vehicle._id,
      driver: driver._id,
      departureTime: dep,
      estimatedArrival: arr,
      status,
      availableSeats: seats,
      totalSeats: seats,
      fare,
      platform: `P${Math.floor(Math.random() * 9) + 1}`,
      operator: admin._id,
    };
  };

  await Schedule.insertMany([
    mkSchedule(routes[0], vehicles[0], drivers[0], 0, 6, 400, 45, 'BOARDING'),
    mkSchedule(routes[1], vehicles[1], drivers[1], 0, 7, 200, 14, 'SCHEDULED'),
    mkSchedule(routes[2], vehicles[2], drivers[2], 0, 8, 180, 50, 'SCHEDULED'),
    mkSchedule(routes[3], vehicles[1], drivers[1], 0, 9, 80, 14, 'DEPARTED'),
    mkSchedule(routes[4], vehicles[0], drivers[0], 0, 10, 100, 45, 'SCHEDULED'),
    mkSchedule(routes[0], vehicles[0], drivers[0], 1, 14, 400, 50, 'SCHEDULED'),
  ]);

  await Notification.insertMany([
    {
      recipient: admin._id,
      type: 'SYSTEM',
      title: 'Dabub Connect ready',
      titleAm: 'ሰሜን ኮኔክት ዝግጁ ነው',
      message: 'Demo data loaded. Open Reports, Tracking, and Passenger portal.',
      messageAm: 'ሙከራ ውሂብ ተጭኗል።',
      channel: ['IN_APP'],
    },
    {
      recipient: agent._id,
      type: 'BOOKING_CONFIRMED',
      title: 'Terminal tip',
      message: 'Use Booking for counter sales; Telebirr simulates in development.',
      channel: ['IN_APP'],
    },
  ]);

  console.log('Seed complete.');
  console.log('Accounts (passwords shown for local dev only):');
  console.log('  SUPER_ADMIN  admin@semenconnect.et     / Admin@123456');
  console.log('  AGENT        agent@semenconnect.et     / Agent@123456');
  console.log('  PASSENGER    passenger@semenconnect.et / Passenger@123456');
  console.log('  DRIVER       driver1@semenconnect.et    / Driver@123456');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
