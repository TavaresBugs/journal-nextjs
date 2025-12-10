-- ============================================
-- TRADING JOURNAL - MISSING INDEXES
-- ============================================
-- Este script adiciona índices faltantes em colunas
-- de Foreign Key para otimizar queries de JOIN.
--
-- Execute no SQL Editor do Supabase.
-- ============================================

-- 1. journal_entries.trade_id
-- Usado para buscar journal entries por trade vinculado
CREATE INDEX IF NOT EXISTS idx_journal_entries_trade_id 
    ON journal_entries(trade_id);

-- 2. journal_images.journal_entry_id
-- Usado para carregar imagens de um journal entry
CREATE INDEX IF NOT EXISTS idx_journal_images_journal_entry_id 
    ON journal_images(journal_entry_id);

-- 3. mentor_reviews.journal_entry_id
-- Usado para buscar reviews de um journal entry
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_journal_entry_id 
    ON mentor_reviews(journal_entry_id);

-- 4. playbook_stars.user_id
-- Usado para listar stars de um usuário
CREATE INDEX IF NOT EXISTS idx_playbook_stars_user_id 
    ON playbook_stars(user_id);

-- 5. shared_journals.user_id
-- Usado para listar journals compartilhados por um usuário
CREATE INDEX IF NOT EXISTS idx_shared_journals_user_id 
    ON shared_journals(user_id);

-- 6. users_extended.approved_by
-- Usado para auditar aprovações de usuários
CREATE INDEX IF NOT EXISTS idx_users_extended_approved_by 
    ON users_extended(approved_by);

-- ============================================
-- PRONTO!
-- ============================================
-- 6 índices criados para otimizar JOINs.
-- "Unused Indexes" nas tabelas mental_* são normais
-- para features novas - mantidos intencionalmente.
-- ============================================
