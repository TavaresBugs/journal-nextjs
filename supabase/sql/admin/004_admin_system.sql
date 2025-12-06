-- ============================================
-- Migration: Admin System
-- Tabelas: users_extended, audit_logs
-- ============================================

-- ============================================
-- 1. USERS_EXTENDED
-- ============================================

CREATE TABLE IF NOT EXISTS users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'banned')),
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_extended_status ON users_extended(status);
CREATE INDEX IF NOT EXISTS idx_users_extended_role ON users_extended(role);
CREATE INDEX IF NOT EXISTS idx_users_extended_email ON users_extended(email);

-- ============================================
-- 2. AUDIT_LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- 3. RLS POLICIES
-- ============================================

ALTER TABLE users_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- users_extended: Usuários podem ver seus próprios dados
CREATE POLICY "users_can_view_own_profile" ON users_extended
  FOR SELECT USING (id = auth.uid());

-- users_extended: Usuários podem atualizar alguns campos próprios
CREATE POLICY "users_can_update_own_profile" ON users_extended
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- users_extended: Admins podem ver todos
CREATE POLICY "admins_can_view_all_users" ON users_extended
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_extended WHERE id = auth.uid() AND role = 'admin')
  );

-- users_extended: Admins podem gerenciar todos
CREATE POLICY "admins_can_manage_users" ON users_extended
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users_extended WHERE id = auth.uid() AND role = 'admin')
  );

-- audit_logs: Admins podem ver todos
CREATE POLICY "admins_can_view_all_logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_extended WHERE id = auth.uid() AND role = 'admin')
  );

-- audit_logs: Usuários podem ver seus próprios logs
CREATE POLICY "users_can_view_own_logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- audit_logs: Sistema pode inserir (via service role)
CREATE POLICY "system_can_insert_logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 4. TRIGGER: Auto-criar users_extended no signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_email TEXT;
BEGIN
  -- Pega email do admin da config (se existir)
  admin_email := current_setting('app.admin_email', true);

  INSERT INTO public.users_extended (id, email, name, avatar_url, status, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN admin_email IS NOT NULL AND NEW.email = admin_email THEN 'approved'
      ELSE 'pending'
    END,
    CASE
      WHEN admin_email IS NOT NULL AND NEW.email = admin_email THEN 'admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger se existir e recria
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 5. FUNÇÃO: Registrar audit log
-- ============================================

CREATE OR REPLACE FUNCTION log_audit(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_metadata)
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. MIGRAR USUÁRIOS EXISTENTES
-- ============================================

-- Inserir usuários existentes que não estão em users_extended
INSERT INTO users_extended (id, email, name, avatar_url, status, role, approved_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  u.raw_user_meta_data->>'avatar_url',
  'approved', -- Usuários existentes são auto-aprovados
  'user',
  NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM users_extended WHERE id = u.id);

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users_extended TO authenticated;
GRANT ALL ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit TO authenticated;
