-- Tabela de Imagens do Diário (Suporta múltiplas imagens por TF)
CREATE TABLE journal_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  
  timeframe TEXT NOT NULL,  -- Ex: 'H4', 'M5'
  url TEXT NOT NULL,        -- URL pública
  path TEXT NOT NULL,       -- Caminho no bucket (para deletar)
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar segurança (RLS)
ALTER TABLE journal_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo em journal_images" ON journal_images FOR ALL USING (true) WITH CHECK (true);
