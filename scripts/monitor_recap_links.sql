-- ============================================
-- Monitor: Detecção de Referências Órfãs em Recaps
-- ============================================
-- Rodar periodicamente (ex.: 1x/semana) para verificar
-- se o modelo genérico (linked_type + linked_id) está
-- gerando referências órfãs.
--
-- Criado em: 2024-12-16
-- Motivo: Modelo sem FK permite UUIDs inválidos
-- ============================================

SELECT
    lr.id AS recap_id,
    lr.title AS recap_title,
    lr.linked_type,
    lr.linked_id,
    lr.created_at,
    CASE
        -- Check for orphaned trade references
        WHEN lr.linked_type = 'trade'
            AND lr.linked_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM trades t WHERE t.id = lr.linked_id::uuid
            )
        THEN '❌ Trade órfão'
        
        -- Check for orphaned journal references
        WHEN lr.linked_type = 'journal'
            AND lr.linked_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM journal_entries j WHERE j.id = lr.linked_id::uuid
            )
        THEN '❌ Journal órfão'
        
        -- Check for legacy trade_id references
        WHEN lr.trade_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM trades t WHERE t.id = lr.trade_id
            )
        THEN '⚠️ trade_id legado órfão'
        
        -- All good
        ELSE '✅ OK'
    END AS integrity_status
FROM laboratory_recaps lr
WHERE 
    lr.linked_id IS NOT NULL 
    OR lr.trade_id IS NOT NULL
ORDER BY 
    CASE 
        WHEN lr.linked_type = 'trade' AND NOT EXISTS (SELECT 1 FROM trades t WHERE t.id = lr.linked_id::uuid) THEN 0
        WHEN lr.linked_type = 'journal' AND NOT EXISTS (SELECT 1 FROM journal_entries j WHERE j.id = lr.linked_id::uuid) THEN 0
        ELSE 1
    END,
    lr.created_at DESC;

-- ============================================
-- Quick summary query (run first for overview)
-- ============================================
/*
SELECT 
    COUNT(*) AS total_recaps,
    COUNT(*) FILTER (WHERE linked_type = 'trade') AS trade_links,
    COUNT(*) FILTER (WHERE linked_type = 'journal') AS journal_links,
    COUNT(*) FILTER (WHERE linked_type IS NULL AND trade_id IS NOT NULL) AS legacy_trade_links,
    COUNT(*) FILTER (WHERE linked_type IS NULL AND trade_id IS NULL AND linked_id IS NULL) AS no_links
FROM laboratory_recaps;
*/
