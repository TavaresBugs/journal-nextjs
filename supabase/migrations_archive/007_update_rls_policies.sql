-- ============================================
-- UPDATE RLS POLICIES FOR USER-BASED ACCESS
-- ============================================
-- Esta migration atualiza as políticas RLS para filtrar dados por user_id

-- ============================================
-- ACCOUNTS
-- ============================================
DROP POLICY IF EXISTS "Permitir tudo em accounts" ON accounts;

CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRADES
-- ============================================
DROP POLICY IF EXISTS "Permitir tudo em trades" ON trades;

CREATE POLICY "Users can view their own trades"
  ON trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
  ON trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
  ON trades FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades"
  ON trades FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- JOURNAL ENTRIES
-- ============================================
DROP POLICY IF EXISTS "Permitir tudo em journal_entries" ON journal_entries;

CREATE POLICY "Users can view their own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- JOURNAL IMAGES
-- ============================================
DROP POLICY IF EXISTS "Permitir tudo em journal_images" ON journal_images;

CREATE POLICY "Users can view their own journal images"
  ON journal_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal images"
  ON journal_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal images"
  ON journal_images FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal images"
  ON journal_images FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- DAILY ROUTINES
-- ============================================
DROP POLICY IF EXISTS "Permitir tudo em daily_routines" ON daily_routines;

CREATE POLICY "Users can view their own daily routines"
  ON daily_routines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily routines"
  ON daily_routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily routines"
  ON daily_routines FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily routines"
  ON daily_routines FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SETTINGS
-- ============================================
DROP POLICY IF EXISTS "Permitir tudo em settings" ON settings;

CREATE POLICY "Users can view their own settings"
  ON settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON settings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Verificar que todas as políticas foram criadas corretamente
SELECT 
    schemaname, 
    tablename, 
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('accounts', 'trades', 'journal_entries', 'journal_images', 'daily_routines', 'settings')
ORDER BY tablename, cmd;
