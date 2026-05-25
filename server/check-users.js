require('dotenv').config();
const supabase = require('./src/config/supabase');

async function checkUsers() {
  console.log('Checking Supabase connection...');
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error fetching users from Supabase:', error.message);
  } else {
    console.log(`✅ Supabase connection successful! Found ${data.length} users.`);
    console.log(data);
  }
}
checkUsers();
