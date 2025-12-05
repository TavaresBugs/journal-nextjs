# 🤖 Jules Tasks - Trading Journal Pro

> Prompts prontos para ocupar o Jules enquanto você trabalha em outras coisas.
> Copie e cole diretamente no Jules.

---

## 📊 Status Geral

| #   | Task                                | Status       | Feito por |
| --- | ----------------------------------- | ------------ | --------- |
| 1   | Reorganizar Componentes Notificação | ✅ Concluída | Jules     |
| 2   | Migration mentor_reviews            | ✅ Concluída | Jules     |
| 3   | ReviewService CRUD                  | 📋 Pendente  | -         |
| 4   | JSDoc em Services                   | 📋 Pendente  | -         |
| 5   | Testes MentorService                | 📋 Pendente  | -         |
| 6   | Fix Lint Warnings                   | 📋 Pendente  | -         |
| 7   | StudentCalendarModal                | 📋 Pendente  | -         |
| 8   | Auditoria de Segurança              | 📋 Pendente  | -         |
| 9   | Reorganização de Pastas             | 📋 Pendente  | -         |

---

## ✅ TASK 1: Reorganizar Componentes de Notificação [CONCLUÍDA]

**Status:** ✅ Concluída via PR #4 | **Feito por:** Jules

- [x] Componentes movidos para `src/components/notifications/`
- [x] Barrel exports criados
- [x] Imports atualizados
- [x] Build passando

---

## ✅ TASK 2: Migration mentor_reviews [CONCLUÍDA]

**Status:** ✅ Concluída via PR | **Feito por:** Jules

- [x] Tabela `mentor_reviews` criada
- [x] CHECK constraints para `review_type` e `rating`
- [x] 4 índices criados
- [x] RLS policies implementadas
- [x] GRANTS e documentação

**Arquivo:** `supabase/migrations/016_mentor_reviews.sql`

---

## 📋 TASK 3: Criar Service para Reviews do Mentor

**Prioridade:** 🔴 Alta | **Tempo estimado:** ~30 min

```markdown
## Contexto

Trading Journal Next.js + Supabase. Precisamos de um service para CRUD de correções/comentários.

## Objetivo

Criar `src/services/reviewService.ts` seguindo o padrão dos services existentes.

## Arquivos de Referência

- `src/services/mentorService.ts` (mesmo padrão de código)
- `src/services/journalService.ts` (exemplo de CRUD)

## Funções Necessárias

### Tipos

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

### Funções do Mentor

- createReview(data): Promise<MentorReview | null>
- updateReview(id, content): Promise<boolean>
- deleteReview(id): Promise<boolean>
- getReviewsForMentee(menteeId): Promise<MentorReview[]>

### Funções do Mentee

- getMyReviews(): Promise<MentorReview[]>
- getReviewsForTrade(tradeId): Promise<MentorReview[]>
- markReviewAsRead(id): Promise<boolean>
- getUnreadReviewCount(): Promise<number>

## Padrões a Seguir

- Usar snake_case para campos do DB, camelCase para TypeScript
- Funções de mapeamento DB -> TS
- Tratamento de erros com console.error
- Usar supabase.auth.getUser() para autenticação

## Critérios de Sucesso

- [ ] Arquivo criado em src/services/reviewService.ts
- [ ] Todos os tipos definidos
- [ ] Todas as funções implementadas
- [ ] TypeScript sem erros
```

---

## 📋 TASK 4: Adicionar JSDoc em Todos os Services

**Prioridade:** 🟡 Média | **Tempo estimado:** ~25 min

```markdown
## Contexto

Trading Journal Next.js. Os services precisam de documentação JSDoc.

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

/\*\*

- Descrição breve da função
- @param {tipo} nomeParam - Descrição do parâmetro
- @returns {Promise<tipo>} Descrição do retorno
- @example
- const result = await nomeFuncao(param);
  \*/

## Critérios de Sucesso

- [ ] Todas as funções exportadas documentadas
- [ ] Parâmetros e retornos descritos
- [ ] TypeScript sem erros
```

---

## 📋 TASK 5: Criar Testes Unitários para MentorService

**Prioridade:** 🟡 Média | **Tempo estimado:** ~45 min

```markdown
## Contexto

Trading Journal Next.js + Supabase. Precisamos de testes para garantir qualidade.

## Objetivo

Criar testes unitários com Vitest para src/services/mentorService.ts

## Arquivo a Criar

src/services/**tests**/mentorService.test.ts

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

## Casos de Teste

Para cada função:

1. Caso de sucesso
2. Caso de usuário não autenticado
3. Caso de erro do Supabase

## Critérios de Sucesso

- [ ] Arquivo de teste criado
- [ ] Mocks configurados
- [ ] Testes para todas as funções
- [ ] Testes passando
```

---

## 📋 TASK 6: Fix Lint Warnings

**Prioridade:** 🟢 Baixa | **Tempo estimado:** ~20 min

