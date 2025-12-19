# 🚧 Features Pendentes - Trading Journal Pro

> **Objetivo:** Backlog de features priorizadas com critérios de aceitação.
> **Última atualização:** 18 de Dezembro de 2025

---

## 📊 Visão Geral

| Prioridade | Count | Descrição                      |
| ---------- | ----- | ------------------------------ |
| 🔴 P0      | 2     | Crítico - Esta semana          |
| 🟡 P1      | 5     | Importante - Este mês          |
| 🟢 P2      | 8     | Nice-to-have - Próximo quarter |

---

## 🔴 P0 - Crítico

### F001: Calendário Econômico Integrado

**User Story:** Como trader, quero ver eventos econômicos no dashboard para planejar minha semana.

**Critérios de Aceitação:**

- [x] Sync automático com Forex Factory
- [x] Filtro por moeda e impacto
- [x] Double-check de segurança nos scrapes
- [ ] Notificação admin quando sync falhar
- [ ] Widget no dashboard principal

**Complexidade:** L (Large)  
**Status:** 🟡 80% completo

---

### F002: Admin Dashboard

**User Story:** Como admin, quero gerenciar usuários e ver métricas do sistema.

**Critérios de Aceitação:**

- [x] Lista de usuários com status
- [x] Aprovar/suspender usuários
- [ ] Métricas de uso (trades/dia, usuários ativos)
- [ ] Logs de auditoria
- [ ] Gestão de convites

**Complexidade:** M (Medium)  
**Status:** 🟡 60% completo

---

## 🟡 P1 - Importante

### F003: Import MetaTrader 5

**User Story:** Como trader, quero importar meu histórico do MT5 para não digitar trades manualmente.

**Critérios de Aceitação:**

- [ ] Upload de arquivo .xlsx/.csv
- [ ] Mapeamento de colunas
- [ ] Preview antes de importar
- [ ] Detecção de duplicatas
- [ ] Relatório de erros

**Complexidade:** L (Large)  
**Status:** 🟡 50% completo

---

### F004: Notificações Push

**User Story:** Como trader, quero ser notificado de eventos importantes (alta volatilidade, reviews de mentor).

**Critérios de Aceitação:**

- [ ] Service Worker configurado
- [ ] Permissão de notificação
- [ ] Notificação de eventos econômicos
- [ ] Notificação de review de mentor
- [ ] Configurações de preferência

**Complexidade:** M (Medium)  
**Status:** ⚪ 0%

---

### F005: Trade Replay

**User Story:** Como trader, quero ver meus trades passados frame a frame para estudar.

**Critérios de Aceitação:**

- [ ] Player com controles
- [ ] Sincronização com timeframe
- [ ] Navegação por trades
- [ ] Anotações no replay

**Complexidade:** XL (Extra Large)  
**Status:** ⚪ 0%

---

### F006: Backtesting Básico

**User Story:** Como trader, quero testar estratégias em dados passados.

**Critérios de Aceitação:**

- [ ] Input de regras do playbook
- [ ] Simulação em histórico
- [ ] Métricas de resultado
- [ ] Comparação entre estratégias

**Complexidade:** XL (Extra Large)  
**Status:** ⚪ 0%

---

### F007: Export PDF Reports

**User Story:** Como trader, quero gerar relatórios mensais em PDF para análise ou envio a prop firm.

**Critérios de Aceitação:**

- [ ] Seleção de período
- [ ] Template profissional
- [ ] Gráficos de performance
- [ ] Download direto

**Complexidade:** M (Medium)  
**Status:** ⚪ 0%

---

## 🟢 P2 - Nice-to-have

### F008: Dark/Light Theme Toggle

**User Story:** Como usuário, quero alternar entre tema escuro e claro.

**Complexidade:** S (Small)  
**Status:** ⚪ 0%

---

### F009: Keyboard Shortcuts

**User Story:** Como power user, quero navegar com teclado.

**Complexidade:** S (Small)  
**Status:** ⚪ 0%

---

### F010: Integração TradingView

**User Story:** Como trader, quero importar trades do TradingView.

**Complexidade:** L (Large)  
**Status:** ⚪ 0%

---

### F011: Mobile App (React Native)

**User Story:** Como trader, quero acessar o journal no celular.

**Complexidade:** XL (Extra Large)  
**Status:** ⚪ 0% (Planejado Q2 2026)

---

### F012: AI Insights

**User Story:** Como trader, quero receber insights automáticos sobre minha performance.

**Complexidade:** XL (Extra Large)  
**Status:** ⚪ 0% (Planejado Q3 2026)

---

### F013: Comunidade de Playbooks

**User Story:** Como trader, quero compartilhar e descobrir estratégias.

**Critérios de Aceitação:**

- [x] Publicar playbook
- [x] Sistema de stars
- [ ] Comentários
- [ ] Clone de playbooks
- [ ] Ranking de popularidade

**Complexidade:** M (Medium)  
**Status:** 🟡 40% completo

---

### F014: Multi-Language (i18n)

**User Story:** Como usuário internacional, quero usar o app em inglês.

**Complexidade:** M (Medium)  
**Status:** ⚪ 0%

---

### F015: Gamificação

**User Story:** Como trader, quero conquistas e badges para motivação.

**Complexidade:** M (Medium)  
**Status:** ⚪ 0%

---

## 📝 Legenda de Complexidade

| Tamanho          | Fibonacci | Tempo Estimado |
| ---------------- | --------- | -------------- |
| S (Small)        | 1-2       | 1-2 horas      |
| M (Medium)       | 3-5       | 1-2 dias       |
| L (Large)        | 8-13      | 1 semana       |
| XL (Extra Large) | 21+       | 2+ semanas     |

---

## 🔗 Referências

- [ROADMAP.md](./ROADMAP.md) - Visão de longo prazo
- [TODO.md](./TODO.md) - Tarefas do dia-a-dia
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Onde implementar

---

**Mantido por:** [@TavaresBugs](https://github.com/TavaresBugs)
