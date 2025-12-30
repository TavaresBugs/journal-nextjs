# Deployment Checklist

Este documento contém o checklist completo para deploy seguro da aplicação.

---

## SEÇÃO 1: Pre-Deploy Validation

### ✅ Checklist Obrigatório

Antes de qualquer deploy, todos os itens abaixo devem ser verificados:

- [ ] `npm run build` passa sem erros
- [ ] `npm test` mostra **280 testes verdes**
- [ ] `npm run lint` sem erros críticos
- [ ] `npx tsc --noEmit` sem type errors
- [ ] Todos commits têm mensagens descritivas
- [ ] Branch atualizada com `main`
- [ ] Review manual feito por 1 dev

### 🔍 Validação de Schema SQL

Executar no Supabase para validar estrutura das tabelas:

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name IN ('trades', 'journal_entries', 'journal_entry_trades')
ORDER BY table_name;
```

---

## SEÇÃO 2: Staging Deployment

### Step 1: Deploy App to Staging

Deploy da aplicação via **Vercel** ou **Git push** para branch de staging.

```bash
git push origin staging
```

---

### Step 2: Apply Database Migration

> [!CAUTION] > **Migration 014 usa `CONCURRENTLY` e NÃO pode rodar em transação!**
>
> Este comando deve ser executado com `--no-transaction` ou a migration falhará.

```bash
psql staging_db --no-transaction -f supabase/migrations/014_optimization_indexes.sql
```

⏱️ **Tempo estimado:** 5-30 minutos

> [!WARNING] > **NÃO INTERROMPER** a execução da migration. Aguarde a conclusão completa.

---

### Step 3: Verify Indexes Created

Executar query para verificar se os índices foram criados:

```sql
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
  AND tablename IN ('trades', 'journal_entries', 'journal_entry_trades');
```

**Esperado:** 8 índices criados com nomes começando em `idx_`

| Índice Esperado              | Tabela               |
| ---------------------------- | -------------------- |
| `idx_trades_*`               | trades               |
| `idx_journal_entries_*`      | journal_entries      |
| `idx_journal_entry_trades_*` | journal_entry_trades |

---

### Step 4: Manual Testing (Smoke Tests)

Verificar manualmente cada funcionalidade crítica:

- [ ] Login funciona
- [ ] Dashboard carrega rápido
- [ ] Criar trade funciona
- [ ] Share link funciona
- [ ] Filtros funcionam

---

### Step 5: Performance Validation

#### Benchmark de Query

Query de 100 trades deve executar significativamente mais rápido após índices:

| Métrica        | Before | After (Target) |
| -------------- | ------ | -------------- |
| Avg Query Time | 250ms  | **< 100ms**    |

**Teste de performance:**

```sql
EXPLAIN ANALYZE
SELECT * FROM trades
WHERE user_id = 'your-user-id'
ORDER BY entry_date DESC
LIMIT 100;
```

> [!TIP]
> Compare o tempo de execução antes e depois da migration para validar a melhoria.

---

### Step 6: Monitor Logs por 1 Hora

Monitorar logs da aplicação buscando por:

| Item               | O que buscar                            |
| ------------------ | --------------------------------------- |
| ❌ Errors          | Errors de queries                       |
| ⚠️ Slow Queries    | Warnings de queries > 1000ms            |
| ✅ Structured Logs | Logs estruturados aparecem corretamente |

```bash
# Exemplo de comando para monitorar logs
vercel logs --follow
```

---

## SEÇÃO 3: Production Deployment

### ⏰ Timing

| Aspecto          | Recomendação                       |
| ---------------- | ---------------------------------- |
| **Janela Ideal** | 3-5 AM horário local               |
| **Motivo**       | Horário de baixo tráfego           |
| **Evitar**       | Horário de mercado aberto (9h-18h) |

---

### Step 1: Backup do Banco (OBRIGATÓRIO)

> [!CAUTION] > **BACKUP É OBRIGATÓRIO ANTES DE QUALQUER MIGRATION EM PRODUÇÃO!**
>
> Nunca prossiga sem confirmar que o backup foi criado com sucesso.

```bash
pg_dump prod_db > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql
```

**Verificar backup criado:**

```bash
ls -lh backup*.sql
```

Confirme que o arquivo tem tamanho razoável (não está vazio ou corrompido).

---

### Step 2: Apply Migration to Production

> [!WARNING] > **Migration 014 usa `CONCURRENTLY` e DEVE usar `--no-transaction`!**
>
> Sem esta flag, a migration falhará imediatamente.

```bash
psql prod_db --no-transaction -f supabase/migrations/014_optimization_indexes.sql
```

⏱️ **Tempo estimado:** 5-30 minutos — **NÃO INTERROMPER**

**Query de monitoramento** (executar em paralelo em outro terminal):

```sql
SELECT now(), pid, query, state
FROM pg_stat_activity
WHERE query LIKE '%CREATE INDEX%'
  AND state = 'active';
```

---

### Step 3: Verify Indexes (Production)

Verificar que os índices foram criados e estão válidos:

```sql
SELECT
    indexname,
    pg_index.indisvalid
FROM pg_indexes
JOIN pg_class ON indexname = relname
JOIN pg_index ON pg_class.oid = pg_index.indexrelid
WHERE indexname LIKE 'idx_%'
  AND tablename IN ('trades', 'journal_entries', 'journal_entry_trades');
