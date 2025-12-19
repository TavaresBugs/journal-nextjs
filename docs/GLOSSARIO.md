# 📖 Glossário - Trading Journal Pro

> **Objetivo:** Definições de termos técnicos usados no projeto.
> **Público-alvo:** Desenvolvedores iniciantes
> **Última atualização:** 18 de Dezembro de 2025

---

## A

### App Router

Novo sistema de roteamento do Next.js 14+. Usa a pasta `app/` em vez de `pages/`. Suporta Server Components, layouts aninhados e streaming.

### Atomic Design

Metodologia de design que organiza componentes em níveis: Átomos → Moléculas → Organismos → Templates → Páginas. No projeto, `components/ui/` são os átomos.

---

## B

### BaaS (Backend as a Service)

Solução que fornece backend pronto (banco, auth, storage) sem precisar criar servidor. Exemplo: Supabase, Firebase.

### Breakeven

Trade que não teve lucro nem prejuízo. PnL = 0.

---

## C

### Client Component

Componente React que roda no navegador. Usa `'use client'` no topo do arquivo. Necessário para hooks, eventos e interatividade.

### Coverage (Cobertura de Testes)

Porcentagem do código que é exercitada pelos testes. 60% significa que 60% das linhas são testadas.

---

## D

### DTO (Data Transfer Object)

Objeto que define a estrutura de dados para transferência entre camadas. Exemplo: `CreateTradeDTO` define campos para criar um trade.

### Drawdown

Queda percentual do pico do capital até o vale. Máximo drawdown de 10% significa que nunca pode perder mais de 10% do pico.

---

## E

### Equity Curve

Gráfico que mostra a evolução do capital ao longo do tempo. Subindo = lucrando, descendo = perdendo.

---

## F

### FVG (Fair Value Gap)

Conceito de Smart Money: região de preço onde há desequilíbrio entre compradores e vendedores. O preço tende a "preencher" esse gap.

---

## H

### HTF (Higher Time Frame)

Timeframe maior usado para análise. Semanal (W), Diário (D), 4 Horas (H4). Usado para definir viés direcional.

### Hook (Custom Hook)

Função React que encapsula lógica reutilizável. Começa com `use`. Exemplo: `useTrades()` busca trades do servidor.

---

## J

### JWT (JSON Web Token)

Token usado para autenticação. Contém informações do usuário encodadas. Supabase Auth usa JWT.

---

## L

### LTF (Lower Time Frame)

Timeframe menor usado para entrada precisa. 15 minutos (M15), 5 minutos (M5), 3 minutos (M3).

### Lot

Tamanho da posição no Forex. 1 lot = 100.000 unidades. Mini lot = 0.1, Micro lot = 0.01.

---

## M

### Migration

Arquivo SQL que altera a estrutura do banco de dados. Aplicadas em ordem para evoluir o schema.

### Mutation (React Query)

Operação que modifica dados no servidor (POST, PUT, DELETE). Diferente de Query que apenas lê.

---

## O

### Order Block

Conceito de Smart Money: região onde instituições colocaram orders significativas. O preço tende a reagir nessas zonas.

---

## P

### PnL (Profit and Loss)

Lucro ou prejuízo de um trade ou período. PnL positivo = lucro, negativo = prejuízo.

### Playbook

Conjunto documentado de regras para uma estratégia de trading. Define entradas, saídas, gestão de risco.

### Prop Firm

Empresa que fornece capital para traders operarem. O trader fica com parte dos lucros.

---

## R

### R-Multiple

Medida de retorno em relação ao risco. R:2 significa que ganhou 2x o que arriscou.

### React Query

Biblioteca para gerenciar estado do servidor em React. Fornece cache, loading states, refetch automático.

### Repository Pattern

Padrão que isola acesso a dados do resto do código. Repositório = interface para o banco.

### RLS (Row Level Security)

Sistema do PostgreSQL/Supabase que filtra linhas baseado em policies. Cada usuário só vê seus dados.

---

## S

### Server Component

Componente React que renderiza no servidor. Não precisa `'use client'`. Reduz JavaScript enviado ao navegador.

### Session (Trading)

Período de maior liquidez no mercado. Asia (Tokyo), London, New York. Cada um tem características diferentes.

### Smart Money

Conceito que grandes instituições movem o mercado. Traders tentam identificar onde estão posicionados.

### Stale Time

Tempo que React Query considera dados "frescos". Durante esse tempo, não refaz a query.

---

## T

### Telemetria

Dados extras coletados sobre trades para análise. Sessão, alinhamento HTF, qualidade de entrada.

---

## U

### Upsert

Operação que insere se não existe, atualiza se existe. Combina INSERT + UPDATE.

---

## W

### WebP

Formato de imagem moderno do Google. ~30% menor que PNG/JPEG com mesma qualidade.

### Win Rate

Porcentagem de trades vencedores. 60% win rate = 6 de cada 10 trades são lucrativos.

---

## Z

### Zod

Biblioteca TypeScript para validação de dados. Define schemas e valida objetos em runtime.

### Zustand

Biblioteca de gerenciamento de estado para React. Mais simples que Redux, menos boilerplate.

---

**Mantido por:** [@TavaresBugs](https://github.com/TavaresBugs)
