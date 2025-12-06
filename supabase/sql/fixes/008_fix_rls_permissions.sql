-- ============================================
-- FIX RLS PERMISSION DENIED ERRORS
-- ============================================
-- Este script corrige erros "permission denied for table users"
-- que ocorrem quando RLS policies tentam acessar auth.users

-- Opção 1: Dar permissão de SELECT na tabela auth.users (recomendado)
-- Isso permite que as RLS policies façam verificações com auth.uid()
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- Se ainda houver problemas, pode ser necessário também dar
-- permissão de USAGE no schema auth:
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;

-- Verificar se as tabelas existem e têm RLS habilitado
ALTER TABLE IF EXISTS trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS playbooks ENABLE ROW LEVEL SECURITY;

-- Garantir que as políticas básicas existem para trades
DROP POLICY IF EXISTS "trades_select_policy" ON trades;
CREATE POLICY "trades_select_policy" ON trades
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trades_insert_policy" ON trades;
CREATE POLICY "trades_insert_policy" ON trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trades_update_policy" ON trades;
CREATE POLICY "trades_update_policy" ON trades
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trades_delete_policy" ON trades;
CREATE POLICY "trades_delete_policy" ON trades
    FOR DELETE USING (auth.uid() = user_id);

-- Garantir que as políticas básicas existem para journal_entries
DROP POLICY IF EXISTS "journal_select_policy" ON journal_entries;
CREATE POLICY "journal_select_policy" ON journal_entries
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "journal_insert_policy" ON journal_entries;
CREATE POLICY "journal_insert_policy" ON journal_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "journal_update_policy" ON journal_entries;
CREATE POLICY "journal_update_policy" ON journal_entries
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "journal_delete_policy" ON journal_entries;
CREATE POLICY "journal_delete_policy" ON journal_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Garantir que as políticas básicas existem para accounts
DROP POLICY IF EXISTS "accounts_select_policy" ON accounts;
CREATE POLICY "accounts_select_policy" ON accounts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "accounts_insert_policy" ON accounts;
CREATE POLICY "accounts_insert_policy" ON accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "accounts_update_policy" ON accounts;
CREATE POLICY "accounts_update_policy" ON accounts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "accounts_delete_policy" ON accounts;
CREATE POLICY "accounts_delete_policy" ON accounts
    FOR DELETE USING (auth.uid() = user_id);
