# 🚧 Funcionalidades Pendentes e Roadmap

> Última atualização: Dezembro 2024

Este documento consolida as funcionalidades planejadas, melhorias futuras e itens pendentes de implementação.

---

## ✅ Funcionalidades Implementadas

### Core

- [x] Multi-contas com gerenciamento de carteiras
- [x] CRUD completo de trades
- [x] Journal multi-timeframe (9 TFs)
- [x] Upload de imagens + paste clipboard
- [x] Calendário com visualização mensal
- [x] Métricas básicas e avançadas
- [x] Rotinas diárias (checklist)
- [x] Backup/Restore de dados

### Playbooks

- [x] CRUD de playbooks
- [x] Regras organizadas (Mercado, Entrada, Saída)
- [x] Edição inline de regras
- [x] Vinculação de trades a playbooks

### Gráficos

- [x] Recharts: Win Rate, Distribuição, Grid Mensal
- [x] Lightweight Charts: Curva de Capital, Drawdown

### Compartilhamento

- [x] Páginas públicas de journal entries
- [x] Preview de imagens com lightbox
- [x] Formatação de notas (Acertos/Melhorias/Erros)

### Segurança

- [x] Google OAuth via Supabase
- [x] Row Level Security (RLS)
- [x] Middleware de proteção de rotas
- [x] Tratamento robusto de erros

### UI/UX

- [x] Tema Zorin OS (Dark Mode)
- [x] Design responsivo (Mobile-first)
- [x] Gradientes e animações premium
- [x] Glassmorphism com background blur

---

## 📋 Pendentes

### 1. 📖 Playbooks (Melhorias)

| Feature             | Descrição                        | Prioridade |
| ------------------- | -------------------------------- | ---------- |
| Drag & Drop         | Reordenar regras arrastando      | 🟡 Média   |
| Grupos Customizados | Criar grupos além dos padrões    | 🟢 Baixa   |
| Templates           | Playbooks prontos (ICT, SMC, PA) | 🟡 Média   |
| Import/Export       | Compartilhar via JSON            | 🟢 Baixa   |
| Dashboard Stats     | Métricas por playbook            | 🟡 Média   |

### 2. 📊 Dashboard e Métricas

| Feature              | Descrição                  | Prioridade |
| -------------------- | -------------------------- | ---------- |
| Lock Asset           | Travar ativo no formulário | 🟢 Baixa   |
| Gráfico MFE/MAE      | Dispersão de trades        | 🟡 Média   |
| Distribuição Horária | Trades por hora/dia        | 🟢 Baixa   |

### 3. 🖼️ Journal e Mídia

| Feature          | Descrição                        | Prioridade |
| ---------------- | -------------------------------- | ---------- |
| Carousel Imagens | Navegação entre imagens no modal | 🟡 Média   |
| Anotações        | Desenhar sobre screenshots       | 🟢 Baixa   |

### 4. 🤖 Agente IA (Roadmap)

| Feature            | Descrição                              | Prioridade |
| ------------------ | -------------------------------------- | ---------- |
| Análise de Padrões | Identificar comportamentos repetitivos | 🔴 Alta    |
| Alertas de Risco   | Avisar desvios de regras               | 🔴 Alta    |
| Sugestões          | Dicas baseadas nos dados               | 🟡 Média   |

### 5. ⚙️ Sistema

| Feature            | Descrição                        | Prioridade |
| ------------------ | -------------------------------- | ---------- |
| Backup Automático  | Backups periódicos para Supabase | 🟡 Média   |
| Temas Customizados | Criar paletas de cores           | 🟢 Baixa   |
| i18n               | Suporte a EN/ES                  | 🟢 Baixa   |

---

## 🎯 Próximos Passos Sugeridos

1. **Curto prazo:** Carousel de imagens, Lock Asset
2. **Médio prazo:** Dashboard de Playbooks, Gráfico MFE/MAE
3. **Longo prazo:** Agente IA, Internacionalização

---

## 📝 Notas

- Prioridades podem mudar conforme feedback de uso
- Features marcadas como 🔴 Alta são candidatas para próximos sprints
