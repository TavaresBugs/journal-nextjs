# Supabase Schemas

Esta pasta contém a documentação dos esquemas das tabelas do Supabase.

## Arquivos

| Arquivo               | Tabela          | Descrição                            |
| --------------------- | --------------- | ------------------------------------ |
| `accounts.sql`        | accounts        | Contas/Carteiras de trading          |
| `trades.sql`          | trades          | Trades/Operações registradas         |
| `playbooks.sql`       | playbooks       | Playbooks/Estratégias                |
| `journal_entries.sql` | journal_entries | Entradas do diário                   |
| `user_settings.sql`   | user_settings   | Configurações do usuário             |
| `users_extended.sql`  | users_extended  | Informações estendidas               |
| `profiles.sql`        | profiles        | Perfil público para compartilhamento |
| `mentor.sql`          | mentor\_\*      | Tabelas de mentoria                  |

## Como usar

Cole o esquema de cada tabela do Supabase (usando "Copy as SQL") no arquivo correspondente.

## Tabela profiles (Recomendada)

Para o modal de perfil funcionar corretamente, a tabela `profiles` precisa ter:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT false,
  allow_mentor_view BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## Storage Bucket (avatars)

Para upload de fotos de perfil:

1. Crie o bucket `avatars` no Supabase Storage
2. Configure como público ou com policies adequadas
