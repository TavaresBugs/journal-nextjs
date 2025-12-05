# 🤖 Jules Tasks - Trading Journal Pro

> Prompts prontos para ocupar o Jules enquanto você trabalha em outras coisas.
> Copie e cole diretamente no Jules.

---

## ✅ TASK 1: Reorganizar Componentes de Notificação [CONCLUÍDA]

**Status:** ✅ Concluída via PR #4 | **Feito por:** Jules

- [x] Componentes movidos para `src/components/notifications/`
- [x] Barrel exports criados
- [x] Imports atualizados
- [x] Build passando

---

## 📋 TASK 9: Reorganização de Pastas e Documentação

**Prioridade:** 🟡 Média | **Tempo estimado Jules:** ~45 min

````markdown
## Contexto

Trading Journal Next.js. A estrutura de pastas precisa de organização para escalar.

## Objetivo

Reorganizar components, services, e documentar migrations.

## PARTE 1: Components

### 1.1 Mover ClientProviders

- Mover `src/components/ClientProviders.tsx` para `src/components/layout/ClientProviders.tsx`
- Criar `src/components/layout/index.ts`
- Atualizar imports

### 1.2 Criar pasta mentor

- Criar `src/components/mentor/`
- Criar `src/components/mentor/index.ts` (vazio por enquanto)
- Esta pasta receberá: StudentCalendarModal, TradeReviewModal, etc.

## PARTE 2: Services

### 2.1 Dividir communityService.ts (19KB - muito grande)

Dividir em:

- `src/services/community/playbookService.ts` - funções de playbook sharing
- `src/services/community/leaderboardService.ts` - funções de leaderboard
- `src/services/community/index.ts` - re-exporta tudo

### 2.2 Criar estrutura para mentor

- Criar `src/services/mentor/`
- Mover `mentorService.ts` para `src/services/mentor/inviteService.ts`
- Criar `src/services/mentor/index.ts`

## PARTE 3: Documentar Migrations

Criar `supabase/migrations/README.md`:

```markdown
# Database Migrations

## Estrutura

| #       | Nome            | Domínio   | Descrição                               |
| ------- | --------------- | --------- | --------------------------------------- |
| 000     | init_schema     | Core      | Tabelas base: trades, accounts, journal |
| 001     | storage_setup   | Core      | Configuração de storage para imagens    |
| 002     | playbooks       | Feature   | Sistema de playbooks                    |
| 003     | shared_journals | Feature   | Compartilhamento de journals            |
| 004     | admin_system    | Admin     | users_extended, audit_logs, RBAC        |
| 005     | mentor_mode     | Mentor    | Sistema de mentoria inicial             |
| 006     | community       | Community | Playbooks compartilhados, leaderboard   |
| 007-015 | fixes           | Fixes     | Correções de RLS e schema               |
| 016     | mentor_reviews  | Mentor    | Correções/comentários de mentores       |

## Regras

- NUNCA renomear migrations já aplicadas
- Consolidar fixes antes de aplicar
- Usar prefixos descritivos para novas features
```
````

## Critérios de Sucesso

- [ ] ClientProviders movido para layout/
- [ ] Pasta mentor/ criada em components
- [ ] communityService dividido
- [ ] mentorService movido para mentor/
- [ ] README de migrations criado
- [ ] Build passa
- [ ] Todos os imports atualizados

`````

---

## 📋 TASK 8: Auditoria de Segurança de URLs e Headers

**Prioridade:** 🔴 Alta | **Tempo estimado Jules:** ~30 min

````markdown
## Contexto

Trading Journal Next.js 15 + Supabase. Precisamos garantir que não estamos expondo informações sensíveis em URLs e que os headers de segurança estão configurados.

## Objetivo

Auditar e corrigir potenciais vulnerabilidades de exposição de dados em URLs e configurar headers de segurança.

## Arquivos para Analisar

- src/middleware.ts
- src/app/dashboard/[accountId]/page.tsx
- src/app/share/[token]/page.tsx
- src/app/login/page.tsx
- next.config.ts

## Verificações Necessárias

### 1. URLs

- [ ] Verificar se IDs na URL são UUIDs (não sequenciais)
- [ ] Verificar se tokens de compartilhamento são suficientemente aleatórios
- [ ] Verificar se mensagens de erro na URL não expõem lógica interna

### 2. Query Parameters

- [ ] Verificar se `/login?error=` não expõe detalhes técnicos
- [ ] Considerar usar códigos de erro genéricos ao invés de específicos

### 3. Headers de Segurança (next.config.ts)

Adicionar/verificar estes headers:

```javascript
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];
`````

```

### 4. Supabase Keys

- [ ] Verificar se ANON_KEY está sendo usada (não SERVICE_ROLE)
- [ ] Verificar se SERVICE_ROLE_KEY não está exposta no client

