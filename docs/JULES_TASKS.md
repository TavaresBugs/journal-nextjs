# 🤖 Jules Tasks - Trading Journal Pro

> Prompts prontos para ocupar o Jules enquanto você trabalha em outras coisas.
> Copie e cole diretamente no Jules.

---

## 📊 Status Geral

| #   | Task                                | Status       | Feito por |
| --- | ----------------------------------- | ------------ | --------- |
| 1   | Reorganizar Componentes Notificação | ✅ Concluída | Jules     |
| 2   | Migration mentor_reviews            | ✅ Concluída | Jules     |
| 3   | ReviewService CRUD                  | ✅ Concluída | Jules     |
| 4   | JSDoc em Services                   | ✅ Concluída | Jules     |
| 5   | Testes MentorService                | 📋 Pendente  | -         |
| 6   | Fix Lint Warnings                   | 📋 Pendente  | -         |
| 7   | StudentCalendarModal                | 📋 Pendente  | -         |
| 8   | Auditoria de Segurança              | 📋 Pendente  | -         |
| 9   | Reorganização de Pastas             | 📋 Pendente  | -         |
| 10  | Import de Trades (CSV)              | 📋 Pendente  | -         |
| 11  | Export Backup Local                 | 📋 Pendente  | -         |
| 12  | Relatório Excel                     | 📋 Pendente  | -         |
| 13  | Calculadora de Imposto BR           | 📋 Pendente  | -         |
| 14  | Test Plan + Vitest Config           | 📋 Pendente  | -         |

---

## ✅ TASK 1: Reorganizar Componentes de Notificação [CONCLUÍDA]

**Status:** ✅ Concluída via PR #4 | **Feito por:** Jules

- [x] Componentes movidos para `src/components/notifications/`
- [x] Barrel exports criados
- [x] Imports atualizados
- [x] Build passando

---

## ✅ TASK 2: Migration mentor_reviews [CONCLUÍDA]

**Status:** ✅ Concluída via PR | **Feito por:** Jules

- [x] Tabela `mentor_reviews` criada
- [x] CHECK constraints para `review_type` e `rating`
- [x] 4 índices criados
- [x] RLS policies implementadas
- [x] GRANTS e documentação

**Arquivo:** `supabase/migrations/016_mentor_reviews.sql`

---

## ✅ TASK 3: Criar Service para Reviews do Mentor [CONCLUÍDA]

**Status:** ✅ Concluída via PR | **Feito por:** Jules

- [x] Arquivo criado em `src/services/reviewService.ts`
- [x] Interface `MentorReview` definida
- [x] Funções do Mentor: `createReview`, `updateReview`, `deleteReview`, `getReviewsForMentee`
- [x] Funções do Mentee: `getMyReviews`, `getReviewsForTrade`, `markReviewAsRead`, `getUnreadReviewCount`
- [x] Mapeamento DB (snake_case) → TS (camelCase)
- [x] TypeScript sem erros

```markdown
## Contexto

Trading Journal Next.js + Supabase. Precisamos de um service para CRUD de correções/comentários.

## Objetivo

Criar `src/services/reviewService.ts` seguindo o padrão dos services existentes.

## Arquivos de Referência

- `src/services/mentorService.ts` (mesmo padrão de código)
- `src/services/journalService.ts` (exemplo de CRUD)

## Funções Necessárias

### Tipos

interface MentorReview {
id: string;
mentorId: string;
menteeId: string;
tradeId?: string;
journalEntryId?: string;
reviewType: 'correction' | 'comment' | 'suggestion';
content: string;
rating?: number;
isRead: boolean;
createdAt: string;
updatedAt: string;
}

### Funções do Mentor

- createReview(data): Promise<MentorReview | null>
- updateReview(id, content): Promise<boolean>
- deleteReview(id): Promise<boolean>
- getReviewsForMentee(menteeId): Promise<MentorReview[]>

### Funções do Mentee

- getMyReviews(): Promise<MentorReview[]>
- getReviewsForTrade(tradeId): Promise<MentorReview[]>
- markReviewAsRead(id): Promise<boolean>
- getUnreadReviewCount(): Promise<number>

## Padrões a Seguir

- Usar snake_case para campos do DB, camelCase para TypeScript
- Funções de mapeamento DB -> TS
- Tratamento de erros com console.error
- Usar supabase.auth.getUser() para autenticação

## Critérios de Sucesso

- [ ] Arquivo criado em src/services/reviewService.ts
- [ ] Todos os tipos definidos
- [ ] Todas as funções implementadas
- [ ] TypeScript sem erros
```

