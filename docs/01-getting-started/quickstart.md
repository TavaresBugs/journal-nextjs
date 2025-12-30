# 🚀 Quickstart - Trading Journal Pro

> **Tempo:** ~5 minutos | **Nível:** Iniciante

Setup mínimo para rodar o projeto localmente.

---

## Pré-requisitos

- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)
- Conta [Supabase](https://supabase.com) (gratuita)

---

## 1. Clone e Instale

```bash
git clone https://github.com/TavaresBugs/journal-nextjs.git
cd journal-nextjs
npm install
```

---

## 2. Configure Ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
DATABASE_URL=postgresql://...
```

> ⚠️ Obtenha as chaves em: Supabase Dashboard → Settings → API

---

## 3. Inicie

```bash
npm run dev
```

Acesse: **http://localhost:3000** 🎉

---

## 4. Verifique

```bash
npm test           # Testes (1120+ passando)
npm run type-check # TypeScript
npm run lint       # ESLint
```

---

## Próximos Passos

- [Instalação Detalhada](./installation.md) - Troubleshooting, banco local
- [Arquitetura](../02-architecture/overview.md) - Como funciona
- [Contribuindo](../04-development/contributing.md) - Como ajudar

---

## Problemas?

| Erro                         | Solução                      |
| ---------------------------- | ---------------------------- |
| `Missing env variables`      | Verifique `.env.local`       |
| `Database connection failed` | Confira credenciais Supabase |
| `npm install` lento          | `npm cache clean --force`    |

**Mais ajuda?** → [GitHub Issues](https://github.com/TavaresBugs/journal-nextjs/issues)