```

> [!IMPORTANT] > **Validação crítica:** Todos os valores de `indisvalid` devem ser `true`.
>
> Se algum índice mostrar `false`, a criação falhou e deve ser investigada.

---

### Step 4: Deploy Application

```bash
git checkout main
git merge feature/backend-audit-refactor
git push origin main
```

> [!NOTE] > **Vercel auto-deploys** ao detectar push na branch `main`.
>
> Alternativamente, use `vercel --prod` para deploy manual.

---

### Step 5: Smoke Tests (Production)

> [!CAUTION] > **Testar IMEDIATAMENTE após deploy!**
>
> Se QUALQUER teste falhar, executar **ROLLBACK** (próxima seção).

Checklist de validação:

- [ ] Login produção funciona
- [ ] Dashboard carrega em **< 2s**
- [ ] Criar trade funciona
- [ ] Share link funciona
- [ ] APIs retornam **200 OK**

---

### Step 6: Monitor Metrics (2 horas)

Monitorar as seguintes métricas por pelo menos 2 horas após deploy:

| Métrica           | Threshold | Ação se ultrapassar      |
| ----------------- | --------- | ------------------------ |
| Response time P95 | < 2s      | Investigar slow queries  |
| Error rate        | < 1%      | **Rollback se > 5%**     |
| Database CPU      | < 70%     | OK se < 80%              |
| Failed queries    | < 10/min  | **Rollback se > 50/min** |

> [!TIP]
> Use o dashboard do Vercel e Supabase para monitorar estas métricas em tempo real.

---

## SEÇÃO 4: Rollback Plan

**Se QUALQUER problema crítico ocorrer em produção, executar estes passos imediatamente.**

---

### Step 1: Revert Database Migration

> [!WARNING] > **Reverter índices antes de qualquer outra ação!**

```bash
psql prod_db --no-transaction -f supabase/migrations/014_rollback_indexes.sql
```

**Verificar rollback:**

```sql
SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_%';
```

**Esperado:** 0 rows ou apenas índices antigos (não os da migration 014).

---

### Step 2: Revert Application Code

**Opção 1: Git Revert**

```bash
git revert HEAD --no-edit
git push origin main --force-with-lease
```

**Opção 2: Vercel Deploy de Commit Anterior**

```bash
vercel --prod --force
```

Selecione o commit anterior específico no dashboard do Vercel.

---

### Step 3: Restore Backup (Último Recurso)

> [!CAUTION] > **USE APENAS SE DADOS FORAM CORROMPIDOS!**
>
> Este cenário é improvável, mas se necessário:

```bash
psql prod_db < backup_pre_migration_TIMESTAMP.sql
```

> [!WARNING] > **PERDA DE DADOS:** Qualquer operação realizada entre o backup e o restore será perdida permanentemente.

---

### Step 4: Communicate

Após estabilizar, comunicar imediatamente:

- [ ] Notificar equipe no **Slack/Discord**
- [ ] Postar status no **status page** (se disponível)
- [ ] Documentar issue no **GitHub**
- [ ] Agendar **postmortem** para análise

---

## SEÇÃO 5: Post-Deploy Validation

**Após 24-48 horas de deploy estável, validar:**

---

### Performance Metrics

Verificar se os índices estão sendo utilizados:

```sql
SELECT
    schemaname,
    tablename,
    idx_scan AS index_scans,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;
```

**Esperado:** `idx_scan > 0` significa que os índices estão sendo usados efetivamente.

---

### Error Monitoring

Verificar logs no **Vercel Dashboard**:

Buscar por:

- `AppError`
- `ownership check failed`
- `slow query detected`

---

### User Feedback

- [ ] Verificar se usuários reportaram lentidão
- [ ] Comparar tempos de carregamento via analytics
- [ ] Verificar bounce rate no dashboard

---

## SEÇÃO 6: Success Criteria

**Deploy considerado SUCESSO se:**

- [ ] **0 rollbacks** necessários
- [ ] Error rate **< 1%** nas primeiras 24h pós-deploy
- [ ] Response time P95 **< 2s**
- [ ] Todos índices válidos (`indisvalid = true`)
- [ ] **280 testes** passando
- [ ] **0 reclamações** de usuários sobre performance

---

## SEÇÃO 7: Next Steps (Post-Deploy)

**Após deploy bem-sucedido:**

### 1. Documentar Lições Aprendidas

- O que funcionou bem?
- O que pode melhorar?
- Tempo real vs estimado?

### 2. Criar Issues para Próximos Passos

- [ ] Migrar componentes restantes
- [ ] Criar `JournalRepository`
- [ ] Criar `PlaybookRepository`
- [ ] Setup APM monitoring (Datadog/Sentry)

### 3. Atualizar README

- [ ] Adicionar badge de status
- [ ] Atualizar stack tecnológico
- [ ] Documentar novos padrões

### 4. Compartilhar com Equipe

- [ ] Apresentar melhorias de performance
- [ ] Treinar time nos Repositories
- [ ] Atualizar guidelines de código

---

## SEÇÃO 8: Emergency Contacts

**Se problemas críticos ocorrerem:**

| Recurso            | Contato                                          |
| ------------------ | ------------------------------------------------ |
| **Database Admin** | [Supabase Support](https://supabase.com/support) |
| **Vercel Support** | [Vercel Help](https://vercel.com/help)           |
| **Team Lead**      | @YourTeamLead (Slack/Discord)                    |

---

---

**Última atualização:** 2025-12-14  
**Autor:** Backend Audit Team  
**Versão:** 1.0
