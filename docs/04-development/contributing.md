# 🤝 Guia de Contribuição

> **Público:** Desenvolvedores | **Tempo:** ~8 min | **Atualizado:** 30 Dez 2025

---

## TL;DR

1. Fork → Clone → Branch
2. Código → Testes → Lint
3. Commit (Conventional) → PR
4. Review → Merge 🎉

---

## Setup Local

```bash
# 1. Fork e clone
git clone https://github.com/SEU-USER/journal-nextjs.git
cd journal-nextjs

# 2. Instale dependências
npm install

# 3. Configure ambiente
cp .env.example .env.local
# Edite com suas credenciais Supabase

# 4. Inicie
npm run dev
```

---

## Convenções de Código

### Commits (Conventional Commits)

```
tipo(escopo): descrição curta

feat(trades): add batch delete functionality
fix(journal): correct date picker timezone
docs(readme): update installation steps
refactor(ui): extract Button variants
test(auth): add login flow tests
chore(deps): update dependencies
```

| Tipo       | Uso                 |
| ---------- | ------------------- |
| `feat`     | Nova funcionalidade |
| `fix`      | Correção de bug     |
| `docs`     | Documentação        |
| `refactor` | Refatoração         |
| `test`     | Testes              |
| `chore`    | Manutenção          |

### Branches

```
feature/nome-da-feature
fix/descricao-do-bug
docs/o-que-documenta
refactor/o-que-refatora
```

---

## Estrutura de Código

### Onde colocar código novo?

| Tipo                  | Local                                |
| --------------------- | ------------------------------------ |
| Nova página           | `src/app/nome/page.tsx`              |
| Componente UI base    | `src/components/ui/`                 |
| Componente de domínio | `src/features/[feature]/components/` |
| Hook de feature       | `src/features/[feature]/hooks/`      |
| Hook global           | `src/hooks/`                         |
| Server Action         | `src/app/actions/`                   |
| Type global           | `src/types/`                         |

### Padrão de Componente

```tsx
"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui";

// ============================================
// TYPES
// ============================================
interface MyComponentProps {
  value: string;
  onChange: (value: string) => void;
}

// ============================================
// COMPONENT
// ============================================
export function MyComponent({ value, onChange }: MyComponentProps) {
  // 1. Hooks primeiro
  const [state, setState] = useState(false);

  // 2. Handlers memoizados
  const handleClick = useCallback(() => {
    onChange(value);
  }, [value, onChange]);

  // 3. Valores derivados
  const isValid = useMemo(() => value.length > 0, [value]);

  // 4. JSX
  return <Button onClick={handleClick}>{value}</Button>;
}
```

---

## Testes

### Comandos

```bash
npm test                  # Todos os testes
npm run test:watch        # Watch mode
npm run test:coverage     # Com coverage
```

### Estrutura

```
src/__tests__/
├── components/           # Testes de componentes
├── hooks/               # Testes de hooks
├── services/            # Testes de services
└── lib/                 # Testes de utils
```

### Exemplo de Teste

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent value="test" onChange={() => {}} />);
    expect(screen.getByText("test")).toBeInTheDocument();
  });

  it("should call onChange on click", async () => {
    const onChange = vi.fn();
    render(<MyComponent value="test" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button"));

    expect(onChange).toHaveBeenCalledWith("test");
  });
});
```

---

## Pull Request

### Checklist

- [ ] Código segue convenções do projeto
- [ ] Testes passando (`npm test`)
- [ ] Lint sem erros (`npm run lint`)
- [ ] TypeScript sem erros (`npm run type-check`)
- [ ] Documentação atualizada (se aplicável)
- [ ] Screenshot/GIF para mudanças visuais

### Template de PR

```markdown
## Descrição

O que foi alterado e por quê.

## Tipo de Mudança

- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como Testar

1. Passo 1
2. Passo 2
3. Resultado esperado

## Screenshots

Se aplicável.
```

---

## Code Review Checklist

Ao revisar PRs, verifique:

- [ ] Código é legível e bem organizado
- [ ] Usa componentes do Design System
- [ ] Sem `any` ou `@ts-ignore`
- [ ] Testes cobrem casos importantes
- [ ] Sem console.log em produção
- [ ] Performance considerada

---

## Regras Importantes

### ✅ FAÇA

- Use componentes de `src/components/ui/`
- Tipe tudo com TypeScript (strict)
- Valide inputs com Zod
- Teste novas funcionalidades
- Use imports do módulo de features

### ❌ NÃO FAÇA

- Usar `<button>` nativo → Use `Button`
- Criar modal com `div fixed` → Use `Modal`
- Usar `any` → Tipe corretamente
- Commitar sem rodar `npm test`
- Ignorar erros de lint

---

## Precisa de Ajuda?

- [Arquitetura](../02-architecture/overview.md)
- [Design System](./design-system.md)
- [Templates](./templates/)
- [GitHub Issues](https://github.com/TavaresBugs/journal-nextjs/issues)

---

**Mantido por:** [@TavaresBugs](https://github.com/TavaresBugs)
