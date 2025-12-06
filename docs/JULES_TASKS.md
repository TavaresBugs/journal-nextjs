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
| 10  | Import de Trades (CSV)              | 📋 Pendente  | -         |
| 11  | Export Backup Local                 | 📋 Pendente  | -         |
| 12  | Relatório Excel                     | 📋 Pendente  | -         |
| 13  | Calculadora de Imposto BR           | 📋 Pendente  | -         |
| 14  | Test Plan + Vitest Config           | ✅ Concluída | Jules     |
| 15  | Validação com Zod Schemas           | ✅ Concluída | Jules     |
| 16  | Database Seed Script                | 📋 Pendente  | -         |
| 17  | Centralized Error Handling          | 📋 Pendente  | -         |

---

## ✅ Tasks Concluídas (Histórico)

| Task        | Descrição                           | Arquivos Criados/Modificados                     |
| ----------- | ----------------------------------- | ------------------------------------------------ |
| **TASK 1**  | Reorganizar Componentes Notificação | `src/components/notifications/`                  |
| **TASK 2**  | Migration mentor_reviews            | `supabase/migrations/016_mentor_reviews.sql`     |
| **TASK 3**  | ReviewService CRUD                  | `src/services/reviewService.ts`                  |
| Task        | Descrição                           | Arquivos Criados/Modificados                     |
| ---         | ----------------------------------- | ------------------------------------------------ |
| **TASK 1**  | Reorganizar Componentes Notificação | `src/components/notifications/`                  |
| **TASK 2**  | Migration mentor_reviews            | `supabase/migrations/016_mentor_reviews.sql`     |
| **TASK 3**  | ReviewService CRUD                  | `src/services/reviewService.ts`                  |
| **TASK 4**  | JSDoc em Services                   | Todos os arquivos em `src/services/`             |
| **TASK 5**  | Testes MentorService                | `src/services/__tests__/mentorService.test.ts`   |
| **TASK 6**  | Fix Lint Warnings                   | Vários arquivos (refatoração de tipos)           |
| **TASK 7**  | StudentCalendarModal                | `src/components/mentor/StudentCalendarModal.tsx` |
| **TASK 8**  | Auditoria de Segurança              | `docs/SECURITY_AUDIT.md`, `next.config.ts`       |
| **TASK 9**  | Reorganização de Pastas             | Services, Components, e SQL Docs                 |
| **TASK 14** | Test Plan + Vitest Config           | `docs/TEST_PLAN.md`, `vitest.config.mts`         |
| **TASK 15** | Validação com Zod Schemas           | `src/schemas/`, `package.json`                   |

---

## 🚀 Próximas Tasks (Lista Detalhada)

### 📋 TASK 10: Import de Trades (Excel/CSV)

**Prioridade:** 🔴 Alta | **Tempo estimado:** ~120 min

