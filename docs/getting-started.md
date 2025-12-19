# 🚀 Getting Started

> **Tempo estimado:** 10-15 minutos
> **Nível:** Iniciante

Bem-vindo ao **Trading Journal Pro**! Este guia vai te ajudar a configurar o projeto localmente e começar a desenvolver.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

| Ferramenta  | Versão Mínima | Verificar        |
| ----------- | ------------- | ---------------- |
| **Node.js** | 18+           | `node --version` |
| **npm**     | 9+            | `npm --version`  |
| **Git**     | 2.30+         | `git --version`  |

Você também precisa de uma conta no [Supabase](https://supabase.com/) (gratuito).

---

## 📥 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/TavaresBugs/journal-nextjs.git
cd journal-nextjs
```

### 2. Instale as Dependências

```bash
npm install
```

> **💡 Dica:** Se der erro de permissão, tente `sudo npm install` (Linux/Mac).

### 3. Configure as Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:

```env
# Supabase (obtenha em: https://supabase.com/dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **⚠️ Atenção:** Nunca compartilhe sua `SERVICE_ROLE_KEY`. Ela tem acesso total ao banco.

### 4. Configure o Banco de Dados

Execute as migrations do Supabase:

```bash
npm run db:migrate
```

Ou configure manualmente no painel do Supabase seguindo [DATABASE.md](./database.md).

### 5. Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000** 🎉

---

## 🧪 Verificando a Instalação

Execute os testes para garantir que tudo está funcionando:

```bash
npm test
```

Você deve ver algo como:

```
 ✓ 671 tests passed
 Test suites: 40 passed
```

---

## 📁 Estrutura do Projeto

Aqui está uma visão simplificada das pastas principais:

```
journal-nextjs/
├── src/
│   ├── app/           # Páginas da aplicação (Next.js App Router)
│   ├── components/    # Componentes React reutilizáveis
│   ├── hooks/         # Custom hooks (lógica compartilhada)
│   ├── services/      # Lógica de negócio
│   ├── lib/           # Utilitários e configurações
│   └── types/         # Tipos TypeScript
├── docs/              # Documentação (você está aqui!)
└── supabase/          # Migrations do banco de dados
```

Cada pasta possui um `README.md` com mais detalhes. Clique para explorar:

- [📦 Components](../src/components/README.md) - Design System e componentes
- [🔧 Services](../src/services/README.md) - Lógica de negócio
- [🪝 Hooks](../src/hooks/README.md) - Custom hooks
- [📐 Types](../src/types/README.md) - Tipos TypeScript
- [📦 Repositories](../src/lib/repositories/README.md) - Acesso a dados

---

## 🛠️ Comandos Úteis

| Comando              | Descrição                          |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Inicia servidor de desenvolvimento |
| `npm run build`      | Gera build de produção             |
| `npm test`           | Executa todos os testes            |
| `npm run test:watch` | Testes em modo watch               |
| `npm run lint`       | Verifica erros de lint             |
| `npm run type-check` | Verifica tipos TypeScript          |

---

## ❓ Problemas Comuns

### "Error: Missing environment variables"

**Causa:** Arquivo `.env.local` não configurado ou variável faltando.

**Solução:** Verifique se todas as variáveis estão definidas:

```bash
cat .env.local
```

### "Error: Database connection failed"

**Causa:** Credenciais do Supabase incorretas.

**Solução:**

1. Acesse o [dashboard do Supabase](https://supabase.com/dashboard)
2. Vá em Settings → API
3. Copie a URL e as chaves corretas

### "npm install" demora muito

**Causa:** Muitas dependências ou conexão lenta.

**Solução:** Use o cache do npm:

```bash
npm cache clean --force
npm install
```

---

## 🎯 Próximos Passos

Agora que o projeto está rodando, recomendamos:

1. **Explore o código** - Comece pelo `src/app/dashboard/`
2. **Leia a arquitetura** - [architecture.md](./architecture.md)
3. **Entenda o Design System** - [design-system.md](./design-system.md)
4. **Configure seu editor** - Instale extensões de ESLint e Prettier

---

## 🔗 Links Úteis

- [Overview Técnico](./overview.md) - Visão geral do projeto
- [Arquitetura](./architecture.md) - Como o código está organizado
- [Contribuindo](./contributing.md) - Como contribuir com o projeto
- [Glossário](./glossary.md) - Termos técnicos explicados

---

**Precisa de ajuda?** Abra uma issue no GitHub ou contate [@TavaresBugs](https://github.com/TavaresBugs).
