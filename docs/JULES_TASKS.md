# 🤖 Jules Tasks - Trading Journal Pro

> Prompts prontos para ocupar o Jules enquanto você trabalha em outras coisas.
> Copie e cole diretamente no Jules.

---

## 📋 TASK 1: Reorganizar Componentes de Notificação

**Prioridade:** 🔴 Alta | **Tempo estimado Jules:** ~15 min

````markdown
## Contexto

Este é um Trading Journal em Next.js 15 + Supabase. Os componentes de notificação estão soltos na raiz de /components e precisam ser organizados.

## Objetivo

Mover os componentes de notificação para uma pasta dedicada e criar barrel exports.

## Ações Necessárias

1. Criar pasta `src/components/notifications/`
2. Mover `src/components/NotificationBell.tsx` para `src/components/notifications/NotificationBell.tsx`
3. Mover `src/components/NotificationsModal.tsx` para `src/components/notifications/NotificationsModal.tsx`
4. Criar `src/components/notifications/index.ts` com exports:
   ```typescript
   export { NotificationBell } from "./NotificationBell";
   export { NotificationsModal } from "./NotificationsModal";
   ```
````

5. Atualizar TODOS os imports no projeto que referenciam esses componentes

## Arquivos para Atualizar

- src/app/dashboard/[accountId]/page.tsx (usa NotificationBell)
- Qualquer outro arquivo que importe esses componentes

## Critérios de Sucesso

- [ ] Componentes movidos para nova pasta
- [ ] Barrel export funcionando
- [ ] Todos os imports atualizados
- [ ] Build passa sem erros (`npm run build`)
- [ ] Lint passa (`npm run lint`)

````

---

## 📋 TASK 2: Criar Migration para Sistema de Correções do Mentor
**Prioridade:** 🔴 Alta | **Tempo estimado Jules:** ~20 min

```markdown
## Contexto
Trading Journal com sistema de mentoria. Precisamos de uma tabela para armazenar correções/comentários que mentores fazem nos trades dos alunos.

## Objetivo
Criar migration SQL para a tabela `mentor_reviews` com RLS policies apropriadas.

## Ações Necessárias
Criar arquivo `supabase/migrations/016_mentor_reviews.sql` com:

1. **Tabela mentor_reviews:**
   - id (UUID, PK)
   - mentor_id (UUID, FK auth.users)
   - mentee_id (UUID, FK auth.users)
   - trade_id (UUID, FK trades, nullable)
   - journal_entry_id (UUID, FK journal_entries, nullable)
   - review_type (TEXT: 'correction', 'comment', 'suggestion')
   - content (TEXT, NOT NULL)
   - rating (INTEGER, 1-5, nullable)
   - is_read (BOOLEAN, default FALSE)
   - created_at (TIMESTAMPTZ)
   - updated_at (TIMESTAMPTZ)

2. **Índices:**
   - idx_mentor_reviews_mentor_id
   - idx_mentor_reviews_mentee_id
   - idx_mentor_reviews_trade_id
   - idx_mentor_reviews_is_read

3. **RLS Policies:**
   - Mentor pode criar reviews para seus mentees (verificar mentor_invites.status = 'accepted')
   - Mentor pode ver/editar suas próprias reviews
   - Mentee pode ver reviews direcionadas a ele
   - Mentee pode marcar como lido (update is_read)

## Referência de Estilo
Ver arquivo existente: `supabase/migrations/011_mentor_system.sql`

## Critérios de Sucesso
- [ ] Arquivo SQL criado
- [ ] Tabela com todos os campos
- [ ] Índices criados
- [ ] RLS policies funcionais
- [ ] Comentários explicativos no SQL
````

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

````

---

## 📋 TASK 4: Adicionar JSDoc em Todos os Services
**Prioridade:** 🟡 Média | **Tempo estimado Jules:** ~25 min

```markdown
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

## Tipos Comuns de Fixes

1. Variáveis não utilizadas - remover ou prefixar com \_
2. Imports não utilizados - remover
3. any types - adicionar tipos específicos
4. React hooks dependencies - adicionar deps faltando
5. Acessibilidade (a11y) - adicionar aria-labels

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
