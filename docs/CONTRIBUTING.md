# 🤝 Guia de Contribuição - Trading Journal Pro

> **Objetivo:** Como contribuir com o projeto de forma padronizada.
> **Última atualização:** 18 de Dezembro de 2025

---

## 🎯 Resumo

1. Fork o repositório
2. Crie branch descritiva
3. Faça suas alterações
4. Rode testes
5. Abra Pull Request

---

## 🚀 Setup Local

### Pré-requisitos

- Node.js 18+
- npm/yarn/pnpm/bun
- Conta Supabase (gratuita)
- Git

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/TavaresBugs/journal-nextjs.git
cd journal-nextjs

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp env.example.txt .env.local
# Edite .env.local com suas credenciais Supabase

# 4. Rode migrations (opcional, se tiver Supabase local)
npm run db:push

# 5. Inicie o servidor
npm run dev
```

Acesse: http://localhost:3000

---

## 📋 Convenções de Código

### Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(escopo): descrição curta

feat(trades): add batch delete functionality
fix(journal): correct date picker timezone
docs(readme): update installation steps
refactor(ui): extract Button variants
test(auth): add login flow tests
chore(deps): update dependencies
```

**Tipos:**

- `feat` - Nova funcionalidade
- `fix` - Correção de bug
- `docs` - Documentação
- `refactor` - Refatoração (sem mudar comportamento)
- `test` - Testes
- `chore` - Tarefas de manutenção

### Branches

```
feature/nome-da-feature
fix/descricao-do-bug
docs/o-que-documenta
refactor/o-que-refatora
```

### TypeScript

```typescript
// ✅ BOM: Tipos explícitos
function calculatePnL(entry: number, exit: number, lot: number): number {
  return (exit - entry) * lot;
}

// ❌ RUIM: any
function calculatePnL(entry: any, exit: any, lot: any): any {
  return (exit - entry) * lot;
}
```

### Componentes

```tsx
// ✅ BOM: Usar componentes do Design System
import { Button, Modal } from '@/components/ui'

<Button variant="primary">Salvar</Button>

// ❌ RUIM: Estilizar button nativo
<button className="bg-blue-500 px-4 py-2">Salvar</button>
```

---

## 🧪 Testes

### Rodar Testes

```bash
# Todos os testes
npm test

# Com coverage
npm run test:coverage

# Watch mode (desenvolvimento)
npm run test:watch
```

### Estrutura de Testes

```
src/__tests__/
├── lib/
│   ├── calculations.test.ts
│   └── validation.test.ts
├── components/
│   └── Button.test.tsx
└── hooks/
    └── useTrades.test.ts
```

### Exemplo de Teste

```typescript
import { describe, it, expect } from "vitest";
import { calculateWinRate } from "@/lib/calculations";

describe("calculateWinRate", () => {
  it("should return 50% for equal wins and losses", () => {
    const result = calculateWinRate(5, 5);
    expect(result).toBe(50);
  });

  it("should return 0 for no trades", () => {
    const result = calculateWinRate(0, 0);
    expect(result).toBe(0);
  });
});
```

---

## 📝 Pull Request

### Checklist

- [ ] Código segue convenções do projeto
- [ ] Testes passando (`npm test`)
- [ ] Lint sem erros (`npm run lint`)
- [ ] TypeScript sem erros (`npm run type-check`)
- [ ] Documentação atualizada (se aplicável)
- [ ] Screenshot/GIF para mudanças visuais

### Template

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

Se aplicável, adicione imagens.
```

---

## 📁 Estrutura de Pastas

```
src/
├── app/              # Rotas (não adicionar lógica aqui)
├── components/
│   ├── ui/           # Design System (fonte da verdade)
│   ├── trades/       # Componentes de domínio
│   └── shared/       # Componentes compartilhados
├── lib/
│   ├── repositories/ # Acesso a dados
│   ├── services/     # Lógica de negócio
│   └── utils/        # Helpers
├── hooks/            # Custom hooks
└── types/            # TypeScript types
```

### Onde Colocar Código Novo?

| Tipo                  | Local                       |
| --------------------- | --------------------------- |
| Nova página           | `src/app/nome/page.tsx`     |
| Componente UI base    | `src/components/ui/`        |
| Componente específico | `src/components/[domínio]/` |
| Query Supabase        | `src/lib/repositories/`     |
| Lógica de negócio     | `src/lib/services/`         |
| Hook reutilizável     | `src/hooks/`                |
| Type global           | `src/types/`                |

---

## ❓ FAQ

**P: Posso usar bibliotecas novas?**
R: Sim, mas discuta antes via Issue. Preferimos manter o bundle enxuto.

**P: Como pedir uma feature?**
R: Abra uma Issue com template "Feature Request".

**P: Código precisa de 100% coverage?**
R: Não, mas funcionalidades críticas devem ter testes.

---

## 🔗 Referências

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Entenda a arquitetura
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Componentes UI
- [GLOSSARIO.md](./GLOSSARIO.md) - Termos técnicos
- [TODO.md](./TODO.md) - Tarefas disponíveis

---

**Mantido por:** [@TavaresBugs](https://github.com/TavaresBugs)
