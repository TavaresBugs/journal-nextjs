# 📋 TODO - Trading Journal Pro

> **Objetivo:** Tarefas organizadas por categoria e prioridade.
> **Última atualização:** 18 de Dezembro de 2025

---

## 🔴 P0 - Crítico (Esta Semana)

### 🐛 Bugs

| Tarefa                                | Estimativa | Arquivo                  | Status  |
| ------------------------------------- | ---------- | ------------------------ | ------- |
| ~~Fix event impact "none" sem ícone~~ | 30min      | `EventRow.tsx`           | ✅ DONE |
| ~~Capitalizar dias da semana~~        | 15min      | `EconomicCalendar.tsx`   | ✅ DONE |
| ~~Remover sufixo "BR" do horário~~    | 10min      | `sync-calendar/route.ts` | ✅ DONE |

### ✨ Features

| Tarefa                    | Estimativa | Descrição                         | Status  |
| ------------------------- | ---------- | --------------------------------- | ------- |
| ~~Double-check sync~~     | 2h         | Validar 2 scrapes antes de salvar | ✅ DONE |
| Admin: Delete week events | 1h         | Botão para limpar semana          | TODO    |

---

## 🟡 P1 - Importante (Este Mês)

### 🐛 Bugs

| Tarefa                    | Estimativa | Arquivo                   | Status |
| ------------------------- | ---------- | ------------------------- | ------ |
| Lint warnings no scraper  | 1h         | `forexScraper.service.ts` | TODO   |
| `weekEnd` unused variable | 10min      | `EconomicCalendar.tsx`    | TODO   |

### ✨ Features

| Tarefa                  | Estimativa | Descrição                    | Status |
| ----------------------- | ---------- | ---------------------------- | ------ |
| Notificação email admin | 3h         | Webhook quando sync divergir | TODO   |
| Export trades CSV       | 2h         | Baixar histórico de trades   | TODO   |
| Filtro por estratégia   | 1h         | Dashboard trades filter      | TODO   |

### 🔧 Refactor

| Tarefa                        | Estimativa | Descrição                  | Status      |
| ----------------------------- | ---------- | -------------------------- | ----------- |
| Migrar `<img>` para `<Image>` | 2h         | Componentes com img nativo | TODO        |
| Unificar combobox             | 1h         | Padrão único AssetCombobox | IN_PROGRESS |

---

## 🟢 P2 - Nice-to-have (Próximo Mês)

### ✨ Features

| Tarefa                 | Estimativa | Descrição                      | Status |
| ---------------------- | ---------- | ------------------------------ | ------ |
| Keyboard shortcuts     | 3h         | Atalhos para ações comuns      | TODO   |
| Print-friendly reports | 4h         | Layout otimizado para PDF      | TODO   |
| Batch delete trades    | 2h         | Selecionar e deletar múltiplos | TODO   |

### 📝 Docs

| Tarefa                    | Estimativa | Descrição                   | Status      |
| ------------------------- | ---------- | --------------------------- | ----------- |
| ~~Documentação completa~~ | 3h         | 12 documentos profissionais | IN_PROGRESS |
| Video walkthrough         | 2h         | Screencast do sistema       | TODO        |
| API Reference             | 4h         | Documentar endpoints        | TODO        |

### 🧪 Tests

| Tarefa                | Estimativa | Descrição         | Status |
| --------------------- | ---------- | ----------------- | ------ |
| Testes E2E Playwright | 8h         | Fluxos críticos   | TODO   |
| Aumentar coverage 70% | 4h         | Mais unit tests   | TODO   |
| Testes de RLS         | 2h         | Validar segurança | TODO   |

---

## 📊 Métricas

| Métrica         | Atual | Meta  |
| --------------- | ----- | ----- |
| Testes passando | 287   | 350   |
| Coverage        | ~60%  | 70%   |
| Lint errors     | 12    | 0     |
| Docs completos  | 6/12  | 12/12 |

---

## 📝 Legenda

| Símbolo     | Significado       |
| ----------- | ----------------- |
| 🐛          | Bug fix           |
| ✨          | Nova feature      |
| 🔧          | Refatoração       |
| 📝          | Documentação      |
| 🧪          | Testes            |
| 🔴          | P0 - Crítico      |
| 🟡          | P1 - Importante   |
| 🟢          | P2 - Nice-to-have |
| ✅ DONE     | Concluído         |
| IN_PROGRESS | Em andamento      |
| TODO        | Pendente          |
| BLOCKED     | Bloqueado         |

---

**Mantido por:** [@TavaresBugs](https://github.com/TavaresBugs)
