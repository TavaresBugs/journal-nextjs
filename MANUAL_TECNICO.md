# Manual Técnico & Arquitetura do Sistema: WolfTab (Journal-NextJs)

> **Versão do Documento:** 1.0 (Pós-Refatoração Sprint 5)
> **Público Alvo:** Gestores de Produto, Investidores e Desenvolvedores Iniciantes.

---

## 1. Visão Geral e Stack Tecnológica

O **WolfTab** é uma aplicação web moderna de alta performance focada em _Journaling_ para traders. Ela funciona como um "diário digital inteligente", onde o usuário registra suas operações, analisa sua performance e cria estratégias.

### Tecnologia ("Stack")

Imagine uma casa. A tecnologia é o material usado para construí-la:

- **Fachada (Frontend):** **Next.js (React)**. É o que o usuário vê e clica. Rápido e moderno.
- **Estilo (CSS):** **Tailwind CSS**. Garante que o visual seja bonito e responsivo (funciona no celular e PC).
- **Gerente de Dados (Backend as a Service):** **Supabase**. É uma plataforma que nos dá banco de dados, login (autenticação) e armazenamento de arquivos prontos, sem precisarmos configurar servidores complexos.
- **Memória do Navegador (State):** **Zustand**. Gerencia informações temporárias (ex: o que está digitado no formulário agora).
- **Ajudantes de Código:** **TypeScript**. Uma "versão rigorosa" do JavaScript que impede erros bobos de digitação.

---

## 2. Mapa Geral da Arquitetura (O Fluxo de Dados)

Imagine o fluxo de um restaurante:

1.  **O Cliente (Usuário)** olha o cardápio e faz um pedido (Clica em "Salvar Trade").
2.  **O Garçom (Services/Hooks)** anota o pedido, valida se é possível (Regras de Negócio) e leva para a cozinha.
3.  **A Cozinha (Supabase/API)** recebe o pedido, prepara (Salva no Banco de Dados) e confirma.
4.  **O Garçom (Hook)** volta à mesa e avisa: "Seu prato está pronto" (Atualização da tela).

### Diagrama em Texto

[ USUÁRIO ]
⬇️ Interage com a Interface (Componentes UI)
[ FRONTEND - Next.js ]
⬇️ Coleta e valida dados (Zustand + Hooks)
[ CAMADA DE SERVIÇO (Services) ]
⬇️ Envia solicitação segura
[ NUVEM - SUPABASE ]
⬇️ Processa: Banco de Dados (PostgreSQL) + Login (Auth)
⬆️ Retorna confirmação ou dados
[ FRONTEND ]
⬆️ Atualiza a tela instantaneamente

---

## 3. Organização das Pastas (O Mapa do Tesouro)

O projeto está organizado na pasta `src/` (Source/Código-fonte). Aqui está o que cada gaveta guarda:

### 📂 `src/app` (O Roteador)

- **Propósito:** Define as páginas do site (URLs). Se existe uma pasta aqui, existe uma página no site.
- **Exemplos:**
  - `dashboard/[accountId]/page.tsx`: A página principal onde o usuário vê seus gráficos e trades.
  - `login/page.tsx`: A tela de entrada.

### 📂 `src/components` (Os Blocos de Montar)

Aqui vive a interface visual. É dividido em subpastas por "assunto":

- **`ui/` (Biblioteca Base):** Botões, inputs, cards genéricos. São os "tijolos" básicos.
  - _Ex:_ `Button.tsx` (Botão padrão), `FormLayout.tsx` (Estrutura de formulários).
- **`trades/` (Módulo de Trades):** Tudo relacionado a operações financeiras.
  - _Ex:_ `TradeForm.tsx` (O formulário complexo de registro), `TradeList.tsx` (A tabela de histórico).
- **`playbook/`:** Relacionado às estratégias de estudo.
  - _Ex:_ `PlaybookFormModal.tsx` (Janela para criar nova estratégia).

### 📂 `src/hooks` (As Ferramentas de Lógica)

Arquivos que começam com `use`. Eles contêm a lógica "invisível" que faz a tela funcionar.

- _Ex:_ `useTradeForm.ts`: Controla o que acontece quando você digita no formulário de trade (cálculos automáticos, validação).
- _Ex:_ `useDashboardData.ts`: Busca os dados calculados para mostrar os gráficos.

### 📂 `src/services` (Os Mensageiros)

Responsáveis por falar com o banco de dados (Supabase).

- _Ex:_ `tradeService.ts`: Tem funções como `createTrade`, `deleteTrade`.
- _Ex:_ `authService.ts`: Lida com login e senha.

### 📂 `src/store` (A Memória Global)

Onde guardamos dados que precisam ser acessados por toda a aplicação.

- _Ex:_ `useSettingsStore.ts`: Guarda as configurações do usuário (ativos favoritos, estratégias).

---

## 4. Fluxo de Trabalho: Caso de Uso "Registrar um Trade"

Este é o coração do sistema. Veja o que acontece nos bastidores quando o usuário registra uma operação:

### Passo 1: Abrir o Modal

- **Ação:** Usuário clica em "Adicionar Trade" no Dashboard.
- **Código:** O componente `DashboardHeader.tsx` chama a função de abrir modal.
- **Visual:** O `TradeForm.tsx` é exibido na tela.

