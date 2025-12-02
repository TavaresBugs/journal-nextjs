-- ============================================
-- ADD USER_ID TO ALL TABLES
-- ============================================
-- Esta migration adiciona a coluna user_id em todas as tabelas
-- para permitir isolamento de dados por usuário autenticado

-- Adicionar coluna user_id (permitindo NULL temporariamente para dados existentes)
ALTER TABLE accounts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE trades ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE journal_entries ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE journal_images ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE daily_routines ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE settings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índices para performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_images_user_id ON journal_images(user_id);
CREATE INDEX idx_daily_routines_user_id ON daily_routines(user_id);
CREATE INDEX idx_settings_user_id ON settings(user_id);

-- NOTA: Após todos os usuários migrarem seus dados, execute:
-- ALTER TABLE accounts ALTER COLUMN user_id SET NOT NULL;
-- (e similar para outras tabelas)
