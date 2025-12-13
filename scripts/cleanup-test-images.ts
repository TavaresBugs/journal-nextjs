/**
 * Script para limpar arquivos WebP e JPEG órfãos do teste
 * Uso: npx tsx scripts/cleanup-test-images.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Arquivos de teste que precisam ser limpos
const TEST_FILES = [
  'NAS100-tfH4-0-a75fbbd9',
  'NAS100-tfM-0-a75fbbd9',
  'NAS100-tfH1-0-a75fbbd9',
  'NAS100-tfD-0-a75fbbd9',
  'NAS100-tfW-0-a75fbbd9',
];

async function main() {
  console.log('🧹 Limpando arquivos de teste...\n');

  // 1. Buscar todos os paths no banco que contenham esses nomes
  const { data: images, error } = await supabase
    .from('journal_images')
    .select('id, path, url')
    .or(TEST_FILES.map(f => `path.ilike.%${f}%`).join(','));

  if (error) {
    console.error('❌ Erro ao buscar imagens:', error);
    return;
  }

  console.log(`📊 Encontradas ${images?.length || 0} imagens no banco\n`);

  for (const img of images || []) {
    const baseName = img.path?.replace(/\.(png|jpg|jpeg|webp)$/i, '') || '';
    
    // Arquivos a deletar do Storage
    const webpPath = `${baseName}.webp`;
    const jpgPath = `${baseName}.jpg`;

    console.log(`🗑️ Deletando ${webpPath.split('/').pop()}.webp/.jpg`);

    // Deletar WebP do storage
    await supabase.storage.from('journal-images').remove([webpPath]);
    
    // Deletar JPG do storage
    await supabase.storage.from('journal-images').remove([jpgPath]);

    // Restaurar URL para .png no banco
    if (img.path?.endsWith('.webp')) {
      const originalPath = img.path.replace('.webp', '.png');
      const { data: { publicUrl } } = supabase.storage
        .from('journal-images')
        .getPublicUrl(originalPath);

      await supabase
        .from('journal_images')
        .update({ path: originalPath, url: publicUrl })
        .eq('id', img.id);

      console.log(`   ✅ Restaurado para .png`);
    }
  }

  console.log('\n✅ Limpeza concluída!');
}

main().catch(console.error);
