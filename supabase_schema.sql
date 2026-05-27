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
    CREATE TYPE user_role AS ENUM (
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
    CREATE TYPE user_locale AS ENUM ('en', 'am');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_type AS ENUM (
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
    CREATE TYPE vehicle_status AS ENUM (
        'ACTIVE',
        'INACTIVE',
        'MAINTENANCE',
        'RETIRED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE fuel_type AS ENUM (
        'PETROL',
        'DIESEL',
        'ELECTRIC',
        'HYBRID'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE route_status AS ENUM (
        'ACTIVE',
        'INACTIVE',
        'SEASONAL'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE schedule_status AS ENUM (
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
    CREATE TYPE booking_status AS ENUM (
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
    CREATE TYPE payment_status AS ENUM (
        'UNPAID',
        'PAID',
        'REFUNDED',
        'PARTIALLY_PAID'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
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
    CREATE TYPE optimization_status AS ENUM (
        'PENDING',
        'OPTIMIZING',
        'COMPLETED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE location_status AS ENUM (
        'ACTIVE',
        'IDLE',
        'OFFLINE',
        'MAINTENANCE'
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

-- ==========================================
-- 5. DRIVERS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_type VARCHAR(50),

    license_expiry TIMESTAMP WITH TIME ZONE,

    years_of_experience INTEGER DEFAULT 0,

    rating NUMERIC(3,2) DEFAULT 0.0,

    status VARCHAR(50) DEFAULT 'ACTIVE',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. ROUTES TABLE
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

    status route_status DEFAULT 'ACTIVE',
    transport_type TEXT[] DEFAULT ARRAY['BUS']::TEXT[],
    is_intercity BOOLEAN DEFAULT FALSE,

    operator_id UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX routes_code ON routes(code);
CREATE INDEX routes_status ON routes(status);

-- ==========================================
-- 7. VEHICLES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS vehicles (
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

    mileage INTEGER DEFAULT 0,

    gps_enabled BOOLEAN DEFAULT FALSE,

    current_location JSONB DEFAULT '{"type":"Point","coordinates":[37.5543,6.0333]}',

    documents JSONB DEFAULT '[]',

    image TEXT DEFAULT '',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX vehicles_plate_number ON vehicles(plate_number);
CREATE INDEX vehicles_status_type ON vehicles(status, type);

-- ==========================================
-- 8. VEHICLE LOCATION HISTORY
-- ==========================================

CREATE TABLE IF NOT EXISTS vehicle_location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,

    location geometry(Point, 4326) NOT NULL,

    speed NUMERIC(10,2) DEFAULT 0,

    heading NUMERIC(10,2) DEFAULT 0,

    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    altitude NUMERIC(10,2) DEFAULT 0,

    accuracy NUMERIC(10,2) DEFAULT 0,

    battery_level INTEGER DEFAULT 100,

    status location_status DEFAULT 'ACTIVE'
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

    status schedule_status DEFAULT 'SCHEDULED',

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

CREATE INDEX schedules_route_departure ON schedules(route_id, departure_time);
CREATE INDEX schedules_vehicle_departure ON schedules(vehicle_id, departure_time);
CREATE INDEX schedules_status ON schedules(status);
CREATE INDEX schedules_departure_time ON schedules(departure_time);

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

    status booking_status DEFAULT 'PENDING',

    payment_status payment_status DEFAULT 'UNPAID',

    payment_method payment_method,

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

CREATE UNIQUE INDEX bookings_booking_ref ON bookings(booking_ref);
CREATE INDEX bookings_passenger_created ON bookings(passenger_id, created_at);
CREATE INDEX bookings_schedule ON bookings(schedule_id);
CREATE INDEX bookings_status_payment ON bookings(status, payment_status);

-- ==========================================
-- 11. ROUTE OPTIMIZATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS route_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,

    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,

    status optimization_status DEFAULT 'PENDING',

    optimization_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    optimized_by UUID REFERENCES users(id),

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

CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,

    description TEXT,

    cost NUMERIC(10,2),

    date_performed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    performed_by VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 13. AUDIT LOGS
-- ==========================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    action VARCHAR(255) NOT NULL,

    entity VARCHAR(255),

    entity_id UUID,

    details JSONB,

    ip_address VARCHAR(45),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 14. NOTIFICATIONS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL,

    message TEXT NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 15. PAYMENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,

    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    amount NUMERIC(10,2) NOT NULL,

    currency VARCHAR(10) DEFAULT 'ETB',

    method VARCHAR(50) NOT NULL,

    status VARCHAR(50) DEFAULT 'PENDING',

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

CREATE TABLE IF NOT EXISTS fuel_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,

    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    fuel_type VARCHAR(50) NOT NULL,

    quantity NUMERIC(10,2) NOT NULL,

    unit VARCHAR(20) DEFAULT 'LITERS',

    cost_per_unit NUMERIC(10,2) NOT NULL,

    total_cost NUMERIC(10,2),

    odometer_reading NUMERIC(10,2) NOT NULL,

    previous_odometer NUMERIC(10,2),

    distance_traveled NUMERIC(10,2),

    fuel_efficiency NUMERIC(10,2),

    station VARCHAR(255),

    location JSONB,

    payment_method VARCHAR(50) DEFAULT 'CASH',

    receipt_number VARCHAR(255),

    notes TEXT,

    operator_id UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 17. DRIVER DOCUMENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE NOT NULL,

    document_type VARCHAR(50) NOT NULL,

    document_number VARCHAR(255),

    issue_date TIMESTAMP WITH TIME ZONE,

    expiry_date TIMESTAMP WITH TIME ZONE,

    issuing_authority VARCHAR(255),

    file_url TEXT,

    file_name VARCHAR(255),

    file_size INTEGER,

    mime_type VARCHAR(100),

    status VARCHAR(50) DEFAULT 'PENDING',

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

CREATE TABLE IF NOT EXISTS driver_payrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE NOT NULL,

    period_type VARCHAR(50) NOT NULL,

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

    status VARCHAR(50) DEFAULT 'PENDING',

    payment_method VARCHAR(50),

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

CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(255) NOT NULL,

    type VARCHAR(50) NOT NULL,

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

CREATE TABLE IF NOT EXISTS payment_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    transaction_id VARCHAR(255) UNIQUE NOT NULL,

    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,

    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

    amount NUMERIC(10,2) NOT NULL,

    currency VARCHAR(10) DEFAULT 'ETB',

    method VARCHAR(50) NOT NULL,

    status VARCHAR(50) DEFAULT 'PENDING',

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

CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(255) NOT NULL,

    description TEXT,

    report_type VARCHAR(50) NOT NULL,

    schedule_type VARCHAR(50) NOT NULL,

    schedule_day_of_week INTEGER CHECK (schedule_day_of_week >= 0 AND schedule_day_of_week <= 6),

    schedule_day_of_month INTEGER CHECK (schedule_day_of_month >= 1 AND schedule_day_of_month <= 31),

    schedule_time VARCHAR(10) NOT NULL,

    filters JSONB DEFAULT '{"startDate": null, "endDate": null, "routes": [], "vehicles": [], "paymentMethods": [], "statuses": []}',

    format VARCHAR(10) DEFAULT 'pdf',

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

CREATE INDEX IF NOT EXISTS idx_routes_start_coords
ON routes USING GIST(start_coordinates);

CREATE INDEX IF NOT EXISTS idx_routes_end_coords
ON routes USING GIST(end_coordinates);

CREATE INDEX IF NOT EXISTS idx_vehicle_current_location
ON vehicles USING GIST(current_location);

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
-- 16. ENABLE RLS
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 25. RLS POLICIES
-- ==========================================

DO $$ BEGIN
    CREATE POLICY "Users can view their own data"
    ON users
    FOR SELECT
    USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public can view active vehicles"
    ON vehicles
    FOR SELECT
    USING (status = 'ACTIVE'::vehicle_status);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Passengers can view their bookings"
    ON bookings
    FOR SELECT
    USING (auth.uid() = passenger_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view their own notifications"
    ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

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

DO $$ BEGIN
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_routes_updated_at
    BEFORE UPDATE ON routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_route_optimizations_updated_at
    BEFORE UPDATE ON route_optimizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_maintenance_logs_updated_at
    BEFORE UPDATE ON maintenance_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_fuel_records_updated_at
    BEFORE UPDATE ON fuel_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_driver_documents_updated_at
    BEFORE UPDATE ON driver_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_driver_ratings_updated_at
    BEFORE UPDATE ON driver_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_driver_payrolls_updated_at
    BEFORE UPDATE ON driver_payrolls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_geofences_updated_at
    BEFORE UPDATE ON geofences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_payment_tracking_updated_at
    BEFORE UPDATE ON payment_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_report_schedules_updated_at
    BEFORE UPDATE ON report_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- SCHEMA COMPLETE
-- ==========================================