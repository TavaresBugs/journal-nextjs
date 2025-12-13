/**
 * Remove arquivos PNG originais do Supabase após migração para WebP
 * 
 * ⚠️ CUIDADO: Isso DELETA permanentemente os arquivos PNG!
 * Certifique-se que:
 * 1. Todas as imagens foram migradas para WebP
 * 2. O app está funcionando corretamente com WebP
 * 
 * Uso: npx tsx scripts/delete-original-png.ts
 * Modo seco (não deleta): npx tsx scripts/delete-original-png.ts --dry-run
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(DRY_RUN 
    ? '🔍 MODO SECO: Apenas listando arquivos (não deleta)\n' 
    : '🗑️ DELETANDO arquivos PNG originais...\n');

  // Buscar todas as imagens que agora apontam para .webp
  const { data: images, error } = await supabase
    .from('journal_images')
    .select('path')
    .ilike('path', '%.webp');

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log(`📊 ${images?.length || 0} imagens WebP no banco\n`);

  let deleted = 0;
  let failed = 0;

  for (const img of images || []) {
    // Caminho do PNG original
    const pngPath = img.path.replace('.webp', '.png');
    
    if (DRY_RUN) {
      console.log(`📄 Seria deletado: ${pngPath.split('/').pop()}`);
      deleted++;
    } else {
      const { error: delError } = await supabase.storage
        .from('journal-images')
        .remove([pngPath]);

      if (delError) {
        console.log(`⚠️ Não encontrado: ${pngPath.split('/').pop()}`);
        failed++;
      } else {
        console.log(`✅ Deletado: ${pngPath.split('/').pop()}`);
        deleted++;
      }
    }
  }

  console.log(`
╔════════════════════════════════════════════════╗
║         🗑️ Limpeza de PNG Concluída            ║
╠════════════════════════════════════════════════╣
║  Arquivos ${DRY_RUN ? 'listados' : 'deletados'}:   ${deleted.toString().padStart(6)}                      ║
║  Não encontrados:  ${failed.toString().padStart(6)}                      ║
╚════════════════════════════════════════════════╝
`);

  if (DRY_RUN) {
    console.log('⚠️ Rode sem --dry-run para deletar de verdade');
  }
}

main().catch(console.error);
