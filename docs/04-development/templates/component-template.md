# 🧩 Template: Novo Componente

Use este template para criar componentes React padronizados.

---

## Estrutura do Arquivo

```tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils/general";

// ============================================
// TYPES
// ============================================

interface MyComponentProps {
  /** Valor atual */
  value: string;
  /** Callback quando valor muda */
  onChange: (value: string) => void;
  /** Classes CSS adicionais */
  className?: string;
  /** Desabilitar interação */
  disabled?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function MyComponent({ value, onChange, className, disabled = false }: MyComponentProps) {
  // 1. State local
  const [isOpen, setIsOpen] = useState(false);

  // 2. Handlers memoizados
  const handleClick = useCallback(() => {
    if (disabled) return;
    onChange(value);
  }, [value, onChange, disabled]);

  // 3. Valores derivados
  const isValid = useMemo(() => value.length > 0, [value]);

  // 4. Early returns
  if (!value) {
    return <div className="text-gray-400">Nenhum valor</div>;
  }

  // 5. JSX principal
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-700 bg-gray-800 p-4",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <button
        onClick={handleClick}
        disabled={disabled}
        className="text-white transition-colors hover:text-cyan-400"
      >
        {value}
      </button>
    </div>
  );
}
```

---

## Props Tipadas

```tsx
// ✅ Interface clara com JSDoc
interface ButtonProps {
  /** Texto do botão */
  children: React.ReactNode;
  /** Variante visual */
  variant?: "primary" | "secondary" | "ghost";
  /** Tamanho */
  size?: "sm" | "md" | "lg";
  /** Ação ao clicar */
  onClick?: () => void;
  /** Desabilitar */
  disabled?: boolean;
  /** Classes adicionais */
  className?: string;
}

// ❌ Evitar: any ou tipos vagos
interface ButtonProps {
  children: any;
  variant: string;
  onClick: Function;
}
```

---

## Loading State

```tsx
export function DataCard({ data, isLoading }: DataCardProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg bg-gray-800 p-4">
        <div className="h-4 w-3/4 rounded bg-gray-700" />
        <div className="mt-2 h-4 w-1/2 rounded bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gray-800 p-4">
      <h3>{data.title}</h3>
      <p>{data.description}</p>
    </div>
  );
}
```

---

## Error Boundary

```tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rounded-lg bg-red-900/20 p-4 text-red-400">
            Algo deu errado. Tente novamente.
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

---

## Acessibilidade

```tsx
// ✅ Acessível
<button
  onClick={handleClick}
  aria-label="Fechar modal"
  aria-pressed={isActive}
  disabled={disabled}
>
  <XIcon aria-hidden="true" />
</button>

// ❌ Inacessível
<div onClick={handleClick}>
  <XIcon />
</div>
```

---

## Teste do Componente

```tsx
// src/__tests__/components/MyComponent.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  const defaultProps = {
    value: "test",
    onChange: vi.fn(),
  };

  it("should render value", () => {
    render(<MyComponent {...defaultProps} />);
    expect(screen.getByText("test")).toBeInTheDocument();
  });

  it("should call onChange on click", async () => {
    const onChange = vi.fn();
    render(<MyComponent {...defaultProps} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button"));

    expect(onChange).toHaveBeenCalledWith("test");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<MyComponent {...defaultProps} disabled />);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

---

## Checklist

- [ ] Props tipadas com interface
- [ ] Usa componentes do Design System
- [ ] Handlers memoizados (useCallback)
- [ ] Loading state implementado
- [ ] Acessibilidade (aria-\*, roles)
- [ ] Classes com `cn()` para merge
- [ ] Testes cobrem casos principais
- [ ] Sem console.log em produção
