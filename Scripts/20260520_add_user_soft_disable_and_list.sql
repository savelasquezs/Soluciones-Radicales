-- Agrega soporte de desactivacion logica de usuarios
ALTER TABLE users
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE users
ADD COLUMN disabled_at TIMESTAMP;

CREATE INDEX idx_users_active ON users (active);