```markdown
## Contexto

Trading Journal Next.js. O usuário exporta dados do MetaTrader (ou similares) geralmente em .xlsx ou .csv.
A estrutura é complexa: possui cabeçalho de metadados (6 linhas) e múltiplas seções (Positions, Orders, Deals).
Focaremos na seção **"Positions"** (trades completos).

## Objetivo

Criar sistema robusto de importação capaz de ler XLSX/CSV, pular metadados, identificar a tabela correta e mapear colunas duplicadas.

## Bibliotecas

- `npm install xlsx` (SheetJS) - Para ler .xlsx e .csv robustamente.
- `npm install date-fns` - Para parsing de datas customizadas ("yyyy.MM.dd HH:mm:ss").

## Arquivos a Criar

- src/services/importService.ts
- src/components/import/ImportModal.tsx
- src/components/import/ColumnMapper.tsx

## Funcionalidades Chave

### 1. Parser Inteligente (importService.ts)

- **Leitura:** Usar `XLSX.read` com `file.arrayBuffer()`.
- **Navegação:** Identificar a sheet correta (primeira).
- **Header Skip:** O cabeçalho "Positions" está na linha 6 (índice 5). Os dados começam na linha 8.
- **Detecção de Seção:** Buscar a linha que contém apenas `["Positions"]`. A linha seguinte contém os nomes das colunas.
- **Colunas Identificadas:** `Time, Position, Symbol, Type, Volume, Price, S / L, T / P, Time, Price, Commission, Swap, Profit`.
- **Formato de Dados:**
  - Data: "yyyy.MM.dd HH:mm:ss" (ex: "2025.12.05 17:35")
  - Decimal: Ponto (ex: 24597.95)

### 2. Mapeamento Flexível

O arquivo possui colunas duplicadas (`Time`, `Price`). O parser deve renomear para garantir unicidade ANTES de gerar o JSON final:

- `Time` (índice 0) -> `Entry Time`
- `Price` (índice 5) -> `Entry Price`
- `Time` (índice 8) -> `Exit Time`
- `Price` (índice 9) -> `Exit Price`

Interface para o Mapper:
interface ColumnMapping {
entryDate: string; // "Entry Time"
symbol: string; // "Symbol"
direction: string; // "Type"
volume: string; // "Volume"
entryPrice: string; // "Entry Price"
exitDate?: string; // "Exit Time"
exitPrice?: string; // "Exit Price"
profit?: string; // "Profit"
commission?: string; // "Commission" + "Swap"
}

- Converter automaticamente:
  - `buy` -> `long`
  - `sell` -> `short`
  - Remove sufixos do Symbol (ex: "EURUSD.cash" -> "EURUSD").

### 3. ImportModal.tsx UX

1. **Upload Area:** Aceita .csv, .xlsx, .xls.
2. **Preview:** Mostra tabela bruta das 5 primeiras linhas DA SEÇÃO DE DADOS (não do cabeçalho do arquivo).
3. **Mapeamento:** Dropdowns para selecionar qual coluna do Excel corresponde a qual campo do sistema.
   - _Inteligência:_ Tentar auto-selecionar se o nome for parecido ("Profit" -> "profit").
4. **Confirmação:** "Importar 50 trades detectados".

## Critérios de Sucesso

- [ ] Lê arquivo XLSX complexo (com cabeçalho de metadados).
- [ ] Identifica corretamente a seção "Positions".
- [ ] Permite mapear Data Entrada vs Data Saída (colunas com mesmo nome "Time").
- [ ] Salva corretamente no Supabase convertendo tipos (String date -> ISO, String price -> Number).
- [ ] Ignora linhas de rodapé ou totalizadores.
```

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

### 📋 TASK 13: Calculadora de Imposto (Day Trade BR)

**Prioridade:** 🔴 Alta | **Tempo estimado:** ~120 min