---

## ✅ TASK 4: Adicionar JSDoc em Todos os Services [CONCLUÍDA]

**Status:** ✅ Concluída via PR | **Feito por:** Jules

- [x] `accountService.ts` documentado
- [x] `adminService.ts` documentado
- [x] `communityService.ts` documentado
- [x] `journalService.ts` documentado
- [x] `mentorService.ts` documentado
- [x] `routineService.ts` documentado
- [x] `tradeService.ts` documentado
- [x] Todas as funções exportadas com JSDoc
- [x] Build passando

**Prioridade:** 🟡 Média | **Tempo estimado:** ~25 min

```markdown
## Contexto

Trading Journal Next.js. Os services precisam de documentação JSDoc.

## Objetivo

Adicionar JSDoc completo para todas as funções exportadas em src/services/

## Arquivos para Documentar

- src/services/accountService.ts
- src/services/adminService.ts
- src/services/communityService.ts
- src/services/journalService.ts
- src/services/mentorService.ts
- src/services/routineService.ts
- src/services/tradeService.ts

## Formato JSDoc

/\*\*

- Descrição breve da função
- @param {tipo} nomeParam - Descrição do parâmetro
- @returns {Promise<tipo>} Descrição do retorno
- @example
- const result = await nomeFuncao(param);
  \*/

## Critérios de Sucesso

- [ ] Todas as funções exportadas documentadas
- [ ] Parâmetros e retornos descritos
- [ ] TypeScript sem erros
```

---

## 📋 TASK 5: Criar Testes Unitários para MentorService

**Prioridade:** 🟡 Média | **Tempo estimado:** ~45 min

```markdown
## Contexto

Trading Journal Next.js + Supabase. Precisamos de testes para garantir qualidade.

## Objetivo

Criar testes unitários com Vitest para src/services/mentorService.ts

## Arquivo a Criar

src/services/**tests**/mentorService.test.ts

## Funções para Testar

- sendMentorInvite
- getReceivedInvites
- getSentInvites
- acceptInvite
- rejectInvite
- cancelInvite
- revokeMentorship
- getMentees
- getMentors

## Casos de Teste

Para cada função:

1. Caso de sucesso
2. Caso de usuário não autenticado
3. Caso de erro do Supabase

## Critérios de Sucesso

- [ ] Arquivo de teste criado
- [ ] Mocks configurados
- [ ] Testes para todas as funções
- [ ] Testes passando
```

---

## 📋 TASK 6: Fix Lint Warnings

**Prioridade:** 🟢 Baixa | **Tempo estimado:** ~20 min

```markdown
## Contexto

Trading Journal Next.js. Existem alguns warnings de lint.

## Objetivo

Corrigir TODOS os warnings de lint sem quebrar funcionalidade.

## Comando

npm run lint

## Warnings Conhecidos

### src/app/admin/page.tsx

1. Linhas 124, 303, 354: Usando <img> ao invés de next/image
2. Linhas 419, 424: setState dentro de useEffect

## Tipos Comuns de Fixes

1. Variáveis não utilizadas - remover ou prefixar com \_
2. Imports não utilizados - remover
3. <img> → <Image /> - usar next/image
4. setState em useEffect - refatorar

## Regras

- NÃO usar eslint-disable comments
- NÃO mudar lógica de negócio
- APENAS corrigir warnings

## Critérios de Sucesso

- [ ] npm run lint passa sem warnings
- [ ] npm run build passa
```

---

## 📋 TASK 7: Criar Componente StudentCalendarModal

**Prioridade:** 🔴 Alta | **Tempo estimado:** ~40 min

