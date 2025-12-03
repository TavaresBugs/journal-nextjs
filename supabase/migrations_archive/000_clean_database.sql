-- ============================================
-- CLEAN DATABASE - DELETAR TODOS OS DADOS
-- ============================================
-- Execute este script ANTES das migrations 006 e 007
-- Isso remove todos os dados existentes para começar fresh com autenticação

-- Desabilitar temporariamente as políticas RLS para permitir delete
ALTER TABLE journal_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_routines DISABLE ROW LEVEL SECURITY;
ALTER TABLE trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Deletar dados em ordem (respeitar foreign keys)
DELETE FROM journal_images;
DELETE FROM journal_entries;
DELETE FROM daily_routines;
DELETE FROM trades;
DELETE FROM settings;
DELETE FROM accounts;

-- Reabilitar RLS
ALTER TABLE journal_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Verificar que tudo foi deletado
SELECT 
    'accounts' as tabela, COUNT(*) as registros FROM accounts
UNION ALL
SELECT 'trades', COUNT(*) FROM trades
UNION ALL
SELECT 'journal_entries', COUNT(*) FROM journal_entries
UNION ALL
SELECT 'journal_images', COUNT(*) FROM journal_images
UNION ALL
SELECT 'daily_routines', COUNT(*) FROM daily_routines
UNION ALL
SELECT 'settings', COUNT(*) FROM settings;

-- Deve retornar 0 para todas as tabelas