### Passo 2: Preenchimento Inteligente

- **Ação:** Usuário seleciona o ativo "EURUSD".
- **Código:**
  - O componente `AssetSelect` (em `DomainSelects.tsx`) recebe o clique.
  - Ele avisa o hook `useTradeForm.ts` -> "Ei, o ativo mudou para EURUSD".
  - O hook recalcula automaticamente o risco/retorno estimado.

### Passo 3: Validação (O Guardião)

- **Ação:** Usuário tenta salvar sem colocar o preço.
- **Código:**
  - O hook `useTradeValidation.ts` entra em ação.
  - Ele verifica os dados contra regras (Schema Zod).
  - Como falta preço, ele bloqueia o envio e mostra uma borda vermelha no input através do componente `FormGroup` (em `FormLayout.tsx`).

### Passo 4: Envio (O Salto)

- **Ação:** Usuário corrige e clica em "Salvar".
- **Código:**
  - `TradeForm.tsx` chama `handleSubmit`.
  - O hook `useTradeSubmit.ts` empacota os dados e chama `tradeService.createTrade()`.
  - O `tradeService` conecta no Supabase e grava a linha na tabela SQL.

### Passo 5: Atualização (O Retorno)

- **Código:**
  - O Supabase confirma: "Salvo com sucesso, ID 123".
  - O software exibe um `Toast` (notificação verde) na tela.
  - A lista de trades (`TradeList.tsx`) atualiza sozinha para mostrar o novo item.

---

## 5. Descrição dos Módulos Principais

### Módulo A: Sistema de Trade (`components/trades`)

- **Problema que resolve:** Permite registrar e visualizar operações financeiras complexas.
- **Arquitetura:**
  ```text
  TradeForm.tsx (UI Principal)
     ├── FormLayout (Visualização)
     ├── DomainSelects (Inputs Inteligentes)
     └── Hooks (Cérebro):
          ├── useTradeForm (Estado)
          ├── useTradeValidation (Regras)
          └── useTradeSubmit (Envio)
  ```

### Módulo B: Dashboard (`app/dashboard`)

- **Problema que resolve:** Visão panorâmica da performance.
- **Arquitetura:**
  - A página (`page.tsx`) é apenas um esqueleto.
  - Ela usa `useDashboardData` para buscar números.
  - Exibe `DashboardMetrics` (topo) e abas de conteúdo.

### Módulo C: Playbooks (`components/playbook`)

- **Problema que resolve:** Criação de "receitas de bolo" (estratégias) para seguir.
- **Arquitetura:**
  - Usa um modal unificado `PlaybookFormModal.tsx` que serve tanto para criar quanto para editar, evitando código duplicado.

---

## 6. Pontos Frágeis e Atenção

Mesmo um sistema robusto tem pontos de atenção:

1.  **Cálculos no Frontend:**

    - **Risco:** Alguns cálculos de lucro (PnL) são feitos no navegador (JavaScript) para ser rápido.
    - **Problema:** Se alguém malicioso alterar o código no navegador, pode ver um valor errado (embora o banco de dados geralmente recalcule ou aceite o valor enviado).
    - **Solução:** Garantir que o Backend (Supabase Functions) valide os números críticos antes de salvar permanentemente.

2.  **Conexão de Internet:**
    - **Risco:** O sistema depende 100% de estar online para salvar no Supabase.
    - **Problema:** Se a internet cair no meio do clique "Salvar", o usuário pode perder o que digitou.
    - **Solução (Futura):** Implementar "Salvar Rascunho Local" (Offline mode).

---

## 7. Sugestões de Melhoria (Roadmap Técnico)

### Curto Prazo (Fácil)

- ✅ **Modularização (Feito nos Sprints 1-5):** O código agora está limpo e separado.
- **Testes Automáticos:** Criar mais testes para o `TradeForm` garantir que as validações nunca quebrem.

### Médio Prazo

- **Modo Offline:** Usar uma tecnologia chamada _React Query_ ou _Local Storage_ para salvar o formulário enquanto o usuário digita, prevenindo perda de dados se o navegador fechar.

### Longo Prazo (Ambicioso)

- **Analytics Avançado:** Mover os cálculos pesados de performance (curva de patrimônio) para o servidor, para que o celular do usuário não fique lento se ele tiver 10.000 trades.

---

## 8. Guia de Leitura para o Curioso

Se você quer abrir o código e olhar por conta própria, siga esta trilha:

1.  **Comece pelo visual:** Abra `src/components/ui/Button.tsx`. É fácil de entender, é apenas um botão com cores.
2.  **Entenda a estrutura:** Abra `src/components/ui/FormLayout.tsx`. Veja como criamos padrões visuais (`FormSection`, `FormRow`).
3.  **Veja o formulário:** Abra `src/components/trades/TradeForm.tsx`. Tente identificar onde ele usa os componentes do passo 2.
4.  **Veja a mágica:** Abra `src/hooks/useTradeForm.ts`. Tente achar onde ele faz a conta de `Risco` e `Retorno`.

---

_Este documento reflete a arquitetura do WolfTab em Dezembro de 2025._
