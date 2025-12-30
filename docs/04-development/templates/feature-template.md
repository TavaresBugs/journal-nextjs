# 📁 Template: Nova Feature

Use este template para criar um novo módulo de feature.

---

## Estrutura de Pastas

```bash
# Criar estrutura
mkdir -p src/features/NOME_FEATURE/{components,hooks,constants}
touch src/features/NOME_FEATURE/index.ts
```

```
src/features/NOME_FEATURE/
├── components/
│   ├── FeatureButton.tsx
│   ├── FeatureModal.tsx
│   └── index.ts
├── hooks/
│   ├── useFeatureData.ts
│   └── index.ts
├── constants/
│   ├── options.ts
│   └── index.ts
└── index.ts                 # Barrel principal
```

---

## Arquivos Base

### `index.ts` (Barrel Export)

```typescript
// src/features/NOME_FEATURE/index.ts
export * from "./components";
export * from "./hooks";
export * from "./constants";
```

### `components/index.ts`

```typescript
// src/features/NOME_FEATURE/components/index.ts
export { FeatureButton } from "./FeatureButton";
export { FeatureModal } from "./FeatureModal";
```

### `hooks/useFeatureData.ts`

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFeatureDataAction, createFeatureItemAction } from "@/app/actions/feature";

// Query Keys
export const featureKeys = {
  all: ["feature"] as const,
  list: (accountId: string) => [...featureKeys.all, "list", accountId] as const,
  detail: (id: string) => [...featureKeys.all, "detail", id] as const,
};

// Hook principal
export function useFeatureData(accountId: string) {
  const queryClient = useQueryClient();

  // Query
  const query = useQuery({
    queryKey: featureKeys.list(accountId),
    queryFn: () => getFeatureDataAction(accountId),
    staleTime: 5 * 60 * 1000, // 5 min
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: createFeatureItemAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featureKeys.all });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
```

---

## Server Action

```typescript
// src/app/actions/feature.ts
"use server";

import { getCurrentUserId } from "@/lib/database/auth";
import { featureRepository } from "@/lib/database/repositories";

export async function getFeatureDataAction(accountId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  return featureRepository.getByAccount(accountId);
}

export async function createFeatureItemAction(data: CreateFeatureInput) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  return featureRepository.create({ ...data, userId });
}
```

---

## Componente Base

```tsx
// src/features/NOME_FEATURE/components/FeatureButton.tsx
"use client";

import { Button } from "@/components/ui";
import { Plus } from "lucide-react";

interface FeatureButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function FeatureButton({ onClick, disabled }: FeatureButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled} variant="primary">
      <Plus className="mr-2 h-4 w-4" />
      Adicionar
    </Button>
  );
}
```

---

## Teste Base

```typescript
// src/__tests__/features/NOME_FEATURE/FeatureButton.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FeatureButton } from "@/features/NOME_FEATURE";

describe("FeatureButton", () => {
  it("should render correctly", () => {
    render(<FeatureButton onClick={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<FeatureButton onClick={onClick} />);

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalled();
  });
});
```

---

## Checklist de Validação

- [ ] Barrel exports funcionando
- [ ] Hook retorna dados corretamente
- [ ] Componentes usam Design System
- [ ] Testes cobrem casos principais
- [ ] Tipos TypeScript corretos (sem `any`)
- [ ] Documentação atualizada
