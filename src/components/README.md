# 🧩 Components

Componentes React reutilizáveis do **Trading Journal Pro**.

## 📁 Estrutura

```
components/
├── ui/               # Design System (28 componentes base)
├── accessibility/    # Skip links, focus management
├── accounts/         # Gestão de contas de trading
├── admin/            # Painel administrativo
├── charts/           # Gráficos e visualizações (Recharts)
├── checklist/        # Checklists pre-trade
├── dashboard/        # Componentes do dashboard principal
├── import/           # Importação de trades
├── journal/          # Diário de trading (17 componentes)
├── laboratory/       # Recaps e análises
├── layout/           # Layouts de página
├── mental/           # Controle emocional
├── mentor/           # Sistema de mentoria
├── news/             # Calendário econômico
├── notifications/    # Sistema de notificações
├── playbook/         # Playbooks de trading (10 componentes)
├── reports/          # Relatórios e exports
├── settings/         # Configurações do usuário
├── shared/           # Componentes compartilhados
├── skeletons/        # Loading states
├── tax/              # Relatórios fiscais
└── trades/           # Formulário e listagem de trades (24 componentes)
```

## 🎨 Design System (`ui/`)

O Design System contém **28 componentes base** reutilizáveis:

### Componentes Principais

| Componente  | Descrição                      |
| ----------- | ------------------------------ |
| `Button`    | Botões com múltiplas variantes |
| `Input`     | Campos de texto com validação  |
| `Select`    | Seletores customizados (Radix) |
| `Modal`     | Diálogos modais                |
| `GlassCard` | Cards com efeito glassmorphism |
| `Table`     | Tabelas de dados responsivas   |
| `Toast`     | Notificações toast             |
| `Tabs`      | Navegação por abas             |

### Importação

```typescript
// ✅ Import limpo via barrel file
import { Button, Input, Modal, GlassCard } from "@/components/ui";

// ❌ Evite imports diretos
import { Button } from "@/components/ui/Button";
```

## 📐 Padrões

### Interface de Props

```typescript
interface ComponentProps {
  /** Variante visual */
  variant?: "primary" | "secondary" | "ghost";
  /** Tamanho do componente */
  size?: "sm" | "md" | "lg";
  /** Estado desabilitado */
  disabled?: boolean;
  /** Classes CSS adicionais */
  className?: string;
  /** Filhos do componente */
  children?: React.ReactNode;
}
```

### Estrutura de Componente

```typescript
// components/example/ExampleComponent.tsx
"use client";

import React, { useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ExampleComponentProps {
  title: string;
  onAction?: () => void;
}

export function ExampleComponent({ title, onAction }: ExampleComponentProps) {
  const handleClick = useCallback(() => {
    onAction?.();
  }, [onAction]);

  return (
    <div className="p-4">
      <h2>{title}</h2>
      <button onClick={handleClick}>Action</button>
    </div>
  );
}
```

### Performance com React.memo

```typescript
// Componentes puros devem usar React.memo
export const TradeRow = React.memo(function TradeRow({
  trade,
  onEdit
}: TradeRowProps) {
  // Renderiza apenas quando props mudam
  return <div>...</div>;
});
```

### Memoização de Handlers

```typescript
// ✅ Handlers memoizados para evitar re-renders
const handleSubmit = useCallback(async () => {
  await saveData();
}, [saveData]);

// ✅ Valores computados memoizados
const filteredItems = useMemo(() => {
  return items.filter((item) => item.active);
}, [items]);
```

## 🗂️ Componentes por Domínio

### `trades/` (24 componentes)

Formulários e visualização de trades:

- `TradeForm.tsx` - Formulário principal
- `TradeList.tsx` - Listagem de trades
- Seções: `TradeFinancialDataSection`, `TradeMarketConditionsSection`

### `journal/` (17 componentes)

Diário de trading:

- `JournalEntryForm.tsx` - Formulário de entrada
- `JournalViewer.tsx` - Visualização
- Sub-componentes: `EntryHeader`, `TradeLinker`, `JournalAnalysis`

### `playbook/` (10 componentes)

Playbooks e regras:

- `PlaybookFormModal.tsx` - Criação/edição
- `PlaybookCard.tsx` - Card de visualização
- Regras com drag-and-drop (dnd-kit)

### `charts/` (13 componentes)

Visualizações de dados:

- Performance charts (Recharts)
- Equity curve
- Distribution charts

## ✅ Boas Práticas

1. **Componentes pequenos e focados** - Single Responsibility
2. **Props tipadas com TypeScript** - Interfaces claras
3. **Memoização quando necessário** - `useCallback`, `useMemo`, `React.memo`
4. **Composição sobre herança** - Favorece composição de componentes
5. **Barrel exports** - Um `index.ts` por pasta

## 🔗 Referências

- [DESIGN_SYSTEM.md](../../docs/DESIGN_SYSTEM.md)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [Recharts](https://recharts.org/)
