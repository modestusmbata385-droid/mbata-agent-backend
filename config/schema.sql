-- Mbata Agent — initial schema (Phase 1 foundation only).
-- Covers the global account system + profile shell from blueprint
-- Sections 2, 6, 7, 27, 28. Module-specific tables (finance, business,
-- boss/tenant, education, ai, notifications, media, audit) are added in
-- their respective phases — this file is intentionally not exhaustive.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core account (Section 2)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(32),
  password_hash TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  pending_email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Login security state (Section 4)
CREATE TABLE IF NOT EXISTS user_security (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Active sessions (Section 31)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email verification OTPs (Section 3)
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Password reset OTPs/tokens (Section 5)
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Module profile shell (Section 7) — one row per profile type a user activates.
-- profile_type: 'finance' | 'business' | 'boss' | 'driver' | 'tenant' | 'parent' | 'student'
-- profile_data holds type-specific fields until each module gets its own table.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_type VARCHAR(32) NOT NULL,
  profile_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, profile_type)
);

-- Audit log (Section 36) — append-only from the application layer.
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(128) NOT NULL,
  resource VARCHAR(128),
  result VARCHAR(32),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- ============================================================
-- PHASE 3+: Module tables (Finance, Business, Boss/Driver/Tenant,
-- Education, Notifications). Profiles table already covers the
-- generic profile shell; these add module-specific structured data
-- that's too relational to live comfortably in profiles.profile_data.
-- ============================================================

-- ---- Finance (Section 10) ----
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(16) NOT NULL CHECK (type IN ('income','expense')),
  category VARCHAR(64),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(16) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','rejected')),
  note TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category VARCHAR(64) NOT NULL,
  limit_amount NUMERIC(14,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(128) NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL,
  saved_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Business (Section 11) ----
CREATE TABLE IF NOT EXISTS business_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  sku VARCHAR(64),
  buying_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  minimum_stock_level INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  phone_number VARCHAR(32),
  outstanding_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES business_customers(id) ON DELETE SET NULL,
  payment_method VARCHAR(32),
  reference VARCHAR(64),
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES business_products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(14,2) NOT NULL,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS business_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category VARCHAR(64),
  amount NUMERIC(14,2) NOT NULL,
  note TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Boss Connect (Section 12-17) ----
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boss_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  asset_type VARCHAR(32) NOT NULL, -- 'motorcycle' | 'property' | future types
  details JSONB NOT NULL DEFAULT '{}',
  connection_code VARCHAR(32) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  required_amount NUMERIC(14,2) NOT NULL,
  frequency VARCHAR(16) NOT NULL DEFAULT 'daily', -- daily | weekly | monthly
  grace_period_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS boss_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  connected_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- driver or tenant profile
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (asset_id, connected_profile_id)
);

CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES boss_connections(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  payment_method VARCHAR(32),
  reference VARCHAR(64),
  note TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ---- Education (Section 18-20) ----
CREATE TABLE IF NOT EXISTS parent_student_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_profile_id, student_profile_id)
);

CREATE TABLE IF NOT EXISTS academic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject VARCHAR(64) NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
  term VARCHAR(32),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (student_profile_id, date)
);

CREATE TABLE IF NOT EXISTS academic_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(128) NOT NULL,
  target_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- Notifications (Section 24-25) ----
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(128) NOT NULL,
  body TEXT,
  channel VARCHAR(16) NOT NULL DEFAULT 'in_app',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- AI (Section 21-23) ----
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_profile ON transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_sales_profile ON sales(profile_id);
CREATE INDEX IF NOT EXISTS idx_boss_connections_asset ON boss_connections(asset_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_connection ON payment_requests(connection_id);
CREATE INDEX IF NOT EXISTS idx_academic_results_student ON academic_results(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ---- Media (Section 26) ----
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(64),
  size_bytes INT,
  purpose VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