## Ações Corretivas

1. Se encontrar IDs sequenciais, migrar para UUIDs
2. Se encontrar mensagens de erro detalhadas, substituir por códigos genéricos
3. Adicionar headers de segurança no next.config.ts
4. Documentar qualquer risco aceito

## Critérios de Sucesso

- [ ] Nenhum ID sequencial exposto em URLs
- [ ] Headers de segurança configurados
- [ ] Mensagens de erro genéricas
- [ ] Relatório de auditoria criado em docs/SECURITY_AUDIT.md

```

---

## ✅ TASK 2: Criar Migration para Sistema de Correções do Mentor [CONCLUÍDA]

**Status:** ✅ Concluída via PR | **Feito por:** Jules

- [x] Tabela `mentor_reviews` criada com todos os campos
- [x] CHECK constraints para `review_type` e `rating`
- [x] 4 índices criados
- [x] RLS policies implementadas:
  - Mentor cria reviews (verifica `mentor_invites.status = 'accepted'`)
  - Mentor gerencia suas reviews
  - Mentee visualiza reviews dele
  - Mentee marca como lido
- [x] GRANTS e documentação

**Arquivo:** `supabase/migrations/016_mentor_reviews.sql`

---

## 📋 TASK 3: Criar Service para Reviews do Mentor

**Prioridade:** 🔴 Alta | **Tempo estimado Jules:** ~30 min

````markdown
## Contexto

Trading Journal Next.js + Supabase. Precisamos de um service para CRUD de correções/comentários.

## Objetivo

Criar `src/services/reviewService.ts` seguindo o padrão dos services existentes.

## Arquivos de Referência

- `src/services/mentorService.ts` (mesmo padrão de código)
- `src/services/journalService.ts` (exemplo de CRUD)

## Funções Necessárias

```typescript
// Tipos
interface MentorReview {
  id: string;
  mentorId: string;
  menteeId: string;
  tradeId?: string;
  journalEntryId?: string;
  reviewType: 'correction' | 'comment' | 'suggestion';
  content: string;
  rating?: number;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// Funções do Mentor
createReview(data: Omit<MentorReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<MentorReview | null>
updateReview(id: string, content: string): Promise<boolean>
deleteReview(id: string): Promise<boolean>
getReviewsForMentee(menteeId: string): Promise<MentorReview[]>

// Funções do Mentee
getMyReviews(): Promise<MentorReview[]>
getReviewsForTrade(tradeId: string): Promise<MentorReview[]>
markReviewAsRead(id: string): Promise<boolean>
getUnreadReviewCount(): Promise<number>
```
````

```

## Padrões a Seguir

- Usar snake_case para campos do DB, camelCase para TypeScript
- Funções de mapeamento DB -> TS (ver mapMentorInviteFromDB em mentorService)
- Tratamento de erros com console.error
- Usar supabase.auth.getUser() para autenticação

## Critérios de Sucesso

- [ ] Arquivo criado em src/services/reviewService.ts
- [ ] Todos os tipos definidos
- [ ] Todas as funções implementadas
- [ ] Mapeamento DB <-> TS correto
- [ ] TypeScript sem erros

```

---

## 📋 TASK 4: Adicionar JSDoc em Todos os Services

**Prioridade:** 🟡 Média | **Tempo estimado Jules:** ~25 min

````markdown
## Contexto

Trading Journal Next.js. Os services precisam de documentação JSDoc para facilitar manutenção.

## Objetivo

Adicionar JSDoc completo para todas as funções exportadas em src/services/

## Arquivos para Documentar

- src/services/accountService.ts
- src/services/adminService.ts
- src/services/communityService.ts
- src/services/journalService.ts
- src/services/mentorService.ts
- src/services/routineService.ts
- src/services/tradeService.ts

## Formato JSDoc

```typescript
/**
 * Descrição breve da função
 *
 * @description Descrição mais detalhada se necessário
 * @param {tipo} nomeParam - Descrição do parâmetro
 * @returns {Promise<tipo>} Descrição do retorno
 * @throws {Error} Quando/se pode lançar erro
 *
 * @example
 * const result = await nomeFuncao(param);
 */
```
````

## Critérios de Sucesso

- [ ] Todas as funções exportadas documentadas
- [ ] Parâmetros e retornos descritos
- [ ] Exemplos de uso quando apropriado
- [ ] TypeScript sem erros

````

---

## 📋 TASK 5: Criar Testes Unitários para MentorService
**Prioridade:** 🟡 Média | **Tempo estimado Jules:** ~45 min

```markdown
## Contexto
Trading Journal Next.js + Supabase. Precisamos de testes para garantir qualidade.

## Objetivo
Criar testes unitários com Vitest para src/services/mentorService.ts

## Setup
O projeto usa:
- Vitest para testes
- @testing-library/react para componentes

## Arquivo a Criar
`src/services/__tests__/mentorService.test.ts`

## Funções para Testar
- sendMentorInvite
- getReceivedInvites
- getSentInvites
- acceptInvite
- rejectInvite
- cancelInvite
- revokeMentorship
- getMentees
- getMentors

## Mock do Supabase
```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn()
    }))
  }
}));
````

## Casos de Teste

Para cada função:

1. Caso de sucesso
2. Caso de usuário não autenticado
3. Caso de erro do Supabase
4. Casos edge (dados faltando, etc)

## Critérios de Sucesso

- [ ] Arquivo de teste criado
- [ ] Mocks configurados
- [ ] Testes para todas as funções
- [ ] Testes passando (`npm run test`)
- [ ] Cobertura > 80%

````

---

## 📋 TASK 6: Fix Lint Warnings em Todo o Projeto
**Prioridade:** 🟢 Baixa | **Tempo estimado Jules:** ~20 min

```markdown
## Contexto
Trading Journal Next.js. Existem alguns warnings de lint que precisam ser corrigidos.

## Objetivo
Corrigir TODOS os warnings de lint sem quebrar funcionalidade.

## Comando
```bash
npm run lint
````

## Warnings Conhecidos

### src/app/admin/page.tsx

1. **Linhas 124, 303, 354:** Usando `<img>` ao invés de `next/image`
   - Substituir `<img>` por `<Image />` de `next/image`
   - Adicionar width/height ou fill prop
2. **Linhas 419, 424:** setState dentro de useEffect (react-hooks/set-state-in-effect)
   - Refatorar para usar padrão correto
   - Considerar usar useCallback ou mover lógica para fora do effect

## Tipos Comuns de Fixes

1. Variáveis não utilizadas - remover ou prefixar com \_
2. Imports não utilizados - remover
3. any types - adicionar tipos específicos
4. React hooks dependencies - adicionar deps faltando
5. Acessibilidade (a11y) - adicionar aria-labels
6. **`<img>` → `<Image />`** - usar next/image component
7. **setState em useEffect** - refatorar para evitar cascading renders

## Regras

- NÃO usar eslint-disable comments
- NÃO mudar lógica de negócio
- APENAS corrigir warnings
- Se não souber corrigir algo, deixar comentário // TODO:

## Critérios de Sucesso

- [ ] `npm run lint` passa sem warnings
- [ ] `npm run build` passa
- [ ] Funcionalidade não alterada

````

---

## 📋 TASK 7: Criar Componente StudentCalendarModal
**Prioridade:** 🔴 Alta | **Tempo estimado Jules:** ~40 min

```markdown
## Contexto
Trading Journal com sistema de mentoria. O mentor precisa visualizar o calendário de trades do seu mentorado.

## Objetivo
Criar componente StudentCalendarModal que mostra o calendário do aluno para o mentor.

## Arquivo a Criar
`src/components/mentor/StudentCalendarModal.tsx`

## Props
```typescript
interface StudentCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  menteeId: string;
  menteeName: string;
}
````

## Referência de Design

Copiar estilo de: `src/components/journal/DayDetailModal.tsx`
Usar componente Modal de: `src/components/ui/Modal.tsx`

## Funcionalidades

1. Header com nome do aluno e botão fechar
2. Navegação de mês (< Dezembro 2024 >)
3. Grid de calendário (Dom-Sáb)
4. Cada dia mostra:
   - Cor verde/vermelho baseado em P/L
   - Número de trades
   - Total P/L do dia
5. Clicar em dia abre detalhes (futuro - por enquanto só mostra toast)

## Busca de Dados

```typescript
// Usar função existente ou criar nova em mentorService
const trades = await getStudentTrades(menteeId, startDate, endDate);
```

## Critérios de Sucesso

- [ ] Componente criado
- [ ] Responsivo (mobile-first)
- [ ] Mesma estética do projeto (tema Zorin)
- [ ] TypeScript sem erros
- [ ] Usa componente Modal existente

```

---

## 🚀 Ordem Sugerida de Execução

1. **TASK 1** - Reorganizar componentes (base para outras tasks)
2. **TASK 2** - Migration SQL (precisa estar no DB)
3. **TASK 3** - ReviewService (usa a migration)
4. **TASK 7** - StudentCalendarModal (feature visível)
5. **TASK 4** - JSDoc (melhoria incremental)
6. **TASK 5** - Testes (qualidade)
7. **TASK 6** - Lint fixes (polish)

---

**Dica:** Copie uma task por vez. Espere o PR, revise, merge, e então envie a próxima!
```
