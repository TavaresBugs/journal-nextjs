# 🚧 Funcionalidades Pendentes e Roadmap

Este documento consolida as funcionalidades planejadas, melhorias futuras e itens do sistema legado que ainda não foram totalmente migrados ou implementados.

## 1. 📖 Playbooks (Melhorias Futuras)

Embora o CRUD e a integração básica estejam completos, as seguintes melhorias estão planejadas:

- [ ] **Drag & Drop de Regras:** Permitir reordenar regras arrastando-as.
- [ ] **Grupos Customizados:** Permitir criar grupos de regras além dos padrões (Mercado, Entrada, Saída).
- [ ] **Templates:** Oferecer templates de playbooks prontos (ex: ICT, SMC, Price Action).
- [ ] **Importar/Exportar:** Permitir compartilhar playbooks via arquivo JSON.
- [ ] **Estatísticas Avançadas:** Dashboard dedicado com métricas de performance por playbook (Win Rate, Profit Factor, etc.).

## 2. 📅 Calendário e Rotinas

- [ ] **Resumo Visual no Calendário:** Indicação clara de dias de Profit (Verde) vs Loss (Vermelho) diretamente na célula do dia.
- [ ] **Rotinas Diárias (Checklist):**
  - Garantir persistência completa por data.
  - Visualização integrada no modal de detalhes do dia.
  - Relatório de adesão à rotina (quantos dias cumpriu o checklist).

## 3. 📊 Dashboard e Métricas

- [ ] **Trava de Ativo (Lock Asset):** Funcionalidade para "travar" um ativo no formulário de trade para evitar mudanças acidentais durante uma sessão.
- [ ] **Gráficos Avançados:**
  - Curva de capital (Equity Curve).
  - Distribuição de trades por hora/dia da semana.
  - Gráfico de dispersão (MFE/MAE).

## 4. 🖼️ Journal e Mídia

- [ ] **Carousel de Imagens:** Navegação facilitada entre múltiplas imagens de um mesmo trade/dia sem precisar fechar o modal.
- [ ] **Anotações em Imagens:** Ferramenta básica de desenho/anotação sobre os screenshots carregados.

## 5. 🤖 Agente IA (Roadmap)

- [ ] **Análise de Padrões:** Identificar automaticamente comportamentos repetitivos em trades vencedores/perdedores.
- [ ] **Alertas de Risco:** Avisar quando o usuário estiver desviando de suas regras ou excedendo limites de risco.
- [ ] **Sugestões de Melhoria:** Dicas baseadas nos dados do próprio usuário.

## 6. ⚙️ Configurações e Sistema

- [ ] **Backup Automático:** Configurar backups periódicos automáticos para o Supabase Storage.
- [ ] **Temas Customizados:** Permitir que o usuário crie seu próprio tema de cores além do Zorin/Dark padrão.
- [ ] **Internacionalização (i18n):** Suporte completo para outros idiomas (Inglês, Espanhol).

---

**Nota:** Este documento substitui os antigos `legacy-inventory.md` e `playbook-todo.md`.