```markdown
## Contexto

Trading Journal com sistema de mentoria. O mentor precisa visualizar o calendário do aluno.

## Objetivo

Criar componente StudentCalendarModal.

## Arquivo a Criar

src/components/mentor/StudentCalendarModal.tsx

## Props

interface StudentCalendarModalProps {
isOpen: boolean;
onClose: () => void;
menteeId: string;
menteeName: string;
}

## Referência de Design

Copiar estilo de: src/components/journal/DayDetailModal.tsx
Usar componente Modal de: src/components/ui/Modal.tsx

## Funcionalidades

1. Header com nome do aluno e botão fechar
2. Navegação de mês (< Dezembro 2024 >)
3. Grid de calendário (Dom-Sáb)
4. Cada dia mostra cor verde/vermelho baseado em P/L

## Critérios de Sucesso

- [ ] Componente criado
- [ ] Responsivo (mobile-first)
- [ ] Mesma estética do projeto
- [ ] TypeScript sem erros
```

---

## 📋 TASK 8: Auditoria de Segurança de URLs e Headers

**Prioridade:** 🔴 Alta | **Tempo estimado:** ~30 min

```markdown
## Contexto

Trading Journal Next.js 15 + Supabase. Verificar exposição de dados em URLs.

## Objetivo

Auditar e corrigir potenciais vulnerabilidades.

## Arquivos para Analisar

- src/middleware.ts
- src/app/dashboard/[accountId]/page.tsx
- src/app/share/[token]/page.tsx
- next.config.ts

## Verificações

1. IDs na URL são UUIDs (não sequenciais)
2. Mensagens de erro não expõem lógica interna
3. Headers de segurança configurados (HSTS, X-Frame-Options, etc)
4. Supabase ANON_KEY usada (não SERVICE_ROLE)

## Critérios de Sucesso

- [ ] Nenhum ID sequencial exposto
- [ ] Headers de segurança configurados
- [ ] Relatório criado em docs/SECURITY_AUDIT.md
```

---

## 📋 TASK 9: Reorganização de Pastas e Documentação

**Prioridade:** 🟡 Média | **Tempo estimado:** ~45 min

```markdown
## Contexto

Trading Journal Next.js. A estrutura de pastas precisa de organização para escalar.

## Objetivo

Reorganizar components, services, e documentar migrations.

## PARTE 1: Components

- Mover ClientProviders.tsx para src/components/layout/
- Criar pasta src/components/mentor/

## PARTE 2: Services

- Dividir communityService.ts (19KB) em:
  - src/services/community/playbookService.ts
  - src/services/community/leaderboardService.ts
- Mover mentorService.ts para src/services/mentor/inviteService.ts

## PARTE 3: Organizar SQL

Criar pasta supabase/sql/ organizada por domínio:

- core/ (000, 001)
- features/ (002, 003, 010)
- admin/ (004)
- mentor/ (005, 012, 016)
- community/ (006, 009, 011)
- fixes/ (007, 008, 013, 014, 015)

IMPORTANTE: NÃO alterar supabase/migrations/ - apenas criar cópias organizadas

## Critérios de Sucesso

- [ ] ClientProviders movido para layout/
- [ ] communityService dividido
- [ ] Pasta supabase/sql/ criada
- [ ] Build passa
```

---

## 📋 TASK 10: Import de Trades via CSV

**Prioridade:** 🔴 Alta | **Tempo estimado:** ~60 min

```markdown
## Contexto

Trading Journal Next.js + Supabase. Usuários querem importar trades de outras plataformas.

## Objetivo

Criar sistema de importação de trades via arquivo CSV.

## Arquivos a Criar

- src/services/importService.ts
- src/components/import/ImportModal.tsx
- src/components/import/ColumnMapper.tsx

## Bibliotecas

- papaparse (já popular, bem documentado)

## Funcionalidades

### importService.ts

- parseCSV(file: File): Promise<RawRow[]>
- validateTrades(rows: RawRow[], mapping: ColumnMapping): ValidationResult
- importTrades(trades: Trade[]): Promise<ImportResult>

### ImportModal.tsx

1. Upload de arquivo CSV
2. Preview das primeiras 5 linhas
3. Mapeamento de colunas (qual coluna = qual campo)
4. Botão "Importar" com confirmação
5. Resultado: X trades importados, Y erros

### Mapeamento de Colunas

Campos obrigatórios:

- Data/Hora entrada
- Ativo (symbol)
- Direção (long/short)
- Preço entrada
- Quantidade

Campos opcionais:

- Data/Hora saída
- Preço saída
- Stop Loss
- Take Profit
- Resultado (P/L)

## Critérios de Sucesso

- [ ] Parser CSV funcionando
- [ ] Modal de mapeamento intuitivo
- [ ] Validação antes de importar
- [ ] Trades importados corretamente no Supabase
- [ ] Tratamento de erros (linhas inválidas)
```

