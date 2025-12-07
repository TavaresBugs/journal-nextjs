# 📋 TODO List - Trading Journal Pro

> **Última atualização:** 06/12/2024 21:50 (Brasília)

---

## ✅ Concluído Hoje (06/12/2024)

### Implementações

- [x] **NinjaTrader Import** - Suporte completo a CSV do NinjaTrader

  - Parser para formato brasileiro (`;` separator, `,` decimal)
  - Conversão de timezone Brasília → NY
  - Símbolos limpos: `MNQ 12-25` → `MNQ`
  - Comissão armazenada como negativo

- [x] **MetaTrader HTML Fix** - Parser melhorado

  - Suporte a 13, 14 e 15+ colunas
  - Corrigido bug de Volume/Price invertidos

- [x] **Commission/Swap no Banco**

  - Campos adicionados ao `DBTrade`
  - Mappers atualizados (`mapTradeToDB`, `mapTradeFromDB`)
  - Migração SQL: `017_add_trade_costs.sql`

- [x] **Avatar Fix** - Imagens carregando corretamente
  - Google domains configurados no `next.config.ts`
  - Tratamento de strings vazias
  - Error handlers para imagens quebradas

---

## 🔴 Alta Prioridade (Próximos Passos)

### 1. Testes Manuais Pendentes

- [ ] Testar import NinjaTrader com arquivo real
- [ ] Verificar se datas estão em horário NY após import
- [ ] Confirmar commission aparecendo no formulário de trade
- [ ] Testar import MetaTrader HTML com diferentes formatos

### 2. Deploy e CI/CD

- [ ] Executar migração `017_add_trade_costs.sql` no Supabase produção
- [ ] Verificar build de produção na Vercel
- [ ] Testar fluxo completo em produção

### 3. Bugs Conhecidos

- [ ] Corrigir lint warnings do Tailwind (classes CSS)
- [ ] Verificar logs duplicados de `getSentInvites`/`getReceivedInvites`

---

## 🟡 Média Prioridade (Próximas Semanas)

### Playbooks

- [ ] Drag & Drop para reordenar regras
- [ ] Templates prontos (ICT, SMC, Price Action)
- [ ] Dashboard de métricas por playbook

### Dashboard

- [ ] Gráfico MFE/MAE (dispersão de trades)
- [ ] Lock Asset no formulário
- [ ] Distribuição horária de trades

### Journal

- [ ] Carousel de imagens no modal
- [ ] Preview melhorado

### Import/Export

- [ ] Import de MT5 (formato diferente do MT4)
- [ ] Sincronização automática via API de corretora

---

## 🟢 Baixa Prioridade (Backlog)

### Sistema

- [ ] Backup automático periódico
- [ ] Temas customizados
- [ ] Internacionalização (EN/ES)
- [ ] Modo offline com sync

### IA Features (Roadmap)

- [ ] Análise de padrões comportamentais
- [ ] Alertas de desvio de regras
- [ ] Sugestões baseadas em dados históricos

### Comunidade

- [ ] Sistema de reviews mentor/aluno funcional
- [ ] Leaderboards
- [ ] Compartilhamento de playbooks

---

## 📊 Status das Tasks do Jules

| Task | Descrição                   | Status             |
| ---- | --------------------------- | ------------------ |
| 1-17 | Todas as 17 tasks originais | ✅ 100% Concluídas |

### Arquivos Principais Modificados Hoje

- `src/components/import/ImportModal.tsx`
- `src/services/importService.ts`
- `src/services/tradeService.ts`
- `src/types/database.ts`
- `src/app/admin/page.tsx`
- `next.config.ts`
- `supabase/migrations/017_add_trade_costs.sql`

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Testes
npm test

# Build de produção
npm run build

# Lint
npm run lint
```

---

## 📝 Notas

1. **Migração SQL obrigatória** - Antes de testar commission/swap, execute a migração no Supabase
2. **Restart do dev server** - Necessário após mudanças no `next.config.ts`
3. **Timezone** - NinjaTrader: Brasília → NY | MetaTrader: conforme configuração do broker
