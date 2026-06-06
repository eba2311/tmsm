-- ==========================================
-- COMPLETE SUPABASE TRANSPORT MANAGEMENT SCHEMA
-- CLEAN + SAFE + IDEMPOTENT
-- ==========================================

-- ==========================================
-- 1. RESET DATABASE (OPTIONAL)
-- Uncomment if you want a full reset
-- ==========================================

-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- ==========================================
-- 2. EXTENSIONS
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================
-- 3. ENUMS
-- ==========================================

DO $$ BEGIN
    CREATE TYPE enum_users_role AS ENUM (
        'SUPER_ADMIN',
        'OPERATOR',
        'DRIVER',
        'AGENT',
        'PASSENGER'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_users_locale AS ENUM ('en', 'am');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Migration: Rename old user_role to enum_users_role if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
            ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50);
        END IF;
        DROP TYPE user_role;
    END IF;
END $$;

-- Migration: Rename old user_locale to enum_users_locale if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_locale') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
            ALTER TABLE users ALTER COLUMN locale TYPE VARCHAR(10);
        END IF;
        DROP TYPE user_locale;
    END IF;
END $$;

-- Migration: Drop old ENUM types and rename to match Sequelize convention
DO $$
BEGIN
    -- Drop old vehicle types
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
            ALTER TABLE vehicles ALTER COLUMN type TYPE VARCHAR(50);
        END IF;
        DROP TYPE vehicle_type;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
            ALTER TABLE vehicles ALTER COLUMN status TYPE VARCHAR(50);
        END IF;
        DROP TYPE vehicle_status;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_type') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
            ALTER TABLE vehicles ALTER COLUMN fuel_type TYPE VARCHAR(50);
        END IF;
        DROP TYPE fuel_type;
    END IF;

    -- Drop old route types
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'route_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routes') THEN
            ALTER TABLE routes ALTER COLUMN status TYPE VARCHAR(50);
        END IF;
        DROP TYPE route_status;
    END IF;

    -- Drop old schedule types
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedules') THEN
            ALTER TABLE schedules ALTER COLUMN status TYPE VARCHAR(50);
        END IF;
        DROP TYPE schedule_status;
    END IF;

    -- Drop old booking types
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
            ALTER TABLE bookings ALTER COLUMN status TYPE VARCHAR(50);
        END IF;
        DROP TYPE booking_status;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
            ALTER TABLE bookings ALTER COLUMN payment_status TYPE VARCHAR(50);
        END IF;
        DROP TYPE payment_status;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
            ALTER TABLE bookings ALTER COLUMN payment_method TYPE VARCHAR(50);
        END IF;
        DROP TYPE payment_method;
    END IF;

    -- Drop old optimization types
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'optimization_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'route_optimizations') THEN
            ALTER TABLE route_optimizations ALTER COLUMN status TYPE VARCHAR(50);
        END IF;
        DROP TYPE optimization_status;
    END IF;

    -- Drop old location status
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_location_history') THEN
            ALTER TABLE vehicle_location_history ALTER COLUMN status TYPE VARCHAR(50);
        END IF;
        DROP TYPE location_status;
    END IF;

    -- Drop old drivers types
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'drivers_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
            ALTER TABLE drivers ALTER COLUMN status TYPE VARCHAR(50);
        END IF;
        DROP TYPE drivers_status;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'drivers_license_class') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
            ALTER TABLE drivers ALTER COLUMN license_class TYPE VARCHAR(50);
        END IF;
        DROP TYPE drivers_license_class;
    END IF;

    -- Drop old payments types
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payments_method') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
            ALTER TABLE payments ALTER COLUMN method TYPE VARCHAR(50);
        END IF;
        DROP TYPE payments_method;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payments_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
            ALTER TABLE payments ALTER COLUMN status TYPE VARCHAR(50);
        END IF;
        DROP TYPE payments_status;
    END IF;

    -- Drop old fuel_records types
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_records_fuel_type') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_records') THEN
            ALTER TABLE fuel_records ALTER COLUMN fuel_type TYPE VARCHAR(50);
        END IF;
        DROP TYPE fuel_records_fuel_type;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_records_unit') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_records') THEN
            ALTER TABLE fuel_records ALTER COLUMN unit TYPE VARCHAR(50);
        END IF;
        DROP TYPE fuel_records_unit;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_records_payment_method') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_records') THEN
            ALTER TABLE fuel_records ALTER COLUMN payment_method TYPE VARCHAR(50);
        END IF;
        DROP TYPE fuel_records_payment_method;
    END IF;

    -- Drop old driver_documents types
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_documents_document_type') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_documents') THEN
            ALTER TABLE driver_documents ALTER COLUMN document_type TYPE VARCHAR(50);
        END IF;
        DROP TYPE driver_documents_document_type;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_documents_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_documents') THEN
            ALTER TABLE driver_documents ALTER COLUMN status TYPE VARCHAR(50);
        END IF;
        DROP TYPE driver_documents_status;
    END IF;

    -- Drop old driver_payrolls types
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_payrolls_period_type') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_payrolls') THEN
            ALTER TABLE driver_payrolls ALTER COLUMN period_type TYPE VARCHAR(50);
        END IF;
        DROP TYPE driver_payrolls_period_type;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_payrolls_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_payrolls') THEN
            ALTER TABLE driver_payrolls ALTER COLUMN status TYPE VARCHAR(50);
        END IF;
        DROP TYPE driver_payrolls_status;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_payrolls_payment_method') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_payrolls') THEN
            ALTER TABLE driver_payrolls ALTER COLUMN payment_method TYPE VARCHAR(50);
        END IF;
        DROP TYPE driver_payrolls_payment_method;
    END IF;

    -- Drop old geofences types
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geofences_type') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'geofences') THEN
            ALTER TABLE geofences ALTER COLUMN type TYPE VARCHAR(50);
        END IF;
        DROP TYPE geofences_type;
    END IF;

    -- Drop old payment_tracking types
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_tracking_currency') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_tracking') THEN
            ALTER TABLE payment_tracking ALTER COLUMN currency TYPE VARCHAR(50);
        END IF;
        DROP TYPE payment_tracking_currency;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_tracking_method') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_tracking') THEN
            ALTER TABLE payment_tracking ALTER COLUMN method TYPE VARCHAR(50);
        END IF;
        DROP TYPE payment_tracking_method;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_tracking_status') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_tracking') THEN
            ALTER TABLE payment_tracking ALTER COLUMN status TYPE VARCHAR(50);
        END IF;
        DROP TYPE payment_tracking_status;
    END IF;

    -- Drop old report_schedules types
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_schedules_report_type') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_schedules') THEN
            ALTER TABLE report_schedules ALTER COLUMN report_type TYPE VARCHAR(50);
        END IF;
        DROP TYPE report_schedules_report_type;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_schedules_schedule_type') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_schedules') THEN
            ALTER TABLE report_schedules ALTER COLUMN schedule_type TYPE VARCHAR(50);
        END IF;
        DROP TYPE report_schedules_schedule_type;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_schedules_format') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_schedules') THEN
            ALTER TABLE report_schedules ALTER COLUMN format TYPE VARCHAR(50);
        END IF;
        DROP TYPE report_schedules_format;
    END IF;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_vehicles_type AS ENUM (
        'BUS',
        'MINIBUS',
        'BAJAJ',
        'TAXI',
        'CARGO'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_vehicles_status AS ENUM (
        'ACTIVE',
        'INACTIVE',
        'MAINTENANCE',
        'RETIRED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_vehicles_fuel_type AS ENUM (
        'PETROL',
        'DIESEL',
        'ELECTRIC',
        'HYBRID'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_routes_status AS ENUM (
        'ACTIVE',
        'INACTIVE',
        'SEASONAL'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_schedules_status AS ENUM (
        'SCHEDULED',
        'BOARDING',
        'DEPARTED',
        'IN_TRANSIT',
        'ARRIVED',
        'CANCELLED',
        'DELAYED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_bookings_status AS ENUM (
        'PENDING',
        'CONFIRMED',
        'CANCELLED',
        'USED',
        'EXPIRED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_bookings_payment_status AS ENUM (
        'UNPAID',
        'PAID',
        'REFUNDED',
        'PARTIALLY_PAID'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_bookings_payment_method AS ENUM (
        'TELEBIRR',
        'CBE_BIRR',
        'CASH',
        'CARD',
        'BANK_TRANSFER'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_route_optimizations_status AS ENUM (
        'PENDING',
        'OPTIMIZING',
        'COMPLETED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_vehicle_location_history_status AS ENUM (
        'ACTIVE',
        'IDLE',
        'OFFLINE',
        'MAINTENANCE'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_drivers_status AS ENUM (
        'ACTIVE',
        'INACTIVE',
        'ON_LEAVE',
        'SUSPENDED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_drivers_license_class AS ENUM (
        'A',
        'B',
        'C',
        'D',
        'E',
        'F'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- 4. USERS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password VARCHAR(255) NOT NULL,

    role enum_users_role DEFAULT 'PASSENGER',

    is_active BOOLEAN DEFAULT TRUE,
    is_mfa_enabled BOOLEAN DEFAULT FALSE,

    avatar TEXT DEFAULT '',

    locale enum_users_locale DEFAULT 'en',

    refresh_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. ROUTES TABLE
-- (Must come before drivers and vehicles due to FK references)
-- ==========================================

CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(255) NOT NULL,
    name_am VARCHAR(255),

    code VARCHAR(50) UNIQUE NOT NULL,

    origin JSONB NOT NULL DEFAULT '{"name":"","nameAm":null,"coordinates":{"type":"Point","coordinates":[37.5543,6.0333]}}',
    destination JSONB NOT NULL DEFAULT '{"name":"","nameAm":null,"coordinates":{"type":"Point","coordinates":[0,0]}}',
    stops JSONB DEFAULT '[]',

    distance NUMERIC(10,2) NOT NULL,
    estimated_duration INTEGER NOT NULL,
    base_fare NUMERIC(10,2) NOT NULL,

    status enum_routes_status DEFAULT 'ACTIVE',
    transport_type TEXT[] DEFAULT ARRAY['BUS']::TEXT[],
    is_intercity BOOLEAN DEFAULT FALSE,

    operator_id UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS routes_code ON routes(code);
CREATE INDEX IF NOT EXISTS routes_status ON routes(status);

-- ==========================================
-- 6. DRIVERS TABLE
-- (assigned_vehicle_id FK added via ALTER TABLE after vehicles is created)
-- ==========================================

CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_class enum_drivers_license_class,

    license_expiry TIMESTAMP WITH TIME ZONE,

    national_id VARCHAR(100) UNIQUE,

    date_of_birth TIMESTAMP WITH TIME ZONE,

    address JSONB DEFAULT '{"woreda": null, "kebele": null, "city": "Arba Minch", "region": "SNNPR"}',

    experience INTEGER DEFAULT 0,

    status enum_drivers_status DEFAULT 'ACTIVE',

    -- NOTE: assigned_vehicle_id FK is added below via ALTER TABLE
    -- after the vehicles table is created, to avoid circular FK issue.
    assigned_vehicle_id UUID,

    assigned_route_id UUID REFERENCES routes(id) ON DELETE SET NULL,

    operator_id UUID REFERENCES users(id) ON DELETE SET NULL,

    emergency_contact JSONB DEFAULT '{"name": null, "phone": null, "relation": null}',

    salary NUMERIC(10,2) DEFAULT 0,

    rating NUMERIC(2,1) DEFAULT 5,

    total_trips INTEGER DEFAULT 0,

    total_distance NUMERIC(10,2) DEFAULT 0,

    bank_account VARCHAR(255),

    bank_name VARCHAR(255),

    photo TEXT DEFAULT '',

    joining_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. VEHICLES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    plate_number VARCHAR(50) UNIQUE NOT NULL,

    type enum_vehicles_type NOT NULL,

    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,

    year INTEGER NOT NULL,

    color VARCHAR(50),

    capacity INTEGER NOT NULL,

    status enum_vehicles_status DEFAULT 'ACTIVE',

    fuel_type enum_vehicles_fuel_type DEFAULT 'DIESEL',

    assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

    assigned_route_id UUID REFERENCES routes(id) ON DELETE SET NULL,

    operator_id UUID REFERENCES users(id) ON DELETE RESTRICT,

    insurance_expiry TIMESTAMP WITH TIME ZONE,

    license_expiry TIMESTAMP WITH TIME ZONE,

    last_maintenance_date TIMESTAMP WITH TIME ZONE,

    next_maintenance_date TIMESTAMP WITH TIME ZONE,

    mileage INTEGER DEFAULT 0,

    gps_enabled BOOLEAN DEFAULT FALSE,

    current_location JSONB DEFAULT '{"type":"Point","coordinates":[37.5543,6.0333]}',

    documents JSONB DEFAULT '[]',

    image TEXT DEFAULT '',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_plate_number ON vehicles(plate_number);
CREATE INDEX IF NOT EXISTS vehicles_status_type ON vehicles(status, type);

-- ==========================================
-- 7b. ADD CROSS-REFERENCE FK: drivers.assigned_vehicle_id -> vehicles
-- (Must run AFTER both drivers and vehicles tables exist)
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'drivers_assigned_vehicle_id_fkey'
          AND table_name = 'drivers'
    ) THEN
        ALTER TABLE drivers
            ADD CONSTRAINT drivers_assigned_vehicle_id_fkey
            FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ==========================================
-- 8. VEHICLE LOCATION HISTORY
-- ==========================================

CREATE TABLE IF NOT EXISTS vehicle_location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,

    location JSONB NOT NULL DEFAULT '{"type": "Point", "coordinates": [0, 0]}',

    speed NUMERIC(10,2) DEFAULT 0,

    heading NUMERIC(10,2) DEFAULT 0,

    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    altitude NUMERIC(10,2) DEFAULT 0,

    accuracy NUMERIC(10,2) DEFAULT 0,

    battery_level INTEGER DEFAULT 100,

    status enum_vehicle_location_history_status DEFAULT 'ACTIVE'
);

-- ==========================================
-- 9. SCHEDULES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,

    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,

    driver_id UUID REFERENCES drivers(id) ON DELETE RESTRICT NOT NULL,

    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,

    estimated_arrival TIMESTAMP WITH TIME ZONE NOT NULL,

    actual_departure TIMESTAMP WITH TIME ZONE,

    actual_arrival TIMESTAMP WITH TIME ZONE,

    status enum_schedules_status DEFAULT 'SCHEDULED',

    available_seats INTEGER NOT NULL,

    total_seats INTEGER NOT NULL,

    fare NUMERIC(10,2) NOT NULL,

    platform VARCHAR(100),

    is_recurring BOOLEAN DEFAULT FALSE,

    recurring_days TEXT[],

    notes TEXT,

    operator_id UUID REFERENCES users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS schedules_route_departure ON schedules(route_id, departure_time);
CREATE INDEX IF NOT EXISTS schedules_vehicle_departure ON schedules(vehicle_id, departure_time);
CREATE INDEX IF NOT EXISTS schedules_status ON schedules(status);
CREATE INDEX IF NOT EXISTS schedules_departure_time ON schedules(departure_time);

-- ==========================================
-- 10. BOOKINGS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    booking_ref VARCHAR(50) UNIQUE NOT NULL,

    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE NOT NULL,

    passenger_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,

    agent_id UUID REFERENCES users(id) ON DELETE SET NULL,

    passengers JSONB DEFAULT '[]',

    total_amount NUMERIC(10,2) NOT NULL,

    currency VARCHAR(10) DEFAULT 'ETB',

    status enum_bookings_status DEFAULT 'PENDING',

    payment_status enum_bookings_payment_status DEFAULT 'UNPAID',

    payment_method enum_bookings_payment_method,

    qr_code TEXT,

    qr_code_data TEXT,

    boarding_point VARCHAR(255),

    dropping_point VARCHAR(255),

    checked_in BOOLEAN DEFAULT FALSE,

    checked_in_at TIMESTAMP WITH TIME ZONE,

    cancellation_reason TEXT,

    refund_amount NUMERIC(10,2) DEFAULT 0,

    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_booking_ref ON bookings(booking_ref);
CREATE INDEX IF NOT EXISTS bookings_passenger_created ON bookings(passenger_id, created_at);
CREATE INDEX IF NOT EXISTS bookings_schedule ON bookings(schedule_id);
CREATE INDEX IF NOT EXISTS bookings_status_payment ON bookings(status, payment_status);

-- ==========================================
-- 11. ROUTE OPTIMIZATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS route_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,

    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,

    status enum_route_optimizations_status DEFAULT 'PENDING',

    optimization_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    optimized_by_id UUID REFERENCES users(id),

    notes TEXT,

    original_stops JSONB,
    optimized_stops JSONB,
    optimization_metrics JSONB,
    constraints JSONB,

    optimization_method VARCHAR(50) DEFAULT 'NEAREST_NEIGHBOR',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 12. MAINTENANCE LOGS
-- ==========================================

DO $$ BEGIN
    CREATE TYPE maintenance_log_type AS ENUM (
        'ROUTINE',
        'REPAIR',
        'INSPECTION',
        'EMERGENCY',
        'UPGRADE'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE maintenance_log_status AS ENUM (
        'SCHEDULED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE maintenance_log_priority AS ENUM (
        'LOW',
        'MEDIUM',
        'HIGH',
        'URGENT'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE maintenance_log_recurring_interval AS ENUM (
        'DAILY',
        'WEEKLY',
        'MONTHLY',
        'QUARTERLY',
        'YEARLY',
        'MILEAGE_BASED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,

    type maintenance_log_type NOT NULL,

    description TEXT NOT NULL,

    cost NUMERIC(10,2) DEFAULT 0,

    mileage_at_service NUMERIC(10,2),

    serviced_by VARCHAR(255),

    garage VARCHAR(255),

    start_date TIMESTAMP WITH TIME ZONE NOT NULL,

    end_date TIMESTAMP WITH TIME ZONE,

    status maintenance_log_status DEFAULT 'SCHEDULED',

    priority maintenance_log_priority DEFAULT 'MEDIUM',

    parts_replaced JSONB DEFAULT '[]',

    next_service_mileage NUMERIC(10,2),

    next_service_date TIMESTAMP WITH TIME ZONE,

    attachments TEXT[] DEFAULT ARRAY[]::TEXT[],

    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    notes TEXT,

    is_recurring BOOLEAN DEFAULT FALSE,

    recurring_interval maintenance_log_recurring_interval,

    recurring_interval_value INTEGER,

    reminder_days INTEGER DEFAULT 7,

    reminder_sent BOOLEAN DEFAULT FALSE,

    reminder_date TIMESTAMP WITH TIME ZONE,

    assigned_to_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

    estimated_duration INTEGER,

    actual_duration INTEGER,

    completed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    completed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS maintenance_logs_vehicle_id_start_date ON maintenance_logs(vehicle_id, start_date);
CREATE INDEX IF NOT EXISTS maintenance_logs_status ON maintenance_logs(status);
CREATE INDEX IF NOT EXISTS maintenance_logs_next_service_date ON maintenance_logs(next_service_date);
CREATE INDEX IF NOT EXISTS maintenance_logs_priority ON maintenance_logs(priority);

-- Migration: Add missing columns to existing maintenance_logs table
DO $$
BEGIN
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'type') THEN
        ALTER TABLE maintenance_logs ADD COLUMN type maintenance_log_type NOT NULL DEFAULT 'ROUTINE';
    END IF;

    -- Add start_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'start_date') THEN
        ALTER TABLE maintenance_logs ADD COLUMN start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
    END IF;

    -- Add end_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'end_date') THEN
        ALTER TABLE maintenance_logs ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'status') THEN
        ALTER TABLE maintenance_logs ADD COLUMN status maintenance_log_status DEFAULT 'SCHEDULED';
    END IF;

    -- Add priority column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'priority') THEN
        ALTER TABLE maintenance_logs ADD COLUMN priority maintenance_log_priority DEFAULT 'MEDIUM';
    END IF;

    -- Add mileage_at_service column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'mileage_at_service') THEN
        ALTER TABLE maintenance_logs ADD COLUMN mileage_at_service NUMERIC(10,2);
    END IF;

    -- Add serviced_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'serviced_by') THEN
        ALTER TABLE maintenance_logs ADD COLUMN serviced_by VARCHAR(255);
    END IF;

    -- Add garage column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'garage') THEN
        ALTER TABLE maintenance_logs ADD COLUMN garage VARCHAR(255);
    END IF;

    -- Add parts_replaced column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'parts_replaced') THEN
        ALTER TABLE maintenance_logs ADD COLUMN parts_replaced JSONB DEFAULT '[]';
    END IF;

    -- Add next_service_mileage column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'next_service_mileage') THEN
        ALTER TABLE maintenance_logs ADD COLUMN next_service_mileage NUMERIC(10,2);
    END IF;

    -- Add next_service_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'next_service_date') THEN
        ALTER TABLE maintenance_logs ADD COLUMN next_service_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add attachments column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'attachments') THEN
        ALTER TABLE maintenance_logs ADD COLUMN attachments TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;

    -- Add created_by_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'created_by_id') THEN
        ALTER TABLE maintenance_logs ADD COLUMN created_by_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'notes') THEN
        ALTER TABLE maintenance_logs ADD COLUMN notes TEXT;
    END IF;

    -- Add is_recurring column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'is_recurring') THEN
        ALTER TABLE maintenance_logs ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add recurring_interval column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'recurring_interval') THEN
        ALTER TABLE maintenance_logs ADD COLUMN recurring_interval maintenance_log_recurring_interval;
    END IF;

    -- Add recurring_interval_value column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'recurring_interval_value') THEN
        ALTER TABLE maintenance_logs ADD COLUMN recurring_interval_value INTEGER;
    END IF;

    -- Add reminder_days column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'reminder_days') THEN
        ALTER TABLE maintenance_logs ADD COLUMN reminder_days INTEGER DEFAULT 7;
    END IF;

    -- Add reminder_sent column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'reminder_sent') THEN
        ALTER TABLE maintenance_logs ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add reminder_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'reminder_date') THEN
        ALTER TABLE maintenance_logs ADD COLUMN reminder_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add assigned_to_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'assigned_to_id') THEN
        ALTER TABLE maintenance_logs ADD COLUMN assigned_to_id UUID REFERENCES drivers(id) ON DELETE SET NULL;
    END IF;

    -- Add estimated_duration column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'estimated_duration') THEN
        ALTER TABLE maintenance_logs ADD COLUMN estimated_duration INTEGER;
    END IF;

    -- Add actual_duration column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'actual_duration') THEN
        ALTER TABLE maintenance_logs ADD COLUMN actual_duration INTEGER;
    END IF;

    -- Add completed_by_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'completed_by_id') THEN
        ALTER TABLE maintenance_logs ADD COLUMN completed_by_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- Add completed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'completed_at') THEN
        ALTER TABLE maintenance_logs ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Drop old columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'date_performed') THEN
        ALTER TABLE maintenance_logs DROP COLUMN date_performed;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_logs' AND column_name = 'performed_by') THEN
        ALTER TABLE maintenance_logs DROP COLUMN performed_by;
    END IF;