---

## 📋 TASK 11: Export Backup Local (Download)

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

## 📋 TASK 12: Relatório Excel

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

## 📋 TASK 13: Calculadora de Imposto (Day Trade BR)

**Prioridade:** 🔴 Alta | **Tempo estimado:** ~90 min

```markdown
## Contexto

Trading Journal Next.js. Usuários brasileiros precisam calcular imposto sobre day trade.

## Objetivo

Criar calculadora de IR para day trade seguindo regras da Receita Federal.

## Arquivos a Criar

- src/services/taxService.ts
- src/components/tax/TaxCalculatorModal.tsx
- src/components/tax/TaxReport.tsx

## Regras Fiscais (Day Trade Brasil)

### Alíquota

- Day Trade: 20% sobre lucro líquido
- Swing Trade: 15% sobre lucro (isenção se vendas < R$20k/mês)

### Compensação de Prejuízo

- Prejuízos podem ser compensados em meses futuros
- Day trade compensa só com day trade
- Swing trade compensa só com swing trade

### DARF

- Código 6015 (Day Trade)
- Vencimento: último dia útil do mês seguinte

## Funções do taxService.ts

interface TaxCalculation {
month: string;
grossProfit: number;
previousLosses: number;
taxableProfit: number;
taxDue: number; // 20%
darfCode: string;
dueDate: string;
}

- calculateMonthlyTax(month: Date): Promise<TaxCalculation>
- getAccumulatedLosses(): Promise<number>
- generateDARFReport(month: Date): Promise<DARFReport>

## UI

### TaxCalculatorModal.tsx

1. Seletor de mês
2. Resumo: Lucro bruto, Prejuízo acumulado, Base de cálculo, IR devido
3. Botão "Gerar Relatório"

### TaxReport.tsx

- Relatório mensal formatado
- Informações para preencher DARF
- Opção de imprimir/PDF

## Critérios de Sucesso

- [ ] Cálculo correto de 20% sobre lucro
- [ ] Compensação de prejuízos funcionando
- [ ] Separação Day Trade vs Swing Trade
- [ ] Relatório com dados para DARF
- [ ] UI intuitiva
```

---

## 🚀 Ordem Sugerida de Execução

### ✅ Concluídas

1. ✅ **TASK 1** - Reorganizar componentes
2. ✅ **TASK 2** - Migration SQL
3. ✅ **TASK 3** - ReviewService
4. ✅ **TASK 4** - JSDoc em Services

### 🔴 Alta Prioridade (Features de Valor)

5. 📋 **TASK 11** - Export Backup Local (rápido, útil)
6. 📋 **TASK 10** - Import CSV (muito pedido)
7. 📋 **TASK 12** - Relatório Excel (profissional)
8. 📋 **TASK 13** - Calculadora IR (diferencial)

### 🟡 Média Prioridade (Mentor System)

9. 📋 **TASK 7** - StudentCalendarModal

### 🟢 Baixa Prioridade (Manutenção)

10. 📋 **TASK 14** - Test Plan + Vitest Config ⭐ NEW
11. 📋 **TASK 9** - Reorganização de pastas
12. 📋 **TASK 5** - Testes MentorService
13. 📋 **TASK 6** - Lint fixes
14. 📋 **TASK 8** - Segurança

---

## 📋 TASK 14: Criar Test Plan e Configurar Framework de Testes

**Prioridade:** 🟡 Média | **Tempo estimado:** ~60 min

