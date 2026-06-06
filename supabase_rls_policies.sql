-- TMSM Production RLS Policies
-- Execute this script in your Supabase SQL Editor

-- 1. Enable RLS on core tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "schedules" ENABLE ROW LEVEL SECURITY;

-- 2. Super Admins can do everything
CREATE POLICY "Super Admins have full access" ON "users"
  FOR ALL USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- 3. Passengers can only view and update their own profiles
CREATE POLICY "Passengers manage own profile" ON "users"
  FOR ALL USING (auth.uid() = id);

-- 4. Passengers can only view their own bookings
CREATE POLICY "Passengers view own bookings" ON "bookings"
  FOR SELECT USING (auth.uid() = passenger_id);

-- 5. Operators can view schedules assigned to them
CREATE POLICY "Operators view own schedules" ON "schedules"
  FOR SELECT USING (auth.uid() = operator_id);

-- 6. Public read access for active schedules
CREATE POLICY "Anyone can view active schedules" ON "schedules"
  FOR SELECT USING (status = 'SCHEDULED');