END $$;

-- ==========================================
-- 13. AUDIT LOGS
-- ==========================================

DO $$ BEGIN
    CREATE TYPE audit_log_action AS ENUM (
        'LOGIN',
        'LOGOUT',
        'CREATE',
        'UPDATE',
        'DELETE',
        'VIEW',
        'EXPORT',
        'IMPORT',
        'APPROVE',
        'REJECT',
        'BOOKING',
        'PAYMENT',
        'CANCEL',
        'REFUND'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_log_resource AS ENUM (
        'USER',
        'VEHICLE',
        'DRIVER',
        'ROUTE',
        'SCHEDULE',
        'BOOKING',
        'PAYMENT',
        'MAINTENANCE',
        'REPORT',
        'NOTIFICATION',
        'SETTING'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    action audit_log_action NOT NULL,

    resource audit_log_resource NOT NULL,

    resource_id UUID,

    details JSONB DEFAULT '{}',

    ip_address VARCHAR(45),

    user_agent VARCHAR(500),

    success BOOLEAN DEFAULT TRUE,

    error_message TEXT,

    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_timestamp ON audit_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS audit_logs_action_timestamp ON audit_logs(action, timestamp);
CREATE INDEX IF NOT EXISTS audit_logs_resource_timestamp ON audit_logs(resource, timestamp);
CREATE INDEX IF NOT EXISTS audit_logs_timestamp ON audit_logs(timestamp);

-- Migration: Add missing columns to existing audit_logs table
DO $$
BEGIN
    -- Rename entity to resource if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entity') THEN
        ALTER TABLE audit_logs RENAME COLUMN entity TO resource;
    END IF;

    -- Rename entity_id to resource_id if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entity_id') THEN
        ALTER TABLE audit_logs RENAME COLUMN entity_id TO resource_id;
    END IF;

    -- Add action column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'action') THEN
        ALTER TABLE audit_logs ADD COLUMN action audit_log_action NOT NULL DEFAULT 'VIEW';
    END IF;

    -- Add resource column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'resource') THEN
        ALTER TABLE audit_logs ADD COLUMN resource audit_log_resource NOT NULL DEFAULT 'SETTING';
    END IF;

    -- Add user_agent column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_agent') THEN
        ALTER TABLE audit_logs ADD COLUMN user_agent VARCHAR(500);
    END IF;

    -- Add success column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'success') THEN
        ALTER TABLE audit_logs ADD COLUMN success BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add error_message column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'error_message') THEN
        ALTER TABLE audit_logs ADD COLUMN error_message TEXT;
    END IF;

    -- Add timestamp column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'timestamp') THEN
        ALTER TABLE audit_logs ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ==========================================