```markdown
## Contexto

Trading Journal Next.js. Usuários brasileiros precisam calcular imposto sobre day trade. A legislação é específica e não permite isenção para Day Trade.

## Objetivo

Criar calculadora de IR para day trade seguindo regras estritas da Receita Federal do Brasil.

## Arquivos a Criar

- src/services/taxService.ts
- src/components/tax/TaxCalculatorModal.tsx
- src/components/tax/TaxReport.tsx

## Regras Fiscais (Day Trade Brasil - Lei 11.033/2004)

### 1. Alíquota e Isenção

- **Alíquota:** 20% sobre o LUCRO LÍQUIDO mensal.
- **Isenção:** **NÃO EXISTE** isenção para Day Trade (diferente de Swing Trade que isenta até R$ 20k de vendas/mês).

### 2. Base de Cálculo (Lucro Líquido)

O sistema deve calcular: `Resultado Bruto - Custos Dedutíveis`.

**Custos Dedutíveis permitidos:**

- Taxa de corretagem (fixa/variável por corretora).
- Emolumentos B3 (aprox. 0,030% PF, ou 0,0110%-0,0230% para alto volume).
- Taxa de liquidação (aprox. 0,0125%).
- ISS (sobre corretagem).
- IRRF (Antecipação "Dedo-duro").

### 3. O "Dedo-duro" (IRRF)

- A corretora retém **1%** sobre o lucro positivo de cada operação.
- **Regra:** Este 1% retido deve ser **deduzido** do imposto final a pagar (Calculado 20% - Retido 1%).

### 4. Compensação de Prejuízos

- Prejuízo de Day Trade só compensa com lucro de Day Trade.
- Prejuízos são carregados para os meses seguintes **eternamente** (sem prescrição).
- Compensação é progressiva (Mês atual -> Meses seguintes). Nunca retroativa.

### 5. DARF

- Código da Receita: **6015**
- Vencimento: Último dia útil do mês subsequente ao da apuração.

## Funcionalidades do taxService.ts

interface TaxCalculation {
month: string; // '2024-12'
grossProfit: number; // Resultado bruto das operações
costs: number; // Soma de todas as taxas
netResult: number; // grossProfit - costs
accumulatedLoss: number; // Prejuízo trazido de meses anteriores
taxableBasis: number; // netResult - accumulatedLoss (se > 0)
irrfDeduction: number; // Soma dos 1% retidos
taxDue: number; // (taxableBasis \* 0.20) - irrfDeduction
}

### Funções Requeridas

1. `identifyDayTrades(trades: Trade[]): Trade[]`

   - Critério: Compra e venda do mesmo ativo, na mesma corretora, no mesmo dia.
   - Todo trade deve ter campos de custos: `brokerageFee`, `exchangeFee`, `taxes`.

2. `calculateMonthlyTax(month: Date, trades: Trade[], previousLoss: number): TaxCalculation`

   - Logar alertas se misturar Day Trade com Swing Trade.

3. `generateDARFData(calculation: TaxCalculation): DARFModel`
   - Preparar dados para impressão.

## UI (TaxCalculatorModal)

1. **Input de Custos:** Permitir que o usuário configure taxas padrão ou edite taxas por trade se importou via CSV.
2. **Resumo Mensal:**
   - Lucro Bruto: R$ X
   - (-) Custos: R$ Y
   - (-) Prejuízo Anterior: R$ Z
   - (=) Base de Cálculo: R$ K
   - IR (20%): R$ W
   - (-) IRRF já pago: R$ J
   - **DARF A PAGAR:** R$ FINAL
3. **Alertas:** "Atenção: Day Trade não tem isenção de R$ 20k".

## Critérios de Sucesso

- [ ] Lógica separa estritamente Day Trade de Swing Trade.
- [ ] Deduz custos operacionais corretamente antes de aplicar 20%.
- [ ] Abate o IRRF (1%) do valor final.
- [ ] Carrega prejuízo acumulado para o mês seguinte.
- [ ] Gera valor correto para DARF 6015.
```

---

---

---

### 📋 TASK 16: Database Seed Script (Dados Fake)

**Prioridade:** 🟡 Média | **Tempo estimado:** ~30 min

```markdown
## Contexto

Desenvolver com banco vazio é lento. Precisamos de massa de dados para testar paginação, gráficos e performance.

## Objetivo

Criar script que popule o Supabase (local ou dev) com usuários, trades e diários fictícios.

## Bibliotecas

`npm install -D @faker-js/faker`

## Arquivo

`scripts/seed.ts` (rodar com tsx ou bun)

## Critérios

- [ ] Gerar 5 usuários
- [ ] Gerar 50 trades para cada usuário (win/loss variados)
- [ ] Gerar dados realistas (preços, datas coerentes)
```

---

### 📋 TASK 17: Centralized Error Handling

**Prioridade:** 🟡 Média | **Tempo estimado:** ~30 min

```markdown
## Contexto

Tratamento de erros hoje é ad-hoc (try/catch isolados).

## Objetivo

Padronizar erros para facilitar debugging e UX consistente.

## Arquivos

- src/lib/errors.ts (class AppError)
- src/hooks/useError.ts

## Critérios

- [ ] Classe AppError com statusCode e message
- [ ] Helper function para extrair mensagem segura de erro desconhecido
- [ ] Integração com Toast notification
```
