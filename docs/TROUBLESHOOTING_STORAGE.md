# 🔧 Solução: Erro de Upload de Imagens (RLS Policy)

## 📋 O Problema

Você está recebendo este erro ao migrar dados para o Supabase:

```
StorageApiError: new row violates row-level security policy
POST .../storage/v1/object/journal-images/... 400 (Bad Request)
```

**Causa:** O bucket `journal-images` do Supabase Storage não tem políticas (RLS Policies) configuradas para permitir uploads.

## ✅ Solução Rápida (2 minutos)

### Passo 1: Acesse o SQL Editor

1. Abra [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **"New Query"**

### Passo 2: Execute a Migration de Storage

Copie **TODO** o conteúdo do arquivo:

```
supabase/migrations/005_storage_complete_setup.sql
```

Cole no SQL Editor e clique em **"Run"** ou pressione `Ctrl+Enter`.

### Passo 3: Verificar

Ao final da execução, você deve ver uma tabela com **4 linhas** mostrando as políticas criadas:

| schemaname | tablename | policyname                   | cmd    |
| ---------- | --------- | ---------------------------- | ------ |
| storage    | objects   | Public Delete Journal Images | DELETE |
| storage    | objects   | Public Insert Journal Images | INSERT |
| storage    | objects   | Public Select Journal Images | SELECT |
| storage    | objects   | Public Update Journal Images | UPDATE |

Se ver essas 4 linhas, **está configurado corretamente**! ✅

### Passo 4: Testar a Migração

Volte para sua aplicação Next.js e clique novamente no botão **"Migrar para Nuvem"**.

Agora o upload de imagens deve funcionar sem erros!

## 🔍 O que foi feito?

A migration `005_storage_complete_setup.sql` fez 4 coisas:

1. ✅ Criou o bucket `journal-images` (ou garantiu que está público)
2. ✅ Habilitou Row-Level Security na tabela `storage.objects`
3. ✅ Criou 4 políticas para permitir: SELECT, INSERT, UPDATE, DELETE
4. ✅ Configurou acesso público (sem autenticação necessária)

## 🆘 Troubleshooting

### "Erro ao executar a query"

Se houver erro ao executar, tente executar o arquivo `004_fix_storage_rls.sql` primeiro, que remove políticas antigas.

### "Já executei mas continua dando erro"

1. Verifique se o bucket existe:

   - Vá em **Storage** no Supabase Dashboard
   - Deve haver um bucket chamado `journal-images`
   - Deve estar marcado como **Public**

2. Limpe o cache do navegador e recarregue a página

3. Verifique suas credenciais no `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
   ```

### "As policies foram criadas mas dá erro 403"

Certifique-se de que o bucket está marcado como **público**:

```sql
UPDATE storage.buckets
SET public = true
WHERE id = 'journal-images';
```

## 📚 Referências

- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