-- 14. NOTIFICATIONS TABLE
-- ==========================================

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'BOOKING_CONFIRMED',
        'BOOKING_CANCELLED',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'SCHEDULE_DELAY',
        'SCHEDULE_CANCELLED',
        'VEHICLE_MAINTENANCE',
        'DRIVER_ALERT',
        'SYSTEM',
        'PROMOTION'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM (
        'IN_APP',
        'SMS',
        'EMAIL',
        'PUSH'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    type notification_type NOT NULL,

    title VARCHAR(255) NOT NULL,

    title_am VARCHAR(255),

    message TEXT NOT NULL,

    message_am TEXT,

    is_read BOOLEAN DEFAULT FALSE,

    read_at TIMESTAMP WITH TIME ZONE,

    data JSONB,

    channel notification_channel[] DEFAULT ARRAY['IN_APP']::notification_channel[],

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_id_is_read_created_at ON notifications(recipient_id, is_read, created_at);

-- Migration: Rename user_id to recipient_id and add missing columns
DO $$
BEGIN
    -- Rename user_id to recipient_id if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        ALTER TABLE notifications RENAME COLUMN user_id TO recipient_id;
    END IF;

    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE notifications ADD COLUMN type notification_type NOT NULL DEFAULT 'SYSTEM';
    END IF;

    -- Add title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'title') THEN
        ALTER TABLE notifications ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT '';
    END IF;

    -- Add title_am column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'title_am') THEN
        ALTER TABLE notifications ADD COLUMN title_am VARCHAR(255);
    END IF;

    -- Add message_am column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'message_am') THEN
        ALTER TABLE notifications ADD COLUMN message_am TEXT;
    END IF;

    -- Add read_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_at') THEN
        ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'data') THEN
        ALTER TABLE notifications ADD COLUMN data JSONB;
    END IF;

    -- Add channel column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'channel') THEN
        ALTER TABLE notifications ADD COLUMN channel notification_channel[] DEFAULT ARRAY['IN_APP']::notification_channel[];
    END IF;
