# Inventário de Testes - Trading Journal Pro

> Última atualização: 19 de Dezembro de 2025

## 📊 Visão Geral

- **Total de Arquivos de Teste**: ~40 arquivos
- **Total de Testes**: 520+
- **Cobertura Estimada**: ~65%
- **Framework**: Vitest + React Testing Library

---

## 📁 Estrutura Atual (`src/__tests__`)

### 1. Components (`src/__tests__/components`)

| Arquivo                        | Descrição                                                           | Status                   |
| ------------------------------ | ------------------------------------------------------------------- | ------------------------ |
| `ui/LayoutComponents.test.tsx` | Testes para `ModalFooterActions`, `Card`, `Tabs`                    | ✅ Novo                  |
| `ui/VisualComponents.test.tsx` | Testes para `AssetIcon`, `CircularProgress`, `GlassCard`            | ✅ Novo                  |
| `ui/WeekPicker.test.tsx`       | Testes completos para o componente de calendário semanal            | ✅ Novo                  |
| `journal/form/*.test.tsx`      | Testes complexos do formulário de journal (Entry, Analysis, Review) | ⚠️ Falta `act()` cleanup |

### 2. Services (`src/__tests__/services`)

| Arquivo                        | Descrição                                      | Status          |
| ------------------------------ | ---------------------------------------------- | --------------- |
| `admin/migration.test.ts`      | Migração LocalStorage -> Supabase              | ✅ 100% Coberto |
| `journal/review.test.ts`       | CRUD e lógica de reviews                       | ✅ 100% Coberto |
| `journal/routine.test.ts`      | CRUD de rotinas diárias                        | ✅ 100% Coberto |
| `mentor/inviteService.test.ts` | Convites de mentoria                           | ✅ Estável      |
| `import*.test.ts`              | Parsers (NinjaTrader, Tradovate, CSV genérico) | ✅ Estável      |
| `exportService.test.ts`        | Exportação de dados                            | ✅ Estável      |

### 3. Lib & Utils (`src/__tests__/lib`)

| Arquivo                          | Descrição                                 | Status         |
| -------------------------------- | ----------------------------------------- | -------------- |
| `utils/imageCompression.test.ts` | Compressão e redimensionamento de imagens | ✅ 72% Coberto |
| `hooks/useImageUpload.test.ts`   | Hook de upload com compressão             | ✅ Novo        |
| `playbook.test.ts`               | Serviço de compartilhamento de playbooks  | ✅ Novo        |
| `calculations.test.ts`           | Cálculos financeiros (PnL, Risco)         | ✅ Estável     |
| `errorHandler.test.ts`           | Sistema central de erros                  | ✅ Estável     |
| `timeframeUtils.test.ts`         | Manipulação de datas e timeframes         | ✅ Estável     |

### 4. Hooks (`src/__tests__/hooks`)

| Arquivo                  | Descrição                                | Status     |
| ------------------------ | ---------------------------------------- | ---------- |
| `HooksAndUtils.test.tsx` | `useBlockBodyScroll`, `IconActionButton` | ✅ Novo    |
| `useImageCache.test.ts`  | Cacheamento de imagens                   | ✅ Estável |

---

## 🔍 Lacunas Identificadas (Gap Analysis)

### Arquivos com Baixa/Nenhuma Cobertura

1. **Components Base**:
   - `src/components/ui/Input.tsx` (Cobertura parcial via indireta)
   - `src/components/ui/Select.tsx` (Pouco testado isoladamente)
   - `src/components/ui/Modal.tsx` (Testado indiretamente nos forms)
2. **Services**:
   - `src/services/journal/journal.ts`: Cobertura de ~53%. Precisa de mais casos de borda.
   - `src/services/trades/trade.ts`: ~70-80%, mas pode melhorar nos filtros complexos.

3. **Hooks Complexos**:
   - ~~`useDashboardData`: Crítico para a UX, cobertura incerta.~~ ✅ (Coberto em `useDashboardData.test.tsx`)
   - ~~`useTradeForm`: Validação complexa, precisa de suite dedicada.~~ ✅ (Substituído por `useJournalForm` e coberto em `useJournalForm.test.tsx`)

---

## 🛠️ Padrões e Fixtures

### Padrões Observados

- **AAA (Arrange-Act-Assert)**: Seguido na maioria dos arquivos novos.
- **Mocks**: Uso extensivo de `vi.mock` para Supabase e módulos externos.
- **Factories**: ✅ Sistema central implementado em `src/lib/tests/utils/factories.ts`.

### Necessidades de Refatoração (Fase 2)

- [x] Criar `src/__tests__/fixtures/` para centralizar dados de fake trades/users. ✅ (Feito em `src/lib/tests/fixtures/`)
- [x] Criar `src/__tests__/utils/supabaseMock.ts` reutilizável em vez de repetir `vi.mock('@/lib/supabase/supabase', ...)` em todo arquivo. ✅ (Abstraído em `mockBuilders.ts`)
