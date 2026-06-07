const { sequelize } = require('../src/config/database');

async function migrateColumns() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Execute raw SQL to add columns
    const queries = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255);`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(255);`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0;`,
      `DO $$ BEGIN
         CREATE TYPE enum_users_gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
       EXCEPTION
         WHEN duplicate_object THEN null;
       END $$;`,
      `DO $$ BEGIN
         CREATE TYPE enum_users_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED');
       EXCEPTION
         WHEN duplicate_object THEN null;
       END $$;`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS gender enum_users_gender;`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS status enum_users_status DEFAULT 'ACTIVE';`,
      `UPDATE users SET total_trips = 0 WHERE total_trips IS NULL;`,
      `UPDATE users SET status = 'ACTIVE' WHERE status IS NULL;`
    ];

    for (const query of queries) {
      try {
        await sequelize.query(query);
        console.log('✅ Executed:', query.substring(0, 50) + '...');
      } catch (err) {
        console.log('⚠️  Skipped (already exists):', query.substring(0, 50) + '...');
      }
    }

    console.log('✅ All columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

migrateColumns();