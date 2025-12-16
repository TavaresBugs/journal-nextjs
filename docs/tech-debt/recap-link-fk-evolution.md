# Tech Debt: Evolução de Vínculos em Recaps

**Status:** 🟡 Planejado (próxima sprint)  
**Prioridade:** P2 (médio prazo)  
**Criado:** 2024-12-16

---

## Contexto

O modelo atual de vínculos em `laboratory_recaps` usa campos genéricos:

| Coluna        | Tipo      | Descrição                           |
| ------------- | --------- | ----------------------------------- |
| `trade_id`    | UUID (FK) | Legado, mantido por compatibilidade |
| `linked_type` | TEXT      | 'trade' ou 'journal'                |
| `linked_id`   | UUID      | **Sem FK** - referência genérica    |

### Riscos do Modelo Atual

1. **Referências órfãs:** `linked_id` pode apontar para registro inexistente
2. **Sem cascade:** Deletar trade/journal não limpa `linked_id` automaticamente
3. **Validação runtime:** Tipo só é verificado em código, não no banco

---

## Proposta de Melhoria

### V1: FKs Específicas (Próxima Sprint)

```sql
-- Adicionar colunas com integridade referencial real
ALTER TABLE laboratory_recaps
ADD COLUMN linked_trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
ADD COLUMN linked_journal_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL;

-- Constraint: apenas UM tipo de vínculo por vez
ALTER TABLE laboratory_recaps ADD CONSTRAINT chk_single_link
    CHECK (
        (linked_trade_id IS NULL AND linked_journal_id IS NULL) OR
        (linked_trade_id IS NOT NULL AND linked_journal_id IS NULL) OR
        (linked_trade_id IS NULL AND linked_journal_id IS NOT NULL)
    );
```

### V2: Remoção de Legado (Major Version)

Após validar V1 em produção:

```sql
ALTER TABLE laboratory_recaps
    DROP COLUMN trade_id,
    DROP COLUMN linked_type,
    DROP COLUMN linked_id;
```

---

## Monitoramento

Query de auditoria: `scripts/monitor_recap_links.sql`

Rodar semanalmente para detectar:

- ❌ Trade órfão
- ❌ Journal órfão
- ⚠️ trade_id legado órfão

---

## Testes Necessários (V1)

- [ ] Cria recap vinculado a trade via `linked_trade_id`
- [ ] Cria recap vinculado a journal via `linked_journal_id`
- [ ] Deletar trade → `linked_trade_id` vira NULL
- [ ] Deletar journal → `linked_journal_id` vira NULL
- [ ] Erro ao setar ambos (constraint violation)

---

## Condições para Execução

- [ ] Feature journal-link validada em produção por ≥2 semanas
- [ ] Query de monitoramento sem órfãos frequentes
- [ ] Sprint com capacidade para refactor não-crítico
