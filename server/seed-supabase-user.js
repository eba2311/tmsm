require('dotenv').config();
const supabase = require('./src/config/supabase');
const bcrypt = require('bcryptjs');

async function seedUser() {
  console.log('Seeding dummy user...');
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const { data, error } = await supabase.from('users').insert([{
    name: 'Admin User',
    email: 'admin@semenconnect.com',
    password: hashedPassword,
    role: 'SUPER_ADMIN',
    locale: 'en'
  }]).select().single();

  if (error) {
    console.error('❌ Failed to create user:', error.message);
  } else {
    console.log('✅ Successfully created user! You can now log in with:');
    console.log('Email: admin@semenconnect.com');
    console.log('Password: password123');
  }
}
seedUser();
