-- ==========================================
-- SUPABASE POSTGRESQL SCHEMA
-- Migration from MongoDB (Mongoose) to Supabase
-- ==========================================

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable PostGIS for geospatial queries (locations, geofencing)
CREATE EXTENSION IF NOT EXISTS postgis;

-- --------------------------------------------------------
-- 1. ENUMS
-- --------------------------------------------------------
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'OPERATOR', 'DRIVER', 'AGENT', 'PASSENGER');
CREATE TYPE user_locale AS ENUM ('en', 'am');
CREATE TYPE vehicle_type AS ENUM ('BUS', 'MINIBUS', 'BAJAJ', 'TAXI', 'CARGO');
CREATE TYPE vehicle_status AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED');
CREATE TYPE fuel_type AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID');
CREATE TYPE schedule_status AS ENUM ('SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED', 'DELAYED');
CREATE TYPE optimization_status AS ENUM ('PENDING', 'OPTIMIZING', 'COMPLETED', 'FAILED');
CREATE TYPE location_status AS ENUM ('ACTIVE', 'IDLE', 'OFFLINE', 'MAINTENANCE');

-- --------------------------------------------------------
-- 2. TABLES
-- --------------------------------------------------------

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'PASSENGER',
    is_active BOOLEAN DEFAULT TRUE,
    is_mfa_enabled BOOLEAN DEFAULT FALSE,
    avatar TEXT DEFAULT '',
    locale user_locale DEFAULT 'en',
    refresh_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers Table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_type VARCHAR(50),
    license_expiry TIMESTAMP WITH TIME ZONE,
    years_of_experience INTEGER DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes Table
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    start_location_name VARCHAR(255),
    end_location_name VARCHAR(255),
    start_coordinates geometry(Point, 4326),
    end_coordinates geometry(Point, 4326),
    distance NUMERIC(10, 2), -- in km
    estimated_duration INTEGER, -- in minutes
    base_fare NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles Table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    type vehicle_type NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(50),
    capacity INTEGER NOT NULL,
    status vehicle_status DEFAULT 'ACTIVE',
    fuel_type fuel_type DEFAULT 'DIESEL',
    assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    assigned_route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    insurance_expiry TIMESTAMP WITH TIME ZONE,
    license_expiry TIMESTAMP WITH TIME ZONE,
    last_maintenance_date TIMESTAMP WITH TIME ZONE,
    next_maintenance_date TIMESTAMP WITH TIME ZONE,
    mileage NUMERIC(10, 2) DEFAULT 0,
    gps_enabled BOOLEAN DEFAULT FALSE,
    current_location geometry(Point, 4326) DEFAULT ST_SetSRID(ST_MakePoint(37.5543, 6.0333), 4326),
    image TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle Location History
CREATE TABLE vehicle_location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    location geometry(Point, 4326) NOT NULL,
    speed NUMERIC(10, 2) DEFAULT 0,
    heading NUMERIC(10, 2) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    altitude NUMERIC(10, 2) DEFAULT 0,
    accuracy NUMERIC(10, 2) DEFAULT 0,
    battery_level INTEGER DEFAULT 100,
    status location_status DEFAULT 'ACTIVE'
);
CREATE INDEX idx_vehicle_location_timestamp ON vehicle_location_history(vehicle_id, timestamp DESC);

-- Schedules Table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE RESTRICT NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_arrival TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_departure TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    status schedule_status DEFAULT 'SCHEDULED',
    available_seats INTEGER NOT NULL,
    total_seats INTEGER NOT NULL,
    fare NUMERIC(10, 2) NOT NULL,
    platform VARCHAR(100),
    is_recurring BOOLEAN DEFAULT FALSE,
    notes TEXT,
    operator_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES users(id) ON DELETE SET NULL,
    seat_number VARCHAR(10),
    amount_paid NUMERIC(10, 2),
    status VARCHAR(50) DEFAULT 'CONFIRMED',
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Route Optimization Table
CREATE TABLE route_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    status optimization_status DEFAULT 'PENDING',
    optimization_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    optimized_by UUID REFERENCES users(id),
    notes TEXT,
    -- JSONB columns for nested data that varies
    original_stops JSONB,
    optimized_stops JSONB,
    optimization_metrics JSONB,
    constraints JSONB,
    optimization_method VARCHAR(50) DEFAULT 'NEAREST_NEIGHBOR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Logs
CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    description TEXT,
    cost NUMERIC(10, 2),
    date_performed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    performed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity VARCHAR(255),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --------------------------------------------------------
-- 3. TRIGGERS & INDEXES
-- --------------------------------------------------------

-- Function to automatically update 'updated_at' columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Spatial Index for fast Geolocation querying
CREATE INDEX idx_vehicles_location ON vehicles USING GIST(current_location);
CREATE INDEX idx_vehicle_history_location ON vehicle_location_history USING GIST(location);

-- --------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Examples of basic RLS policies
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Public can view active vehicles" ON vehicles FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Passengers can view their bookings" ON bookings FOR SELECT USING (auth.uid() = passenger_id);
