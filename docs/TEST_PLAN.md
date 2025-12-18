# Test Plan - Trading Journal

Este documento define a estratégia de testes para o projeto Trading Journal Next.js + Supabase.

## Estratégia Geral

### Tipos de Teste

1.  **Unit Tests (Testes Unitários)**
    - **Foco**: Testar funções isoladas, lógica de negócios pura, e componentes UI simples.
    - **Ferramenta**: Vitest
    - **Localização**: Arquivos `*.test.ts` ou `*.test.tsx` dentro de diretórios `__tests__/` próximos ao código fonte.

2.  **Integration Tests (Testes de Integração)**
    - **Foco**: Testar interação entre módulos, services, e componentes mais complexos.
    - **Ferramenta**: Vitest
    - **Mocking**: Mockar chamadas externas (Supabase) quando necessário, mas preferir lógica real onde possível.

3.  **E2E Tests (Testes Ponta-a-Ponta) - Futuro**
    - **Foco**: Fluxos completos de usuário no navegador real.
    - **Ferramenta**: Playwright (planejado para fase futura).

### Ferramentas

- **Runner**: Vitest (compatível com Jest, mas mais rápido para Vite/Next.js).
- **Assertions**: Vitest built-in (Chai based) + `@testing-library/jest-dom`.
- **UI Testing**: `@testing-library/react`.

### Convenções

- Arquivos de teste devem ter sufixo `.test.ts` ou `.test.tsx`.
- Testes devem ser agrupados usando `describe` para o módulo/função e `it` ou `test` para os casos de teste.
- Nomes de testes devem ser descritivos: `it('should calculate PnL correctly for Long trade', ...)`

## Módulos a Testar (Prioridade)

### 🔴 Alta Prioridade - Funções Puras (src/lib/)

Estas funções contêm a lógica core de negócios e não dependem de serviços externos, facilitando testes robustos.

**calculations.ts** (14 funções):

- `calculateTradePnL`: Cálculo de lucro/prejuízo.
- `determineTradeOutcome`: Win, Loss, BreakEven ou Pending.
- `filterTrades`: Filtragem de lista de trades.
- `calculateTradeMetrics`: Métricas agregadas (Win Rate, Profit Factor, etc).
- `groupTradesByDay`: Agrupamento para calendário/gráficos.
- `calculateTradeDuration`: Tempo de duração do trade.
- `formatDuration`: Formatação legível de tempo.
- `formatCurrency`: Formatação monetária.
- `formatPercentage`: Formatação de percentuais.
- `calculateSharpeRatio`: Índice Sharpe.
- `calculateCalmarRatio`: Índice Calmar.
- `calculateAverageHoldTime`: Tempo médio de retenção.
- `calculateConsecutiveStreaks`: Sequências de vitórias/derrotas.
- `formatTimeMinutes`: Formatação de minutos.

**password-validator.ts** (3 funções):

- `validatePassword`: Validação de regras de senha.
- `getStrengthColor`: Cor UI baseada na força.
- `getStrengthLabel`: Label UI baseada na força.

**utils.ts**:

- Funções utilitárias gerais.

**shareUtils.ts**:

- Geradores de URLs e lógica de compartilhamento.

### 🟡 Média Prioridade - Services

Estes módulos interagem com Supabase e requerem mocking apropriado.

- `accountService.ts`
- `tradeService.ts`
- `journalService.ts`

### 🟢 Baixa Prioridade - Componentes UI

Componentes visuais, focando primeiro nos que têm lógica complexa interna.

- `TradeForm`
- `DashboardWidgets`
