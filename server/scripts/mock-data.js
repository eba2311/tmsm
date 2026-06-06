const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Missing Supabase URL or Service Key in server/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function injectData() {
  console.log("==========================================");
  console.log("🚀 INJECTING MOCK DATA TO LIVE DATABASE...");
  console.log("==========================================");

  console.log("⏳ Hashing passwords...");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  const suffix = Date.now();
  
  // Cleanup old fixed admin to avoid unique constraint errors
  await supabase.from('users').delete().eq('email', 'admin@tmsm.local');
  
  console.log("⏳ Adding System Admin...");
  const { data: admin, error: adminErr } = await supabase.from('users').insert([{
    name: 'System Admin', email: 'admin@tmsm.local', phone: '0900000000', password: hashedPassword, role: 'SUPER_ADMIN'
  }]).select().single();

  if (adminErr) console.error("❌ Failed to add admin:", adminErr.message);

  console.log("⏳ Adding Passengers...");
  const passengersToCreate = [
    { name: 'Kalkidan Bekele', email: `kalkidan_${suffix}@tmsm.local`, phone: `094${suffix.toString().slice(-7)}` },
    { name: 'Yohannes Alemu', email: `yohannes_${suffix}@tmsm.local`, phone: `095${suffix.toString().slice(-7)}` }
  ];
  for (const p of passengersToCreate) {
    const { error: pErr } = await supabase.from('users').insert([{
      name: p.name, email: p.email, phone: p.phone, password: hashedPassword, role: 'PASSENGER'
    }]);
    if (pErr) console.error("❌ Failed to add passenger:", pErr.message);
  }

  console.log("⏳ Adding Routes...");
  const { data: route, error: routeErr } = await supabase.from('routes').insert([{
    name: `Arba Minch - Addis Ababa (${suffix})`, start_location_name: 'Arba Minch', end_location_name: 'Addis Ababa', distance: 500, estimated_duration: 480, base_fare: 850
  }]).select().single();
  if (routeErr) console.error("❌ Failed to add route:", routeErr.message);

  console.log("⏳ Adding Drivers and Vehicles...");
  const driversToCreate = [
    { name: 'Abebe Kebede', email: `abebe_${suffix}@tmsm.local`, phone: `091${suffix.toString().slice(-7)}`, lic: `LIC-1-${suffix}`, plate: `AA-1-${suffix}` },
    { name: 'Chala Gemechu', email: `chala_${suffix}@tmsm.local`, phone: `092${suffix.toString().slice(-7)}`, lic: `LIC-2-${suffix}`, plate: `AA-2-${suffix}` }
  ];
  
  for (const d of driversToCreate) {
    const { data: dUser, error: dErr } = await supabase.from('users').insert([{
      name: d.name, email: d.email, phone: d.phone, password: hashedPassword, role: 'DRIVER'
    }]).select().single();
    
    if (dErr) {
      console.error("❌ Failed to add driver user:", dErr.message);
      continue;
    }
    
    if (dUser) {
      const { data: driver, error: drErr } = await supabase.from('drivers').insert([{
        user_id: dUser.id, license_number: d.lic, license_type: '3', years_of_experience: 5, status: 'ACTIVE'
      }]).select().single();
      
      if (drErr) console.error("❌ Failed to add driver profile:", drErr.message);

      if (driver) {
        const { error: vErr } = await supabase.from('vehicles').insert([{
          plate_number: d.plate, type: 'BUS', make: 'Yutong', model: 'ZK6122H', year: 2022, capacity: 50, status: 'ACTIVE', assigned_driver_id: driver.id, assigned_route_id: route ? route.id : null
        }]);
        if (vErr) console.error("❌ Failed to add vehicle:", vErr.message);
      }
    }
  }

  if (admin) {
    console.log("⏳ Adding Notifications...");
    const { error: nErr } = await supabase.from('notifications').insert([
      { user_id: admin.id, type: 'SYSTEM', message: 'System deployment successful! All services running.', is_read: false },
      { user_id: admin.id, type: 'ALERT', message: 'New driver registration requires approval.', is_read: false }
    ]);
    if (nErr) console.error("❌ Failed to add notifications:", nErr.message);
  }

  console.log("==========================================");
  console.log("✅ SUCCESS! ALL MOCK DATA ADDED TO LIVE DATABASE.");
  console.log("👉 YOU CAN NOW LOG IN WITH THESE EXACT CREDENTIALS:");
  console.log("   Email: admin@tmsm.local");
  console.log("   Password: password123");
  console.log("==========================================");
}

injectData().catch(console.error);
