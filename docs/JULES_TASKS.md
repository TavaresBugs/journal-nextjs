# 🤖 Jules Tasks - Trading Journal Pro

## 💡 Como Usar (Dicas e Tutoriais)

> **Dica Principal:** Copie uma task por vez. Espere o PR, revise, merge, e então envie a próxima!

1. **Escolha uma Task:** Veja a tabela de Status Geral abaixo.
2. **Copie o Contexto:** Copie o bloco de texto da task (começa com `## Contexto` e vai até `## Critérios de Sucesso`) e cole no chat para o Jules.
3. **Revise:** O Jules vai executar a task. Valide o resultado.
4. **Atualize:** Marque como Concluída aqui neste arquivo.

---

## 📊 Status Geral

| #   | Task                                | Status       | Feito por |
| --- | ----------------------------------- | ------------ | --------- |
| 1   | Reorganizar Componentes Notificação | ✅ Concluída | Jules     |
| 2   | Migration mentor_reviews            | ✅ Concluída | Jules     |
| 3   | ReviewService CRUD                  | ✅ Concluída | Jules     |
| 4   | JSDoc em Services                   | ✅ Concluída | Jules     |
| 5   | Testes MentorService                | ✅ Concluída | Jules     |
| 6   | Fix Lint Warnings                   | ✅ Concluída | Jules     |
| 7   | StudentCalendarModal                | ✅ Concluída | Jules     |
| 8   | Auditoria de Segurança              | ✅ Concluída | Jules     |
| 9   | Reorganização de Pastas             | ✅ Concluída | Jules     |
| 10  | Import de Trades (CSV)              | ✅ Concluída | Jules     |
| 11  | Export Backup Local                 | 📋 Pendente  | -         |
| 12  | Relatório Excel                     | 📋 Pendente  | -         |
| 13  | Calculadora de Imposto BR           | ✅ Concluída | Jules     |
| 14  | Test Plan + Vitest Config           | ✅ Concluída | Jules     |
| 15  | Validação com Zod Schemas           | ✅ Concluída | Jules     |
| 16  | Database Seed Script                | ✅ Concluída | Jules     |
| 17  | Centralized Error Handling          | ✅ Concluída | Jules     |

---

## ✅ Tasks Concluídas (Histórico)

| Task        | Descrição                           | Arquivos Criados/Modificados                               |
| ----------- | ----------------------------------- | ---------------------------------------------------------- |
| **TASK 1**  | Reorganizar Componentes Notificação | `src/components/notifications/`                            |
| **TASK 2**  | Migration mentor_reviews            | `supabase/migrations/016_mentor_reviews.sql`               |
| **TASK 3**  | ReviewService CRUD                  | `src/services/reviewService.ts`                            |
| Task        | Descrição                           | Arquivos Criados/Modificados                               |
| ---         | ----------------------------------- | ------------------------------------------------           |
| **TASK 1**  | Reorganizar Componentes Notificação | `src/components/notifications/`                            |
| **TASK 2**  | Migration mentor_reviews            | `supabase/migrations/016_mentor_reviews.sql`               |
| **TASK 3**  | ReviewService CRUD                  | `src/services/reviewService.ts`                            |
| **TASK 4**  | JSDoc em Services                   | Todos os arquivos em `src/services/`                       |
| **TASK 5**  | Testes MentorService                | `src/services/__tests__/mentorService.test.ts`             |
| **TASK 6**  | Fix Lint Warnings                   | Vários arquivos (refatoração de tipos)                     |
| **TASK 7**  | StudentCalendarModal                | `src/components/mentor/StudentCalendarModal.tsx`           |
| **TASK 8**  | Auditoria de Segurança              | `docs/SECURITY_AUDIT.md`, `next.config.ts`                 |
| **TASK 9**  | Reorganização de Pastas             | Services, Components, e SQL Docs                           |
| **TASK 14** | Test Plan + Vitest Config           | `docs/TEST_PLAN.md`, `vitest.config.mts`                   |
| **TASK 15** | Validação com Zod Schemas           | `src/schemas/`, `package.json`                             |
| **TASK 16** | Database Seed Script                | `scripts/seed.ts`, `package.json`                          |
| **TASK 17** | Centralized Error Handling          | `src/lib/errors.ts`, `src/hooks/useError.ts`               |
| **TASK 13** | Calculadora de Imposto BR           | `src/services/taxService.ts`, `src/components/tax/*`       |
| **TASK 10** | Import de Trades (CSV)              | `src/services/importService.ts`, `src/components/import/*` |

---

## 🚀 Próximas Tasks (Lista Detalhada)

---

### 📋 TASK 11: Export Backup Local (Download)

**Prioridade:** 🟡 Média | **Tempo estimado:** ~30 min

```markdown
## Contexto

Trading Journal Next.js. Usuários querem baixar backup local dos dados.

## Objetivo

Criar botão para download de backup completo em JSON.

## Arquivo a Criar

- src/services/exportService.ts

## Funções

### exportService.ts

- exportAllData(): Promise<ExportData>
- downloadAsJSON(data: ExportData): void
- downloadAsZIP(data: ExportData): void // opcional

### Dados a Exportar

interface ExportData {
exportedAt: string;
version: string;
accounts: Account[];
trades: Trade[];
journalEntries: JournalEntry[];
playbooks: Playbook[];
routines: Routine[];
settings: UserSettings;
}

## Integração

Adicionar botão "📥 Baixar Backup" no SettingsModal.tsx
Nomear arquivo: journal_backup_2024-12-05.json

## Critérios de Sucesso

- [ ] Função exportAllData busca todos os dados do usuário
- [ ] Download funciona em todos os browsers
- [ ] Arquivo JSON válido e legível
- [ ] Nome do arquivo inclui data
```

---

### 📋 TASK 12: Relatório Excel

**Prioridade:** 🟡 Média | **Tempo estimado:** ~45 min

```markdown
## Contexto

Trading Journal Next.js. Usuários querem exportar relatórios para Excel.

## Objetivo

Gerar arquivo .xlsx com múltiplas sheets formatadas.

## Arquivo a Criar

- src/services/reportService.ts

## Biblioteca

- exceljs (melhor formatação) ou xlsx (mais leve)

## Estrutura do Excel

### Sheet 1: Resumo

- Período do relatório
- Total de trades
- Win Rate
- Profit Factor
- Lucro/Prejuízo Total
- Melhor trade
- Pior trade

### Sheet 2: Trades

- Tabela com todos os trades
- Colunas: Data, Ativo, Direção, Entrada, Saída, Resultado, %
- Formatação condicional: verde (lucro), vermelho (prejuízo)

### Sheet 3: Mensal

- Resumo por mês
- Colunas: Mês, Trades, Wins, Losses, P/L, Win Rate

## Funções

- generateReport(startDate, endDate): Promise<Blob>
- downloadExcel(blob, filename): void

## Critérios de Sucesso

- [ ] Excel gerado com 3 sheets
- [ ] Formatação profissional
- [ ] Cores condicionais funcionando
- [ ] Download funciona
```

---

---

---

---
