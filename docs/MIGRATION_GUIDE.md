# Guia: Executar Migrations de Autenticação

## 📋 Ordem de Execução

Execute estes scripts **NO SQL EDITOR DO SUPABASE**, nesta ordem exata:

### 1️⃣ Limpar Dados Existentes

```sql
-- Arquivo: 000_clean_database.sql
-- Deleta todos os dados antigos
```

Copie e execute todo o conteúdo de [`000_clean_database.sql`](file:///home/jhontavares/Documents/Programacao/projeto-nextjs/supabase/migrations/000_clean_database.sql)

**Verificação:** Deve retornar 0 registros para todas as tabelas.

---

### 2️⃣ Adicionar Coluna user_id

```sql
-- Arquivo: 006_add_user_id.sql
-- Adiciona user_id em todas as tabelas
```

Copie e execute todo o conteúdo de [`006_add_user_id.sql`](file:///home/jhontavares/Documents/Programacao/projeto-nextjs/supabase/migrations/006_add_user_id.sql)

**Verificação:** Verifique se as colunas foram criadas:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'user_id';
```

Deve retornar 6 linhas (uma para cada tabela).

---

### 3️⃣ Atualizar Políticas RLS

```sql
-- Arquivo: 007_update_rls_policies.sql
-- Cria políticas baseadas em user_id
```

Copie e execute todo o conteúdo de [`007_update_rls_policies.sql`](file:///home/jhontavares/Documents/Programacao/projeto-nextjs/supabase/migrations/007_update_rls_policies.sql)

**Verificação:** A última query do script mostrará todas as políticas criadas (deve ter 24 políticas - 4 para cada uma das 6 tabelas).

---

## ✅ Checklist de Execução

- [ ] Executei `000_clean_database.sql` - todos os dados foram deletados
- [ ] Executei `006_add_user_id.sql` - coluna user_id adicionada
- [ ] Executei `007_update_rls_policies.sql` - políticas RLS atualizadas
- [ ] Verifiquei que há 24 políticas criadas

## 🚀 Após as Migrations

Depois de executar com sucesso, me avise que posso continuar com:

1. Atualização do `storage.ts`
2. Atualização das stores
3. Atualização da página principal
4. Testes de autenticação

## 🆘 Se houver erro

Se encontrar algum erro durante a execução:

1. Copie a mensagem de erro completa
2. Me envie para análise
3. Não execute as próximas migrations até resolver
