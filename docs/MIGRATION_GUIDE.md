# Guia de Migração e Estrutura de Pastas (Issue #65)

Este documento detalha o processo de migração e a nova estrutura de pastas implementada em Dezembro de 2025 para consolidar a camada de acesso a dados.

## 🔄 Mudanças Recentes (Dezembro 2025)

### 1. Camada de Dados Centralizada (`src/lib/database`)

Anteriormente, tínhamos arquivos espalhados em `lib/prisma` e `lib/repositories/prisma`. Agora, tudo foi centralizado.

**Antes:**

```
src/lib/
├── prisma/               # Client e Auth
│   ├── index.ts
│   └── auth.ts
└── repositories/
    └── prisma/           # Implementações
        ├── AccountRepository.ts
        └── ...
```

**Depois (Nova Estrutura):**

```
src/lib/
└── database/             # ✅ Hub Central
    ├── client.ts         # Prisma Client (antigo index.ts)
    ├── auth.ts           # Auth helpers
    └── repositories/     # ✅ Todas implementações aqui
        ├── AccountRepository.ts
        ├── JournalRepository.ts
        └── ...
```

### 2. Imports Atualizados

Se você está procurando onde importar o Prisma ou Repositórios:

| O que você quer? | Import Antigo               | **Novo Import**                   |
| :--------------- | :-------------------------- | :-------------------------------- |
| Prisma Client    | `@/lib/prisma`              | **`@/lib/database`**              |
| Auth Helpers     | `@/lib/prisma/auth`         | **`@/lib/database/auth`**         |
| Repositories     | `@/lib/repositories/prisma` | **`@/lib/database/repositories`** |

> **Dica:** O VS Code deve sugerir os novos caminhos automaticamente.

---

## 📂 Guia Rápido de Arquivos

### Onde encontro...

- **Schema do Banco?** `prisma/schema.prisma`
- **Queries SQL?** Elas estão encapsuladas dentro de `src/lib/database/repositories/*.ts`.
- **Server Actions?** `src/app/actions/*.ts` (elas chamam os repositórios).
- **Tipos de Banco?** `src/types/database.ts` (gerados automaticamente ou manuais).
- **Tipos de Domínio?** `src/types/index.ts` (Interfaces principais como `Trade`, `JournalEntry`).

### Adicionando Nova Funcionalidade

1. **Modelagem:** Adicione tabelas em `prisma/schema.prisma`.
2. **Migração:** Rode `npx prisma migrate dev`.
3. **Repositório:**
   - Crie `src/lib/database/repositories/[Nome]Repository.ts`.
   - Implemente métodos CRUD usando `prisma.[tabela]`.
4. **Action:** Crie `src/app/actions/[nome].ts` para expor dados ao frontend.

---

## 🛠️ Notas para Desenvolvedores

- **Não use `prisma` diretamente em componentes.** Sempre use Server Actions.
- **Não use `prisma` diretamente em Actions (idealmente).** Use os Repositories para manter a lógica encapsulada.
- **Tipagem:** Os repositórios devem retornar objetos de domínio (`JournalEntry`), não objetos crus do Prisma (`DBJournalEntry`), sempre que possível (use mappers).

---

**Link Relacionado:** [Issue #65](https://github.com/TavaresBugs/journal-nextjs/issues/65)
