-- ============================================
-- FIX: Unique Constraint on settings.user_id
-- ============================================

-- STEP 1: Backup (Fora da transação para garantir persistência)
CREATE TABLE IF NOT EXISTS settings_backup_20251213 AS
SELECT * FROM settings;

-- INÍCIO DA TRANSAÇÃO
BEGIN;

    -- STEP 2: Log informativo
    DO $$
    DECLARE
        duplicate_count INT;
        null_count INT;
    BEGIN
        SELECT COUNT(*) INTO duplicate_count
        FROM (SELECT user_id FROM settings GROUP BY user_id HAVING COUNT(*) > 1) d;
        
        SELECT COUNT(*) INTO null_count FROM settings WHERE user_id IS NULL;

        RAISE NOTICE 'Diagnóstico: % usuários duplicados e % user_ids nulos.', duplicate_count, null_count;
    END $$;

    -- STEP 3.1: Remover registros com user_id NULL
    DELETE FROM settings WHERE user_id IS NULL;

    -- STEP 3.2: Remover duplicatas usando ROW_NUMBER (funciona com UUID)
    DELETE FROM settings
    WHERE id IN (
        SELECT id FROM (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) AS rn
            FROM settings
        ) ranked
        WHERE rn > 1  -- Remove todos exceto o mais recente
    );

    -- STEP 4: Garantir NOT NULL
    ALTER TABLE settings ALTER COLUMN user_id SET NOT NULL;

    -- STEP 5: Adicionar UNIQUE constraint
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'settings_user_id_key'
        ) THEN
            ALTER TABLE settings ADD CONSTRAINT settings_user_id_key UNIQUE (user_id);
            RAISE NOTICE 'Constraint UNIQUE criada com sucesso.';
        ELSE
            RAISE NOTICE 'A Constraint já existia.';
        END IF;
    END $$;

COMMIT;

-- STEP 6: Validação Final
SELECT 
  COUNT(*) as total_rows,
  COUNT(DISTINCT user_id) as unique_users,
  (SELECT COUNT(*) FROM pg_constraint WHERE conname = 'settings_user_id_key') as constraint_exists,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT user_id) THEN '✅ SUCESSO'
    ELSE '❌ ERRO'
  END as status
FROM settings;
