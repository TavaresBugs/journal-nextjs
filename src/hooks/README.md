# 🪝 Hooks

Custom hooks React para gerenciar estado e side effects.

## 📁 Estrutura

```
hooks/
├── useAccountValidation.ts # Validação de UUID de conta
├── useAdminData.ts         # Dados administrativos
├── useAuth.ts              # Autenticação e sessão
├── useBlockBodyScroll.ts   # Bloqueia scroll do body
├── useCommunityData.ts     # Dados da comunidade
├── useDashboardActions.ts  # Ações do dashboard
├── useDashboardData.ts     # Dados agregados do dashboard (orquestrador)
├── useDashboardInit.ts     # Inicialização de dados do dashboard
├── useDayStats.ts          # Estatísticas diárias
├── useError.ts             # Gerenciamento de erros
├── useImageCache.ts        # Cache de imagens
├── useImageUpload.ts       # Upload de imagens
├── useJournalForm.ts       # Estado do form de journal
├── useLazyImage.tsx        # Lazy loading de imagens
├── useMentalHub.ts         # Hub de controle emocional
├── useMentorData.ts        # Dados do mentor AI
├── usePlaybookMetrics.ts   # Métricas de playbooks
├── useTradeMetrics.ts      # Cálculos de métricas de trades
└── useUserPermissions.ts   # Verificação de permissões (admin/mentor)
```

## 📋 Categorias

### 🔐 Autenticação

| Hook      | Descrição                                |
| --------- | ---------------------------------------- |
| `useAuth` | Login, logout, sessão e dados do usuário |

```typescript
const { user, signIn, signOut, loading } = useAuth();
```

### 📊 Data Fetching

| Hook                   | Descrição                                   |
| ---------------------- | ------------------------------------------- |
| `useDashboardData`     | Hook composto - orquestra os hooks abaixo   |
| `useDashboardInit`     | Inicialização de dados (trades, entries...) |
| `useTradeMetrics`      | Cálculos de métricas de trading             |
| `useAccountValidation` | Validação de UUID de contas                 |
| `useUserPermissions`   | Verificação de permissões (admin/mentor)    |
| `useDayStats`          | Estatísticas de um dia específico           |
| `useAdminData`         | Dados para o painel admin                   |
| `useCommunityData`     | Dados da comunidade                         |
| `useMentorData`        | Dados para o sistema de mentoria            |
| `usePlaybookMetrics`   | Métricas detalhadas de playbooks            |

#### Uso Simples (Composite Hook)

```typescript
// Usa o hook composto que orquestra todos os outros
const data = useDashboardData(accountId);
const { trades, metrics, isLoading, isAdminUser } = data;
```

#### Uso Granular (Individual Hooks)

```typescript
// Quando você precisa de controle mais fino
import {
  useAccountValidation,
  useDashboardInit,
  useTradeMetrics,
  useUserPermissions,
} from "@/hooks/useDashboardData";

// Apenas validação de conta
const { isValidAccount } = useAccountValidation(accountId);

// Apenas métricas de trading
const { metrics, advancedMetrics, pnlMetrics } = useTradeMetrics({
  trades,
  entries,
  initialBalance: 10000,
  currentBalance: 12500,
});

// Apenas permissões
const { isAdminUser, isMentorUser } = useUserPermissions();
```

### 📝 Forms & State

| Hook                  | Descrição                           |
| --------------------- | ----------------------------------- |
| `useJournalForm`      | Estado do formulário de journal     |
| `useDashboardActions` | Ações de CRUD do dashboard          |
| `useMentalHub`        | Estado do hub de controle emocional |

```typescript
const { formData, prepareSubmission, resetForm } = useJournalForm(initialData);
```

### 🖼️ Images

| Hook             | Descrição                                |
| ---------------- | ---------------------------------------- |
| `useImageUpload` | Upload e preview de imagens              |
| `useImageCache`  | Cache de imagens com armazenamento local |
| `useLazyImage`   | Lazy loading com placeholder             |

```typescript
const { images, handlePasteImage, handleFileSelect, removeImage } = useImageUpload();
```

### 🎨 UI

| Hook                 | Descrição                                |
| -------------------- | ---------------------------------------- |
| `useBlockBodyScroll` | Bloqueia scroll quando modal está aberto |
| `useError`           | Estado de erro para formulários          |

```typescript
useBlockBodyScroll(isModalOpen);
```

## 🔧 Padrões

### Data Fetching Pattern

```typescript
// hooks/useEntityData.ts
import { useQuery } from "@tanstack/react-query";
import { entityService } from "@/services";

export function useEntityData(id: string) {
  return useQuery({
    queryKey: ["entity", id],
    queryFn: () => entityService.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

### Estado Local com useState

```typescript
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse };
}
```

### Form State Pattern

```typescript
export function useFormState<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    // Limpa erro do campo
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
  }, [initialData]);

  return {
    data,
    errors,
    isSubmitting,
    updateField,
    resetForm,
    setErrors,
    setIsSubmitting,
  };
}
```

### Async Actions Pattern

```typescript
export function useAsyncAction<T, A extends any[]>(action: (...args: A) => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: A): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await action(...args);
        return result;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [action]
  );

  return { execute, loading, error };
}
```

## ✅ Boas Práticas

1. **Hooks devem ser puros** - Sem side effects não controlados
2. **Use useCallback para funções** - Evita re-renders desnecessários
3. **Use useMemo para cálculos** - Memoiza valores computados
4. **Retorne objetos, não arrays** - Facilita destructuring seletivo
5. **Nomeie com `use` prefix** - Convenção do React

```typescript
// ✅ Bom: retorna objeto
const { data, loading, error } = useData();

// ❌ Evite: retorna array
const [data, loading, error] = useData();
```

## 🔗 Referências

- [React Hooks](https://react.dev/reference/react/hooks)
- [TanStack Query](https://tanstack.com/query/latest)
- [useCallback](https://react.dev/reference/react/useCallback)
- [useMemo](https://react.dev/reference/react/useMemo)