END $$;

-- ==========================================
-- 15. PAYMENTS TABLE
-- ==========================================

DO $$ BEGIN
    CREATE TYPE enum_payments_method AS ENUM (
        'TELEBIRR',
        'CBE_BIRR',
        'CASH',
        'CARD',
        'BANK_TRANSFER'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_payments_status AS ENUM (
        'PENDING',
        'SUCCESS',
        'FAILED',
        'REFUNDED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,

    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    amount NUMERIC(10,2) NOT NULL,

    currency VARCHAR(10) DEFAULT 'ETB',

    method enum_payments_method NOT NULL,

    status enum_payments_status DEFAULT 'PENDING',

    transaction_id VARCHAR(255) UNIQUE,

    gateway_reference VARCHAR(255),

    gateway_response JSONB,

    refund_reason TEXT,

    refunded_at TIMESTAMP WITH TIME ZONE,

    paid_at TIMESTAMP WITH TIME ZONE,

    receipt_url TEXT,

    processed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 16. FUEL RECORDS TABLE
-- ==========================================

DO $$ BEGIN
    CREATE TYPE enum_fuel_records_fuel_type AS ENUM (
        'DIESEL',
        'PETROL',
        'CNG',
        'LPG',
        'ELECTRIC'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_fuel_records_unit AS ENUM (
        'LITERS',
        'GALLONS',
        'KWH'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_fuel_records_payment_method AS ENUM (
        'CASH',
        'CARD',
        'CREDIT',
        'COMPANY_ACCOUNT'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS fuel_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,

    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    fuel_type enum_fuel_records_fuel_type NOT NULL,

    quantity NUMERIC(10,2) NOT NULL,

    unit enum_fuel_records_unit DEFAULT 'LITERS',

    cost_per_unit NUMERIC(10,2) NOT NULL,

    total_cost NUMERIC(10,2),

    odometer_reading NUMERIC(10,2) NOT NULL,

    previous_odometer NUMERIC(10,2),

    distance_traveled NUMERIC(10,2),

    fuel_efficiency NUMERIC(10,2),

    station VARCHAR(255),

    location JSONB,

    payment_method enum_fuel_records_payment_method DEFAULT 'CASH',

    receipt_number VARCHAR(255),

    notes TEXT,

    operator_id UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 17. DRIVER DOCUMENTS TABLE
-- ==========================================

DO $$ BEGIN
    CREATE TYPE enum_driver_documents_document_type AS ENUM (
        'LICENSE',
        'PERMIT',
        'INSURANCE',
        'BACKGROUND_CHECK',
        'MEDICAL_CERTIFICATE',
        'TRAINING_CERTIFICATE',
        'CONTRACT',
        'ID_CARD',
        'CERTIFICATION',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_driver_documents_status AS ENUM (
        'PENDING',
        'VERIFIED',
        'EXPIRED',
        'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE NOT NULL,

    document_type enum_driver_documents_document_type NOT NULL,

    document_number VARCHAR(255),

    issue_date TIMESTAMP WITH TIME ZONE,

    expiry_date TIMESTAMP WITH TIME ZONE,

    issuing_authority VARCHAR(255),

    file_url TEXT,

    file_name VARCHAR(255),

    file_size INTEGER,

    mime_type VARCHAR(100),

    status enum_driver_documents_status DEFAULT 'PENDING',

    verified_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    verified_at TIMESTAMP WITH TIME ZONE,

    notes TEXT,

    reminder_sent BOOLEAN DEFAULT FALSE,

    reminder_date TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 18. DRIVER RATINGS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS driver_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE NOT NULL,

    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

    passenger_id UUID REFERENCES users(id) ON DELETE SET NULL,

    rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),

    categories JSONB DEFAULT '{"punctuality": null, "professionalism": null, "vehicle_condition": null, "driving_skill": null, "customer_service": null}',

    comment TEXT,

    is_anonymous BOOLEAN DEFAULT FALSE,

    response TEXT,

    responded_at TIMESTAMP WITH TIME ZONE,

    responded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 19. DRIVER PAYROLLS TABLE
-- ==========================================

DO $$ BEGIN
    CREATE TYPE enum_driver_payrolls_period_type AS ENUM (
        'WEEKLY',
        'BI_WEEKLY',
        'MONTHLY',
        'QUARTERLY'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_driver_payrolls_status AS ENUM (
        'PENDING',
        'PROCESSED',
        'PAID',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_driver_payrolls_payment_method AS ENUM (
        'BANK_TRANSFER',
        'CASH',
        'MOBILE_MONEY',
        'CHECK'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS driver_payrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE NOT NULL,

    period_type enum_driver_payrolls_period_type NOT NULL,

    period_start_date TIMESTAMP WITH TIME ZONE NOT NULL,

    period_end_date TIMESTAMP WITH TIME ZONE NOT NULL,

    base_salary NUMERIC(10,2) NOT NULL,

    bonuses JSONB DEFAULT '[]',

    deductions JSONB DEFAULT '[]',

    trips_completed INTEGER DEFAULT 0,

    hours_worked NUMERIC(10,2) DEFAULT 0,

    revenue_generated NUMERIC(10,2) DEFAULT 0,

    commission_rate NUMERIC(5,2),

    commission_amount NUMERIC(10,2) DEFAULT 0,

    gross_pay NUMERIC(10,2),

    net_pay NUMERIC(10,2),

    status enum_driver_payrolls_status DEFAULT 'PENDING',

    payment_method enum_driver_payrolls_payment_method,

    payment_date TIMESTAMP WITH TIME ZONE,

    transaction_reference VARCHAR(255),

    notes TEXT,

    approved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    approved_at TIMESTAMP WITH TIME ZONE,

    processed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    processed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 20. GEOFENCES TABLE
-- ==========================================

DO $$ BEGIN
    CREATE TYPE enum_geofences_type AS ENUM (
        'CIRCLE',
        'POLYGON',
        'RECTANGLE'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(255) NOT NULL,

    type enum_geofences_type NOT NULL,

    coordinates JSONB NOT NULL,

    radius NUMERIC(10,2),

    alert_on_entry BOOLEAN DEFAULT TRUE,

    alert_on_exit BOOLEAN DEFAULT TRUE,

    assigned_vehicle_ids UUID[] DEFAULT '{}',

    assigned_route_ids UUID[] DEFAULT '{}',

    is_active BOOLEAN DEFAULT TRUE,

    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 21. PAYMENT TRACKING TABLE
-- ==========================================

DO $$ BEGIN
    CREATE TYPE enum_payment_tracking_currency AS ENUM (
        'ETB',
        'USD',
        'EUR'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_payment_tracking_method AS ENUM (
        'TELEBIRR',
        'CBE_BIRR',
        'AMOLE',
        'CASH',
        'CARD',
        'BANK_TRANSFER'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_payment_tracking_status AS ENUM (
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'REFUNDED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS payment_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    transaction_id VARCHAR(255) UNIQUE NOT NULL,

    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,

    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    amount NUMERIC(10,2) NOT NULL,

    currency enum_payment_tracking_currency DEFAULT 'ETB',

    method enum_payment_tracking_method NOT NULL,

    status enum_payment_tracking_status DEFAULT 'PENDING',

    payment_gateway VARCHAR(255),

    gateway_transaction_id VARCHAR(255),

    gateway_response JSONB,

    metadata JSONB DEFAULT '{"phoneNumber": null, "cardLast4": null, "cardBrand": null, "bankName": null, "accountNumber": null, "receiptNumber": null, "notes": null}',

    timestamps_initiated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    timestamps_completed TIMESTAMP WITH TIME ZONE,

    timestamps_failed TIMESTAMP WITH TIME ZONE,

    timestamps_refunded TIMESTAMP WITH TIME ZONE,

    retry_count INTEGER DEFAULT 0,

    failure_reason TEXT,

    refund_amount NUMERIC(10,2) DEFAULT 0,

    refund_reason TEXT,

    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    updated_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 22. REPORT SCHEDULES TABLE
-- ==========================================

DO $$ BEGIN
    CREATE TYPE enum_report_schedules_report_type AS ENUM (
        'overview',
        'revenue',
        'bookings',
        'fleet',
        'routes',
        'performance',
        'financial'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_report_schedules_schedule_type AS ENUM (
        'daily',
        'weekly',
        'monthly',
        'quarterly',
        'yearly'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_report_schedules_format AS ENUM (
        'pdf',
        'excel',
        'csv'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(255) NOT NULL,

    description TEXT,

    report_type enum_report_schedules_report_type NOT NULL,

    schedule_type enum_report_schedules_schedule_type NOT NULL,

    schedule_day_of_week INTEGER CHECK (schedule_day_of_week >= 0 AND schedule_day_of_week <= 6),

    schedule_day_of_month INTEGER CHECK (schedule_day_of_month >= 1 AND schedule_day_of_month <= 31),

    schedule_time VARCHAR(10) NOT NULL,

    filters JSONB DEFAULT '{"startDate": null, "endDate": null, "routes": [], "vehicles": [], "paymentMethods": [], "statuses": []}',

    format enum_report_schedules_format DEFAULT 'pdf',

    recipients TEXT[] NOT NULL,

    created_by_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    last_run TIMESTAMP WITH TIME ZONE,

    next_run TIMESTAMP WITH TIME ZONE,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 23. INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_vehicle_location_timestamp
ON vehicle_location_history(vehicle_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_current_location
ON vehicles USING GIN(current_location);

CREATE INDEX IF NOT EXISTS idx_payments_booking
ON payments(booking_id);

CREATE INDEX IF NOT EXISTS idx_payments_user
ON payments(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_payments_status
ON payments(status);

CREATE INDEX IF NOT EXISTS idx_payments_method
ON payments(method);

CREATE INDEX IF NOT EXISTS idx_fuel_records_vehicle_date
ON fuel_records(vehicle_id, date);

CREATE INDEX IF NOT EXISTS idx_fuel_records_driver_date
ON fuel_records(driver_id, date);

CREATE INDEX IF NOT EXISTS idx_fuel_records_date
ON fuel_records(date);

CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_type
ON driver_documents(driver_id, document_type);

CREATE INDEX IF NOT EXISTS idx_driver_documents_expiry
ON driver_documents(expiry_date);

CREATE INDEX IF NOT EXISTS idx_driver_documents_status
ON driver_documents(status);

CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver
ON driver_ratings(driver_id, created_at);

CREATE INDEX IF NOT EXISTS idx_driver_ratings_booking
ON driver_ratings(booking_id);

CREATE INDEX IF NOT EXISTS idx_driver_ratings_passenger
ON driver_ratings(passenger_id);

CREATE INDEX IF NOT EXISTS idx_driver_ratings_rating
ON driver_ratings(rating);

CREATE INDEX IF NOT EXISTS idx_driver_payrolls_driver_period
ON driver_payrolls(driver_id, period_start_date);

CREATE INDEX IF NOT EXISTS idx_driver_payrolls_status
ON driver_payrolls(status);

CREATE INDEX IF NOT EXISTS idx_driver_payrolls_period
ON driver_payrolls(period_start_date, period_end_date);

CREATE INDEX IF NOT EXISTS idx_payment_tracking_user
ON payment_tracking(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_payment_tracking_booking
ON payment_tracking(booking_id);

CREATE INDEX IF NOT EXISTS idx_payment_tracking_status
ON payment_tracking(status, created_at);

CREATE INDEX IF NOT EXISTS idx_payment_tracking_method
ON payment_tracking(method, status);

CREATE INDEX IF NOT EXISTS idx_payment_tracking_initiated
ON payment_tracking(timestamps_initiated);

CREATE INDEX IF NOT EXISTS idx_report_schedules_creator
ON report_schedules(created_by_id, is_active);

CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run
ON report_schedules(next_run, is_active);

CREATE INDEX IF NOT EXISTS idx_report_schedules_type
ON report_schedules(report_type);

-- ==========================================
-- 16. ENABLE RLS (DISABLED FOR DEVELOPMENT)
-- ==========================================

-- RLS disabled for development - can be enabled for production
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 25. RLS POLICIES (DISABLED FOR DEVELOPMENT)
-- ==========================================

-- RLS policies disabled for development
-- Can be enabled for production when Supabase Auth is properly configured

-- ==========================================
-- 26. UPDATED_AT FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 27. TRIGGERS
-- ==========================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
        CREATE TRIGGER update_drivers_updated_at
        BEFORE UPDATE ON drivers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routes') THEN
        CREATE TRIGGER update_routes_updated_at
        BEFORE UPDATE ON routes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
        CREATE TRIGGER update_vehicles_updated_at
        BEFORE UPDATE ON vehicles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedules') THEN
        CREATE TRIGGER update_schedules_updated_at
        BEFORE UPDATE ON schedules
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        CREATE TRIGGER update_bookings_updated_at
        BEFORE UPDATE ON bookings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'route_optimizations') THEN
        CREATE TRIGGER update_route_optimizations_updated_at
        BEFORE UPDATE ON route_optimizations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_logs') THEN
        CREATE TRIGGER update_maintenance_logs_updated_at
        BEFORE UPDATE ON maintenance_logs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE TRIGGER update_notifications_updated_at
        BEFORE UPDATE ON notifications
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        CREATE TRIGGER update_payments_updated_at
        BEFORE UPDATE ON payments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_records') THEN
        CREATE TRIGGER update_fuel_records_updated_at
        BEFORE UPDATE ON fuel_records
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_documents') THEN
        CREATE TRIGGER update_driver_documents_updated_at
        BEFORE UPDATE ON driver_documents
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_ratings') THEN
        CREATE TRIGGER update_driver_ratings_updated_at
        BEFORE UPDATE ON driver_ratings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_payrolls') THEN
        CREATE TRIGGER update_driver_payrolls_updated_at
        BEFORE UPDATE ON driver_payrolls
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'geofences') THEN
        CREATE TRIGGER update_geofences_updated_at
        BEFORE UPDATE ON geofences
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_tracking') THEN
        CREATE TRIGGER update_payment_tracking_updated_at
        BEFORE UPDATE ON payment_tracking
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_schedules') THEN
        CREATE TRIGGER update_report_schedules_updated_at
        BEFORE UPDATE ON report_schedules
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- SCHEMA COMPLETE
-- ==========================================