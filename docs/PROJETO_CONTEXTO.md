# 📋 Contexto do Projeto - Trading Journal Pro

> **Este arquivo serve como contexto para Agentes de IA e Desenvolvedores.**

---

## 🚀 Sobre o Projeto

**Trading Journal Pro** é uma aplicação Next.js 14+ (App Router) para gestão profissional de trading.

- **Stack:** TypeScript, Tailwind CSS, shadcn/ui.
- **Backend:** Supabase (Auth, Postgres, Storage, RLS).
- **Estado:** Zustand + React Query.

## 📍 Situação Atual (Dezembro 2025)

O projeto passou por uma refatoração massiva (v0.9.0):

- **Atomic Design:** Componentes em `src/components/ui` são a fonte da verdade.
- **Unificação:** Modais e tabelas padronizados.
- **Testes:** 287 testes unitários passando.

## 🛠️ Regras de Desenvolvimento

1.  **Strict Types:** Não usar `any`.
2.  **Server Components:** Usar sempre que possível (exceto para interatividade).
3.  **Supabase RLS:** Nunca confiar no frontend para segurança; garantir Policies no banco.
4.  **UI:** Usar `components/ui/*`. Não criar estilos ad-hoc.

## 📂 Estrutura Chave

- `src/lib/services`: Lógica de negócio.
- `src/lib/repositories`: Queries ao banco.
- `src/components/ui`: Design System.
- `docs/`: Documentação técnica.

## 🎯 Objetivos Q1 2026

- Integração com APIs externas (Brokers, News).
- Mobile App.
- Aumento de cobertura de testes.
