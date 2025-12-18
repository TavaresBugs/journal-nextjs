/**
 * Verificar se URLs no banco apontam para WebP
 * Uso: npx tsx scripts/verify-webp-urls.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("🔍 Verificando URLs no banco...\n");

  const { data, error } = await supabase.from("journal_images").select("path").limit(500);

  if (error) {
    console.error("❌ Erro:", error);
    return;
  }

  const webp = data?.filter((i) => i.path?.endsWith(".webp")).length || 0;
  const png = data?.filter((i) => i.path?.endsWith(".png")).length || 0;
  const jpg =
    data?.filter((i) => i.path?.endsWith(".jpg") || i.path?.endsWith(".jpeg")).length || 0;
  const total = data?.length || 0;

  console.log(`
╔════════════════════════════════════════════════╗
║         🔍 Verificação de URLs                 ║
╠════════════════════════════════════════════════╣
║  Total de imagens:  ${total.toString().padStart(6)}                        ║
║  .webp:             ${webp.toString().padStart(6)}                        ║
║  .png:              ${png.toString().padStart(6)}                        ║
║  .jpg/.jpeg:        ${jpg.toString().padStart(6)}                        ║
╚════════════════════════════════════════════════╝
`);

  if (webp === total) {
    console.log("✅ TODAS as imagens estão apontando para WebP! 🎉");
  } else if (png > 0) {
    console.log(`⚠️ ${png} imagens ainda apontam para PNG`);
  }
}

main().catch(console.error);