```markdown
## Contexto

Trading Journal Next.js. Existem alguns warnings de lint.

## Objetivo

Corrigir TODOS os warnings de lint sem quebrar funcionalidade.

## Comando

npm run lint

## Warnings Conhecidos

### src/app/admin/page.tsx

1. Linhas 124, 303, 354: Usando <img> ao invés de next/image
2. Linhas 419, 424: setState dentro de useEffect

## Tipos Comuns de Fixes

1. Variáveis não utilizadas - remover ou prefixar com \_
2. Imports não utilizados - remover
3. <img> → <Image /> - usar next/image
4. setState em useEffect - refatorar

## Regras

- NÃO usar eslint-disable comments
- NÃO mudar lógica de negócio
- APENAS corrigir warnings

## Critérios de Sucesso

- [ ] npm run lint passa sem warnings
- [ ] npm run build passa
```

---

## 📋 TASK 7: Criar Componente StudentCalendarModal

**Prioridade:** 🔴 Alta | **Tempo estimado:** ~40 min

```markdown
## Contexto

Trading Journal com sistema de mentoria. O mentor precisa visualizar o calendário do aluno.

## Objetivo

Criar componente StudentCalendarModal.

## Arquivo a Criar

src/components/mentor/StudentCalendarModal.tsx

## Props

interface StudentCalendarModalProps {
isOpen: boolean;
onClose: () => void;
menteeId: string;
menteeName: string;
}

## Referência de Design

Copiar estilo de: src/components/journal/DayDetailModal.tsx
Usar componente Modal de: src/components/ui/Modal.tsx

## Funcionalidades

1. Header com nome do aluno e botão fechar
2. Navegação de mês (< Dezembro 2024 >)
3. Grid de calendário (Dom-Sáb)
4. Cada dia mostra cor verde/vermelho baseado em P/L

## Critérios de Sucesso

- [ ] Componente criado
- [ ] Responsivo (mobile-first)
- [ ] Mesma estética do projeto
- [ ] TypeScript sem erros
```

---

## 📋 TASK 8: Auditoria de Segurança de URLs e Headers

**Prioridade:** 🔴 Alta | **Tempo estimado:** ~30 min

```markdown
## Contexto

Trading Journal Next.js 15 + Supabase. Verificar exposição de dados em URLs.

## Objetivo

Auditar e corrigir potenciais vulnerabilidades.

## Arquivos para Analisar

- src/middleware.ts
- src/app/dashboard/[accountId]/page.tsx
- src/app/share/[token]/page.tsx
- next.config.ts

## Verificações

1. IDs na URL são UUIDs (não sequenciais)
2. Mensagens de erro não expõem lógica interna
3. Headers de segurança configurados (HSTS, X-Frame-Options, etc)
4. Supabase ANON_KEY usada (não SERVICE_ROLE)

## Critérios de Sucesso

- [ ] Nenhum ID sequencial exposto
- [ ] Headers de segurança configurados
- [ ] Relatório criado em docs/SECURITY_AUDIT.md
```

---

## 📋 TASK 9: Reorganização de Pastas e Documentação

**Prioridade:** 🟡 Média | **Tempo estimado:** ~45 min

```markdown
## Contexto

Trading Journal Next.js. A estrutura de pastas precisa de organização para escalar.

## Objetivo

Reorganizar components, services, e documentar migrations.

## PARTE 1: Components

- Mover ClientProviders.tsx para src/components/layout/
- Criar pasta src/components/mentor/

## PARTE 2: Services

- Dividir communityService.ts (19KB) em:
  - src/services/community/playbookService.ts
  - src/services/community/leaderboardService.ts
- Mover mentorService.ts para src/services/mentor/inviteService.ts

## PARTE 3: Organizar SQL

Criar pasta supabase/sql/ organizada por domínio:

- core/ (000, 001)
- features/ (002, 003, 010)
- admin/ (004)
- mentor/ (005, 012, 016)
- community/ (006, 009, 011)
- fixes/ (007, 008, 013, 014, 015)

IMPORTANTE: NÃO alterar supabase/migrations/ - apenas criar cópias organizadas

## Critérios de Sucesso

- [ ] ClientProviders movido para layout/
- [ ] communityService dividido
- [ ] Pasta supabase/sql/ criada
- [ ] Build passa
```

---

## 🚀 Ordem Sugerida de Execução

1. ✅ **TASK 1** - Reorganizar componentes (FEITA)
2. ✅ **TASK 2** - Migration SQL (FEITA)
3. 📋 **TASK 3** - ReviewService (usa a migration)
4. 📋 **TASK 7** - StudentCalendarModal (feature visível)
5. 📋 **TASK 9** - Reorganização de pastas (estrutura)
6. 📋 **TASK 4** - JSDoc (documentação)
7. 📋 **TASK 5** - Testes (qualidade)
8. 📋 **TASK 6** - Lint fixes (polish)
9. 📋 **TASK 8** - Segurança (auditoria)

---

**Dica:** Copie uma task por vez. Espere o PR, revise, merge, e então envie a próxima!
