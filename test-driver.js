const supabase = require('./server/src/config/supabase');
const bcrypt = require('bcryptjs');

async function testAddDriver() {
  try {
    console.log("Testing driver creation...");
    const name = "Test Driver";
    const email = "testdriver123@example.com";
    const phone = "0911223344";
    const password = "password123";
    const licenseNumber = "TEST-LIC-" + Date.now();
    const licenseClass = "3";
    
    // 1. Check user
    let { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    console.log("User lookup:", { user, findError });

    let user_id;
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          name,
          email: email.toLowerCase(),
          phone,
          password: hashedPassword,
          role: 'DRIVER'
        }])
        .select()
        .single();
        
      if (createError) {
        console.error("Failed to create user:", createError);
        return;
      }
      user_id = newUser.id;
      console.log("Created user:", newUser.id);
    } else {
      user_id = user.id;
      console.log("Existing user:", user.id);
    }

    // 2. Create driver
    const { data: driver, error: insertError } = await supabase
      .from('drivers')
      .insert([{
        user_id: user_id,
        license_number: licenseNumber,
        license_type: licenseClass,
        license_expiry: null,
        years_of_experience: 0,
        status: 'ACTIVE'
      }])
      .select()
      .single();
      
    if (insertError) {
      console.error("Failed to create driver:", insertError);
      return;
    }
    
    console.log("Successfully created driver:", driver);

  } catch (err) {
    console.error("Exception:", err);
  }
}

testAddDriver();
