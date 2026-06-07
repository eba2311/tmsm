-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0;

-- Create ENUM types if they don't exist
DO $$ BEGIN
    CREATE TYPE enum_users_gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_users_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add ENUM columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender enum_users_gender;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status enum_users_status DEFAULT 'ACTIVE';

-- Update existing records with default values
UPDATE users SET total_trips = 0 WHERE total_trips IS NULL;
UPDATE users SET status = 'ACTIVE' WHERE status IS NULL;