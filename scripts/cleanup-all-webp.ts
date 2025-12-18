/**
 * Limpar arquivos WebP/JPG e apontar banco de volta para PNG
 * Uso: npx tsx scripts/cleanup-all-webp.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("🧹 Limpando arquivos WebP/JPG do Storage...\n");

  // Buscar imagens que apontam para .webp
  const { data: webpImages, error } = await supabase
    .from("journal_images")
    .select("id, path, url")
    .ilike("path", "%.webp");

  if (error) {
    console.error("❌ Erro:", error);
    return;
  }

  console.log(`📊 ${webpImages?.length || 0} imagens apontando para .webp\n`);

  let deleted = 0;

  for (const img of webpImages || []) {
    const webpPath = img.path;
    const jpgPath = webpPath.replace(".webp", ".jpg");
    const pngPath = webpPath.replace(".webp", ".png");

    // Deletar .webp do Storage
    await supabase.storage.from("journal-images").remove([webpPath]);

    // Deletar .jpg do Storage
    await supabase.storage.from("journal-images").remove([jpgPath]);

    // Atualizar banco para apontar ao .png original
    const {
      data: { publicUrl },
    } = supabase.storage.from("journal-images").getPublicUrl(pngPath);

    await supabase
      .from("journal_images")
      .update({ path: pngPath, url: publicUrl })
      .eq("id", img.id);

    deleted++;
    console.log(`✅ ${pngPath.split("/").pop()}`);
  }

  console.log(`\n✅ Limpeza concluída! ${deleted} arquivos processados.`);
}

main().catch(console.error);