```markdown
## Contexto

Trading Journal Next.js + Supabase. O projeto atualmente não tem nenhum teste automatizado.
Precisamos de uma estratégia de testes e configuração inicial.

## Objetivo

1. Criar documento docs/TEST_PLAN.md com estratégia de testes
2. Configurar Vitest no projeto
3. Criar testes unitários de exemplo para funções puras

## PARTE 1: Criar docs/TEST_PLAN.md

Documento deve incluir:

### Estratégia Geral

- Tipos de teste: Unit, Integration, E2E
- Ferramentas: Vitest (unit), futuro Playwright (E2E)
- Convenções: \*.test.ts, **tests**/, describe/it

### Módulos a Testar (Prioridade)

#### 🔴 Alta Prioridade - Funções Puras (src/lib/)

**calculations.ts** (18 funções):

- calculateTradePnL(trade, multiplier)
- determineTradeOutcome(trade)
- filterTrades(trades, filters)
- calculateTradeMetrics(trades)
- groupTradesByDay(trades)
- calculateTradeDuration(trade)
- formatDuration(minutes)
- formatCurrency(value, currency)
- formatPercentage(value, decimals)
- calculateSharpeRatio(trades, riskFreeRate)
- calculateCalmarRatio(trades, initialBalance, periodDays)
- calculateMaxDrawdownDecimal(trades, initialBalance)
- calculateAverageHoldTime(trades)
- calculateConsecutiveStreaks(trades)
- formatTimeMinutes(minutes)

**password-validator.ts** (3 funções):

- validatePassword(password) - retorna isValid, errors, strength, score
- getStrengthColor(strength)
- getStrengthLabel(strength)

**utils.ts** (3 funções):

- cn(...inputs) - merge tailwind classes
- getErrorMessage(error) - extract error message
- base64ToBlob(base64) - convert base64 to blob

**shareUtils.ts** (2 funções - mock Supabase):

- createShareLink(journalEntryId)
- copyToClipboard(text)

#### 🟡 Média Prioridade - Services (src/services/)

Precisam de mocks do Supabase:

- accountService.ts: getCurrentUserId, mapAccountFromDB, mapAccountToDB, getAccounts, getAccount, saveAccount, deleteAccount, getSettings, saveSettings
- tradeService.ts: mapTradeFromDB, mapTradeToDB, getTrades, saveTrade, deleteTrade
- journalService.ts: mapJournalFromDB, mapJournalToDB, CRUD operations
- mentorService.ts: isMentor, inviteMentee, acceptInvite, rejectInvite, getMentors, getMentees
- reviewService.ts: createReview, updateReview, deleteReview, getReviews
- routineService.ts: getRoutine, saveRoutine, completeRoutineItem
- communityService.ts: getLeaderboard, getPlaybooks, createPlaybook
- adminService.ts: getUsers, updateUserRole, getStats

#### 🟢 Baixa Prioridade - Hooks (src/hooks/)

Precisam de testing-library/react-hooks:

- useAuth.ts
- useDayStats.ts
- useImageUpload.ts
- useJournalForm.ts

## PARTE 2: Configurar Vitest

### Instalar dependências

npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom

### Criar vitest.config.ts

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
plugins: [react()],
test: {
environment: 'jsdom',
globals: true,
setupFiles: ['./src/test/setup.ts'],
include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
coverage: {
provider: 'v8',
reporter: ['text', 'html'],
},
},
resolve: {
alias: {
'@': path.resolve(\_\_dirname, './src'),
},
},
});

### Criar src/test/setup.ts

import '@testing-library/jest-dom';

### Adicionar scripts no package.json

"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest run --coverage"

## PARTE 3: Criar Testes de Exemplo

### src/lib/**tests**/calculations.test.ts

Testar funções puras de calculations.ts com casos:

- calculateTradePnL: trade win, trade loss, zero
- formatCurrency: USD, BRL, valores negativos
- formatPercentage: decimais variados
- formatDuration: minutos, horas, dias
- calculateTradeMetrics: array vazio, 1 trade, múltiplos trades

### src/lib/**tests**/password-validator.test.ts

Testar validatePassword com:

- Senha muito curta (< 8 chars)
- Sem maiúscula
- Sem número
- Sem caractere especial
- Senha válida fraca, média, forte

## Critérios de Sucesso

- [ ] docs/TEST_PLAN.md criado com estratégia completa
- [ ] vitest.config.ts configurado
- [ ] Dependências instaladas
- [ ] Scripts de teste no package.json
- [ ] Pelo menos 10 testes passando para calculations.ts
- [ ] Pelo menos 5 testes passando para password-validator.ts
- [ ] npm run test passa sem erros
```

---

**Dica:** Copie uma task por vez. Espere o PR, revise, merge, e então envie a próxima!
