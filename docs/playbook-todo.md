# Playbook - TODO List

## ✅ Concluído

- [x] Criar modal de criação de playbook
- [x] Aba "Informações Gerais" (emoji, cor, nome, descrição)
- [x] Aba "Regras do Playbook" (3 grupos padrão)
- [x] Criar migration do Supabase (`009_playbooks.sql`)
- [x] Criar tipos TypeScript (`Playbook`, `RuleGroup`)
- [x] Criar `usePlaybookStore` com CRUD completo
- [x] Integrar store com modal de criação

## 🚧 Pendente

### 1. Carregar Playbooks no Dashboard

- [ ] Adicionar `useEffect` para carregar playbooks ao montar dashboard
- [ ] Usar `loadPlaybooks(accountId)` do store

### 2. Exibir Playbooks no PlaybookGrid

- [ ] Atualizar `PlaybookGrid.tsx` para mostrar playbooks criados
- [ ] Exibir ícone e cor customizados de cada playbook
- [ ] Mostrar métricas por playbook (Win Rate, P&L, etc.)
- [ ] Adicionar opção para editar/deletar playbook

### 3. Integrar Playbook com Trades

- [ ] Adicionar dropdown "Playbook/Estratégia" no `TradeForm`
- [ ] Carregar lista de playbooks disponíveis
- [ ] Ao selecionar playbook, preencher campo `strategy` do trade com o nome do playbook
- [ ] Garantir compatibilidade com estratégias antigas (texto livre)

### 4. Visualizar Regras do Playbook

- [ ] Criar modal/drawer para visualizar regras de um playbook
- [ ] Botão "Ver Regras" em cada card de playbook no grid
- [ ] Exibir todos os grupos de regras e suas regras

### 5. Editar Playbook

- [ ] Criar `EditPlaybookModal` (reutilizar CreatePlaybookModal?)
- [ ] Botão "Editar" em cada card de playbook
- [ ] Permitir alterar nome, descrição, ícone, cor, regras
- [ ] Salvar alterações via `updatePlaybook()`

### 6. Deletar Playbook

- [ ] Botão "Deletar" em cada card (com confirmação)
- [ ] Chamar `removePlaybook(id)`
- [ ] Decidir o que fazer com trades que usam esse playbook

## 🎨 Melhorias Futuras (Opcional)

- [ ] Drag & drop para reordenar regras
- [ ] Grupos customizados de regras (além dos 3 padrões)
- [ ] Templates de playbooks prontos
- [ ] Exportar/importar playbooks (JSON)
- [ ] Estatísticas avançadas por playbook
- [ ] Gráficos de performance por playbook

---

**Nota**: A migration já foi criada. Rodar `npx supabase db reset` para aplicar todas as migrations.
