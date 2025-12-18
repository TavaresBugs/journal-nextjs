/**
 * Script para converter imagens existentes no Supabase para WebP
 *
 * ⚠️ ANTES DE RODAR:
 * 1. npm install sharp
 * 2. Configurar SUPABASE_SERVICE_ROLE_KEY no .env.local
 * 3. Fazer backup do banco no Supabase Dashboard
 *
 * Uso: npx tsx scripts/migrate-images-to-webp.ts
 *
 * Modo teste (5 imagens): npx tsx scripts/migrate-images-to-webp.ts --test
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); // Carrega .env.local especificamente

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// ============================================
// CONFIGURAÇÃO
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Rate limiting
const BATCH_SIZE = 5; // Processar 5 por vez
const DELAY_BETWEEN_BATCHES = 2000; // 2s entre batches
const MAX_FILE_SIZE_MB = 10; // Pular arquivos > 10MB

// Modo teste
const IS_TEST_MODE = process.argv.includes("--test");
const TEST_LIMIT = 5;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// TYPES
// ============================================

interface JournalImage {
  id: string;
  url: string;
  path: string;
  journal_entry_id: string;
  user_id: string;
  timeframe: string;
}

interface MigrationStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  alreadyWebP: number;
  tooLarge: number;
  savedBytes: number;
  startTime: number;
}

const stats: MigrationStats = {
  total: 0,
  success: 0,
  failed: 0,
  skipped: 0,
  alreadyWebP: 0,
  tooLarge: 0,
  savedBytes: 0,
  startTime: Date.now(),
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/journal-images/");
    if (pathParts.length > 1) {
      return decodeURIComponent(pathParts[1].split("?")[0]);
    }
  } catch {
    // Ignorar erro de parse
  }
  return null;
}

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

async function fetchAllImages(): Promise<JournalImage[]> {
  console.log("\n📥 Buscando imagens do banco...");

  let query = supabase
    .from("journal_images")
    .select("id, url, path, journal_entry_id, user_id, timeframe")
    .order("created_at", { ascending: false });

  if (IS_TEST_MODE) {
    query = query.limit(TEST_LIMIT);
    console.log(`⚠️ MODO TESTE: Limitado a ${TEST_LIMIT} imagens`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Erro ao buscar imagens:", error);
    return [];
  }

  console.log(`📊 Encontradas ${data?.length || 0} imagens\n`);
  return data || [];
}

async function downloadImage(path: string): Promise<Buffer | null> {
  try {
    const { data, error } = await supabase.storage.from("journal-images").download(path);

    if (error || !data) {
      return null;
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    // Verificar tamanho
    const sizeMB = buffer.length / 1024 / 1024;
    if (sizeMB > MAX_FILE_SIZE_MB) {
      console.warn(`⚠️ Arquivo muito grande (${sizeMB.toFixed(1)}MB): ${path}`);
      stats.tooLarge++;
      return null;
    }

    return buffer;
  } catch (err) {
    console.error(`❌ Erro ao baixar ${path}:`, err);
    return null;
  }
}

async function convertToWebP(buffer: Buffer): Promise<Buffer | null> {
  try {
    // Converter para WebP - SEM resize, qualidade 100% (lossless)
    const webp = await sharp(buffer).webp({ quality: 100, lossless: true }).toBuffer();

    return webp;
  } catch (err) {
    console.error("❌ Erro na conversão sharp:", err);
    return null;
  }
}

async function uploadConverted(basePath: string, webpBuffer: Buffer): Promise<string | null> {
  // Remover extensão original
  const pathWithoutExt = basePath.replace(/\.(png|jpg|jpeg|gif|bmp)$/i, "");
  const webpPath = `${pathWithoutExt}.webp`;

  // Upload WebP
  const { error: webpError } = await supabase.storage
    .from("journal-images")
    .upload(webpPath, webpBuffer, {
      contentType: "image/webp",
      upsert: true,
    });

  if (webpError) {
    console.error(`❌ Erro upload WebP:`, webpError.message);
    return null;
  }

  return webpPath;
}

async function updateDatabaseUrl(imageId: string, newPath: string): Promise<boolean> {
  const {
    data: { publicUrl },
  } = supabase.storage.from("journal-images").getPublicUrl(newPath);

  const { error } = await supabase
    .from("journal_images")
    .update({
      url: publicUrl,
      path: newPath,
    })
    .eq("id", imageId);

  if (error) {
    console.error(`❌ Erro ao atualizar DB:`, error.message);
    return false;
  }

  return true;
}

async function processImage(image: JournalImage): Promise<void> {
  const { id, path, url } = image;

  // Extrair path
  const imagePath = path || extractPathFromUrl(url);
  if (!imagePath) {
    console.log(`⏭️ Sem path válido: ${url?.substring(0, 50)}...`);
    stats.skipped++;
    return;
  }

  // Pular se já é WebP
  if (imagePath.endsWith(".webp")) {
    stats.alreadyWebP++;
    return;
  }

  try {
    // 1. Baixar
    const buffer = await downloadImage(imagePath);
    if (!buffer) {
      stats.failed++;
      return;
    }

    const originalSize = buffer.length;

    // 2. Converter para WebP
    const webpBuffer = await convertToWebP(buffer);
    if (!webpBuffer) {
      stats.failed++;
      return;
    }

    // 3. Upload
    const webpPath = await uploadConverted(imagePath, webpBuffer);
    if (!webpPath) {
      stats.failed++;
      return;
    }

    // 4. Atualizar banco (só após upload bem-sucedido)
    const updated = await updateDatabaseUrl(id, webpPath);
    if (!updated) {
      stats.failed++;
      return;
    }

    // ✅ Sucesso!
    stats.success++;
    stats.savedBytes += originalSize - webpBuffer.length;

    const savingsPercent = (((originalSize - webpBuffer.length) / originalSize) * 100).toFixed(0);
    console.log(
      `✅ ${imagePath.split("/").pop()} → ${(originalSize / 1024).toFixed(0)}KB → ${(webpBuffer.length / 1024).toFixed(0)}KB (-${savingsPercent}%)`
    );

    // ⚠️ NÃO deletar original automaticamente
    // Deletar manualmente após confirmar que tudo funciona
  } catch (err) {
    console.error(`❌ Erro processando ${imagePath}:`, err);
    stats.failed++;
  }
}

function printSummary(): void {
  const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);
  const savedMB = (stats.savedBytes / 1024 / 1024).toFixed(2);

  console.log(`
╔════════════════════════════════════════════════╗
║         📊 WebP Migration Summary              ║
╠════════════════════════════════════════════════╣
║  Total processadas:    ${stats.total.toString().padStart(6)}                  ║
║  ✅ Convertidas:        ${stats.success.toString().padStart(6)}                  ║
║  ⏭️ Já eram WebP:       ${stats.alreadyWebP.toString().padStart(6)}                  ║
║  ⚠️ Muito grandes:      ${stats.tooLarge.toString().padStart(6)}                  ║
║  ❌ Erros:              ${stats.failed.toString().padStart(6)}                  ║
║  ⏭️ Puladas (sem path): ${stats.skipped.toString().padStart(6)}                  ║
╠════════════════════════════════════════════════╣
║  💾 Espaço economizado: ${savedMB.padStart(6)} MB               ║
║  ⏱️ Duração:            ${duration.padStart(6)} min              ║
╚════════════════════════════════════════════════╝
`);
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("🚀 Iniciando migração de imagens para WebP...");
  console.log(
    `📊 Config: BATCH_SIZE=${BATCH_SIZE}, DELAY=${DELAY_BETWEEN_BATCHES}ms, MAX_SIZE=${MAX_FILE_SIZE_MB}MB`
  );

  // Verificar configuração
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("\n❌ ERRO: Configure as variáveis de ambiente:");
    console.error("   - NEXT_PUBLIC_SUPABASE_URL");
    console.error("   - SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // Buscar imagens
  const images = await fetchAllImages();
  stats.total = images.length;

  if (images.length === 0) {
    console.log("ℹ️ Nenhuma imagem encontrada.");
    return;
  }

  // Processar em batches com delay
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);

    console.log(
      `\n--- Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(images.length / BATCH_SIZE)} ---`
    );

    // Processar em paralelo dentro do batch
    await Promise.all(batch.map(processImage));

    // Delay entre batches (exceto último)
    if (i + BATCH_SIZE < images.length) {
      console.log(`⏳ Aguardando ${DELAY_BETWEEN_BATCHES}ms...`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }

  // Resumo final
  printSummary();

  if (IS_TEST_MODE) {
    console.log("⚠️ Este foi um TESTE. Para rodar em produção, execute sem --test");
  }
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
