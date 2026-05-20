-- =========================
-- EXTENSIONES
-- =========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin')),
    is_technician BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- REFRESH TOKENS
-- =========================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- PASSWORD RESET TOKENS
-- =========================
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- SYSTEM SETTINGS (SINGLETON)
-- =========================
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    business_name TEXT NOT NULL,
    logo_url TEXT,
    default_frequency_days INT NOT NULL,
    default_reinforcement_days INT NOT NULL,
    reinforcement_enabled_default BOOLEAN DEFAULT true,
    reinforcement_is_paid_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- PAYMENT METHODS
-- =========================
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (
        type IN ('cash', 'bank', 'other')
    ),
    active BOOLEAN DEFAULT true
);

-- =========================
-- CLIENTS
-- =========================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- BUSINESSES
-- =========================
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    client_id UUID NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

-- =========================
-- BRANCHES
-- =========================

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  address TEXT NOT NULL,
  phone TEXT,
  city TEXT,

-- configuración propia
price_per_m2 NUMERIC,
  fixed_price NUMERIC,

  frequency_days INT,
  reinforcement_days INT,
  reinforcement_enabled BOOLEAN,
  reinforcement_is_paid BOOLEAN,
  technician_revenue_mode TEXT NOT NULL DEFAULT 'split' CHECK (technician_revenue_mode IN ('split', 'full')),

  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- SERVICE CYCLES
-- =========================
CREATE TABLE service_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    branch_id UUID UNIQUE NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    last_service_date TIMESTAMP,
    next_main_service_date TIMESTAMP,
    next_reinforcement_date TIMESTAMP,
    active BOOLEAN DEFAULT true
);

-- =========================
-- SERVICES
-- =========================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    branch_id UUID NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP NOT NULL,
    type TEXT NOT NULL CHECK (
        type IN ('main', 'reinforcement')
    ),
    status TEXT NOT NULL CHECK (
        status IN (
            'pending',
            'confirmed',
            'in_progress',
            'completed',
            'canceled',
            'rescheduled'
        )
    ),
    created_by UUID REFERENCES users (id),
    notes TEXT,
    payment_method_id UUID REFERENCES payment_methods (id),
    payment_proof_url TEXT,
    price NUMERIC,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- SERVICE TECHNICIANS (M:M)
-- =========================
CREATE TABLE service_technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    service_id UUID NOT NULL REFERENCES services (id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE
);

-- =========================
-- SERVICE EVIDENCES
-- =========================
CREATE TABLE service_evidences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    service_id UUID NOT NULL REFERENCES services (id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- ACTIVITY LOGS
-- =========================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID,
    action TEXT NOT NULL,
    entity TEXT,
    entity_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- ÍNDICES (CLAVE PARA RENDIMIENTO)
-- =========================

CREATE INDEX idx_clients_name ON clients (name);

CREATE INDEX idx_branches_city ON branches (city);

CREATE INDEX idx_services_scheduled_at ON services (scheduled_at);

CREATE INDEX idx_services_status ON services (status);

CREATE INDEX idx_services_branch_id ON services (branch_id);

CREATE INDEX idx_service_cycles_next_main ON service_cycles (next_main_service_date);

CREATE INDEX idx_service_cycles_next_reinforcement ON service_cycles (next_reinforcement_date);

CREATE INDEX idx_service_technicians_service ON service_technicians (service_id);

CREATE INDEX idx_service_technicians_technician ON service_technicians (technician_id);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);

CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);

CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens (token_hash);

CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens (expires_at);

-- SETTINGS BASE
INSERT INTO
    system_settings (
        business_name,
        default_frequency_days,
        default_reinforcement_days,
        reinforcement_enabled_default,
        reinforcement_is_paid_default
    )
VALUES (
        'Soluciones Radicales',
        90,
        20,
        true,
        false
    );

-- MÉTODOS DE PAGO
INSERT INTO payment_methods (name, type) VALUES
('Efectivo', 'cash'),
('Bancolombia', 'bank'),
('Davivienda', 'bank');

-- ADMIN INICIAL (password luego encriptado desde backend)
INSERT INTO
    users (
        name,
        email,
        password,
        role,
        is_technician
    )
VALUES (
        'Santaigo',
        'admin@admin.com',
        '123456',
        'admin',
        true
    );
