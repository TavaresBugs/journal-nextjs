# Estrutura de Pastas do Projeto

Este documento serve como guia de referência para a organização de pastas e arquivos do projeto Journal NextJs.

## Visão Geral

A estrutura segue o padrão do Next.js (App Router) com uma separação clara entre código de aplicação (`app/`), lógica de negócios (`lib/`), e UI reutilizável (`components/`).

```
journal-nextjs/
├── src/
│   ├── app/                 # Rotas, Actions e Layouts (App Router)
│   ├── components/          # Componentes React reutilizáveis
│   ├── lib/                 # Lógica de negócios central e utilitários
│   │   ├── database/        # Camada de acesso a dados (Prisma + Repositories)
│   │   ├── services/        # Serviços de domínio (ex: Importação, Scrapers)
│   │   ├── logging/         # Sistema de logs
│   │   └── ...
│   ├── store/               # Gerenciamento de estado global (Zustand)
│   └── types/               # Definições de tipos TypeScript globais
├── docs/                    # Documentação do projeto
└── public/                  # Arquivos estáticos
```

## Detalhes da Camada de Dados (`src/lib/database`)

Esta é a camada mais crítica para persistência e lógica de dados. Ela isola o ORM (Prisma) e fornece repositórios tipados para a aplicação.

| Arquivo/Pasta            | Responsabilidade                                                               |
| :----------------------- | :----------------------------------------------------------------------------- |
| `client.ts` / `index.ts` | Singleton do PrismaClient. Ponto de entrada para `prisma`.                     |
| `auth.ts`                | Utilitários de autenticação e integração Supabase <-> Prisma.                  |
| `repositories/`          | Implementações do padrão Repository. Toda query ao banco deve passar por aqui. |
| `types.ts`               | Tipos genéricos compartilhados pela camada de dados (ex: `Result<T>`).         |

### Repositórios (`src/lib/database/repositories`)

Cada entidade principal tem seu próprio repositório.

- `JournalRepository.ts`: Gerencia entradas de diário, junção com trades e imagens.
- `TradeRepository.ts`: Gerencia trades importados ou manuais.
- `AccountRepository.ts`: Gerencia contas de trading.
- ... e outros.

## Actions (`src/app/actions`)

As Server Actions são a ponte entre o frontend e a camada de dados. Elas:

1. Validam input do usuário.
2. Verificam autenticação (`getCurrentUserId`).
3. Chamam os Repositórios em `lib/database`.
4. Retornam dados serializáveis para os componentes client/server.

## Onde Colocar Novo Código?

### Se você está criando uma nova funcionalidade de banco de dados:

1. **Schema**: Atualize `prisma/schema.prisma` e rode `npx prisma generate`.
2. **Repository**: Crie ou atualize `src/lib/database/repositories/[Entity]Repository.ts`.
3. **Action**: Crie ou atualize `src/app/actions/[entity].ts` chamando o repositório.

### Se você está criando um novo componente visual:

- Use `src/components/features/[FeatureName]` para componentes específicos.
- Use `src/components/ui` para componentes genéricos (botões, inputs).

## Convenções de Nomenclatura

- **Pastas**: `kebab-case` (ex: `date-range-picker`).
- **Arquivos TS/TSX**: `PascalCase` para componentes (`Button.tsx`) e classes; `camelCase` para utilitários e actions (`formatDate.ts`, `journal.ts`).
- **Repositórios**: `PascalCase` com sufixo Repository (`TradeRepository.ts`).
