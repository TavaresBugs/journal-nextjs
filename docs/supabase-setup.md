# Guia de Configuração do Supabase

## 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha:
   - **Name:** trading-journal (ou nome de sua preferência)
   - **Database Password:** crie uma senha forte
   - **Region:** escolha a região mais próxima
5. Aguarde a criação do projeto (1-2 minutos)

## 2. Obter Credenciais

1. Na dashboard do projeto, vá em **Settings** > **API**
2. Copie as credenciais:
   - **Project URL** (ex: `https://xxx.supabase.co`)
   - **Project API Key** (anon/public key)

## 3. Configurar Variáveis de Ambiente

No projeto Next.js, crie o arquivo `.env.local`:

```bash
cd projeto-nextjs
cp env.example.txt .env.local
```

Edite `.env.local` e cole suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

## 4. Executar Migrations

### Opção A: Via SQL Editor (Recomendado)

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em "New Query"
3. Copie todo o conteúdo de `supabase/migrations/001_initial_schema.sql`
4. Cole no editor
5. Clique em "Run" para executar

### Opção B: Via Supabase CLI (npx)

```bash
# Login (não requer instalação global)
npx supabase login

# Vincular ao projeto
npx supabase link --project-ref seu-project-ref

# Executar migrations
npx supabase db push
```

> [!IMPORTANT] > **Após executar a migration inicial (001_initial_schema.sql)**, você DEVE executar também a migration de storage (`005_storage_complete_setup.sql`) para habilitar o upload de imagens.

### Executar Migration de Storage (OBRIGATÓRIO)

Para permitir uploads de imagens durante a migração do localStorage, execute também:

1. No **SQL Editor**, abra uma nova query
2. Copie e execute o conteúdo de `supabase/migrations/005_storage_complete_setup.sql`
3. Verifique que as 4 políticas foram criadas (a query final mostrará isso)

Sem isso, você receberá o erro: **"new row violates row-level security policy"** ao fazer upload.

## 5. Criar Storage Bucket

1. No Supabase Dashboard, vá em **Storage**
2. Clique em "Create a new bucket"
3. Configurações:
   - **Name:** `journal-images`
   - **Public:** ✅ Yes (marcar como público)
   - **Allowed MIME types:** deixe vazio (aceitar tudo) ou especifique: `image/*`
   - **Max file size:** 5MB (ou conforme necessário)
4. Clique em "Create bucket"

## 6. Verificar Instalação

Execute no SQL Editor para verificar as tabelas criadas:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

Deve retornar:

- accounts
- trades
- journal_entries
- daily_routines
- settings

## 7. Testar Conexão

No projeto Next.js:

```bash
npm run dev
```

Abra `http://localhost:3000` e verifique se a aplicação inicializa sem erros de conexão.

## Troubleshooting

### Erro de Conexão

Se aparecer erro de conexão:

- Verifique se as variáveis de ambiente estão corretas
- Confirme que o arquivo `.env.local` está na raiz do projeto
- Reinicie o servidor de desenvolvimento (`npm run dev`)

### Erro no Upload de Imagens

Se o upload de imagens falhar:

- Verifique se o bucket `journal-images` está marcado como público
- Confirme que o bucket foi criado com o nome exato `journal-images`
- Verifique as políticas RLS do Storage (devem permitir INSERT e SELECT)

### Erro nas Migrations

Se houver erro ao executar as migrations:

- Execute as queries uma a uma para identificar onde falhou
- Verifique se a extensão `uuid-ossp` está habilitada
- Confirme que não há tabelas com o mesmo nome já criadas

## Modo Browser (Sem Supabase)

Se preferir usar apenas localStorage temporariamente:

1. Não configure as variáveis de ambiente do Supabase
2. A aplicação usará automaticamente o modo browser
3. Todos os dados ficarão no localStorage do navegador
4. Você pode migrar para Supabase depois via interface web

## Próximos Passos

Após configurar o Supabase:

- [ ] Teste criar uma conta
- [ ] Teste adicionar um trade
- [ ] Teste fazer upload de uma imagem de journal
- [ ] Teste backup/restore
- [ ] Configure autenticação (opcional, fase futura)

## Recursos Úteis

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
