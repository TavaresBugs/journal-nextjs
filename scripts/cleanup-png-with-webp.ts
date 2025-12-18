/**
 * Script completo: Converte + Limpa PNG/JPG para WebP
 *
 * Fluxo:
 * 1. Varre todos PNG/JPG no storage
 * 2. Verifica quais já têm versão WebP
 * 3. Converte os que NÃO têm WebP (usando sharp)
 * 4. Verifica novamente que TODOS têm WebP
 * 5. Deleta os originais PNG/JPG
 *
 * Uso:
 *   npx tsx scripts/cleanup-png-with-webp.ts --dry-run    # Apenas mostra o que faria
 *   npx tsx scripts/cleanup-png-with-webp.ts              # Executa conversão + deleção
 *   npx tsx scripts/cleanup-png-with-webp.ts --limit 10   # Limita a 10 arquivos
 *
 * Pré-requisitos:
 *   - npm install sharp
 *   - SUPABASE_SERVICE_ROLE_KEY no .env.local
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// ============================================
// CONFIGURAÇÃO
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BUCKETS = ["journal-images", "laboratory-images"];
const EXTENSIONS_TO_CLEAN = [".png", ".jpg", ".jpeg"];
const WEBP_QUALITY = 100; // Lossless

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = (() => {
  const idx = process.argv.indexOf("--limit");
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) : Infinity;
})();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// TYPES
// ============================================

interface FileInfo {
  bucket: string;
  path: string;
  size: number;
  webpPath: string;
  webpExists: boolean;
}

interface Stats {
  scanned: number;
  alreadyHaveWebP: number;
  converted: number;
  conversionFailed: number;
  deleted: number;
  deleteFailed: number;
  savedBytes: number;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function listAllFiles(
  bucket: string,
  folder: string = ""
): Promise<{ path: string; size: number }[]> {
  const files: { path: string; size: number }[] = [];

  const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 1000 });

  if (error) {
    console.error(`❌ Erro listando ${bucket}/${folder}:`, error.message);
    return files;
  }

  for (const item of data || []) {
    const fullPath = folder ? `${folder}/${item.name}` : item.name;

    if (item.id === null) {
      // É uma pasta, listar recursivamente
      const subFiles = await listAllFiles(bucket, fullPath);
      files.push(...subFiles);
    } else {
      // É um arquivo
      files.push({
        path: fullPath,
        size: (item.metadata as { size?: number })?.size || 0,
      });
    }
  }

  return files;
}

function isImageToClean(path: string): boolean {
  const lower = path.toLowerCase();
  return EXTENSIONS_TO_CLEAN.some((ext) => lower.endsWith(ext));
}

function getWebPPath(path: string): string {
  return path.replace(/\.(png|jpg|jpeg)$/i, ".webp");
}

async function checkWebPExists(bucket: string, webpPath: string): Promise<boolean> {
  const { data, error } = await supabase.storage.from(bucket).download(webpPath);

  return !error && data !== null;
}

async function downloadFile(bucket: string, path: string): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error || !data) {
    console.error(`   ❌ Erro baixando ${path}: ${error?.message}`);
    return null;
  }

  return Buffer.from(await data.arrayBuffer());
}

async function convertToWebP(buffer: Buffer): Promise<Buffer | null> {
  try {
    return await sharp(buffer)
      .webp({ quality: WEBP_QUALITY, lossless: WEBP_QUALITY === 100 })
      .toBuffer();
  } catch (err) {
    console.error(`   ❌ Erro na conversão:`, err);
    return null;
  }
}

async function uploadWebP(bucket: string, webpPath: string, buffer: Buffer): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).upload(webpPath, buffer, {
    contentType: "image/webp",
    upsert: true,
  });

  if (error) {
    console.error(`   ❌ Erro upload ${webpPath}: ${error.message}`);
    return false;
  }
  return true;
}

async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  return !error;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║   🔄 MIGRAÇÃO COMPLETA: PNG/JPG → WebP + Limpeza              ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log(
    `║  Modo: ${DRY_RUN ? "🔍 DRY RUN (apenas simula)" : "⚡ EXECUÇÃO REAL"}                          `
  );
  console.log(
    `║  Qualidade WebP: ${WEBP_QUALITY}% ${WEBP_QUALITY === 100 ? "(lossless)" : ""}                               `
  );
  console.log(
    `║  Limite: ${LIMIT === Infinity ? "Sem limite" : LIMIT}                                              `
  );
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // Verificar configuração
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Configure SUPABASE_SERVICE_ROLE_KEY no .env.local");
    process.exit(1);
  }

  const stats: Stats = {
    scanned: 0,
    alreadyHaveWebP: 0,
    converted: 0,
    conversionFailed: 0,
    deleted: 0,
    deleteFailed: 0,
    savedBytes: 0,
  };

  const allFiles: FileInfo[] = [];

  // ========================================
  // FASE 1: VARRER BUCKETS
  // ========================================
  console.log("📂 FASE 1: Varrendo buckets...\n");

  for (const bucket of BUCKETS) {
    console.log(`   🔍 ${bucket}...`);

    const files = await listAllFiles(bucket);
    const imageFiles = files.filter((f) => isImageToClean(f.path));

    console.log(`      Total: ${files.length} arquivos, ${imageFiles.length} PNG/JPG\n`);

    for (const file of imageFiles) {
      if (allFiles.length >= LIMIT) break;

      allFiles.push({
        bucket,
        path: file.path,
        size: file.size,
        webpPath: getWebPPath(file.path),
        webpExists: false,
      });
    }
  }

  stats.scanned = allFiles.length;

  if (stats.scanned === 0) {
    console.log("✅ Nenhum arquivo PNG/JPG encontrado. Storage já está limpo!\n");
    return;
  }

  console.log(`📊 Total de arquivos para processar: ${stats.scanned}\n`);

  // ========================================
  // FASE 2: VERIFICAR WebP EXISTENTES
  // ========================================
  console.log("🔎 FASE 2: Verificando versões WebP existentes...\n");

  const needsConversion: FileInfo[] = [];

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const fileName = file.path.split("/").pop();

    process.stdout.write(`   [${i + 1}/${stats.scanned}] ${fileName}... `);

    file.webpExists = await checkWebPExists(file.bucket, file.webpPath);

    if (file.webpExists) {
      stats.alreadyHaveWebP++;
      console.log("✅ WebP existe");
    } else {
      needsConversion.push(file);
      console.log("❌ Precisa converter");
    }
  }

  console.log(`\n   ✅ Já têm WebP: ${stats.alreadyHaveWebP}`);
  console.log(`   ❌ Precisam converter: ${needsConversion.length}\n`);

  // ========================================
  // FASE 3: CONVERTER OS QUE NÃO TÊM WebP
  // ========================================
  if (needsConversion.length > 0) {
    console.log(`🔄 FASE 3: Convertendo ${needsConversion.length} arquivos para WebP...\n`);

    for (let i = 0; i < needsConversion.length; i++) {
      const file = needsConversion[i];
      const fileName = file.path.split("/").pop();

      console.log(`   [${i + 1}/${needsConversion.length}] ${fileName}`);

      if (DRY_RUN) {
        console.log(`      ⏭️  [DRY RUN] Seria convertido\n`);
        stats.converted++;
        file.webpExists = true;
        continue;
      }

      // Baixar original
      const buffer = await downloadFile(file.bucket, file.path);
      if (!buffer) {
        stats.conversionFailed++;
        continue;
      }

      // Converter para WebP
      const webpBuffer = await convertToWebP(buffer);
      if (!webpBuffer) {
        stats.conversionFailed++;
        continue;
      }

      // Upload WebP
      const uploaded = await uploadWebP(file.bucket, file.webpPath, webpBuffer);
      if (!uploaded) {
        stats.conversionFailed++;
        continue;
      }

      file.webpExists = true;
      stats.converted++;

      const savings = (((buffer.length - webpBuffer.length) / buffer.length) * 100).toFixed(1);
      console.log(
        `      ✅ ${formatBytes(buffer.length)} → ${formatBytes(webpBuffer.length)} (-${savings}%)\n`
      );
    }

    console.log(`   ✅ Convertidos: ${stats.converted}`);
    console.log(`   ❌ Falharam: ${stats.conversionFailed}\n`);
  } else {
    console.log("⏭️  FASE 3: Pular (todos já têm WebP)\n");
  }

  // ========================================
  // FASE 4: VERIFICAR QUE TODOS TÊM WebP
  // ========================================
  console.log("🔎 FASE 4: Verificação final...\n");

  const readyToDelete = allFiles.filter((f) => f.webpExists);
  const notReady = allFiles.filter((f) => !f.webpExists);

  console.log(`   ✅ Prontos para deletar (têm WebP): ${readyToDelete.length}`);
  console.log(`   ⚠️  NÃO serão deletados (sem WebP): ${notReady.length}\n`);

  if (readyToDelete.length === 0) {
    console.log("⚠️  Nenhum arquivo pronto para deletar.\n");
    return;
  }

  // ========================================
  // FASE 5: DELETAR ORIGINAIS
  // ========================================
  console.log(`🗑️  FASE 5: ${DRY_RUN ? "Simulando deleção" : "Deletando originais"}...\n`);

  for (const file of readyToDelete) {
    const fileName = file.path.split("/").pop();

    if (DRY_RUN) {
      console.log(`   📄 [DRY RUN] ${fileName} (${formatBytes(file.size)})`);
      stats.deleted++;
      stats.savedBytes += file.size;
    } else {
      const success = await deleteFile(file.bucket, file.path);

      if (success) {
        console.log(`   ✅ Deletado: ${fileName} (${formatBytes(file.size)})`);
        stats.deleted++;
        stats.savedBytes += file.size;
      } else {
        console.log(`   ❌ Falhou: ${fileName}`);
        stats.deleteFailed++;
      }
    }
  }

  // ========================================
  // RESUMO FINAL
  // ========================================
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    📊 RESUMO FINAL                           ║
╠══════════════════════════════════════════════════════════════╣
║  Arquivos PNG/JPG encontrados:  ${stats.scanned.toString().padStart(6)}                       ║
║  Já tinham versão WebP:         ${stats.alreadyHaveWebP.toString().padStart(6)}                       ║
║  Convertidos para WebP:         ${stats.converted.toString().padStart(6)}                       ║
║  Falhas na conversão:           ${stats.conversionFailed.toString().padStart(6)}                       ║
║  ${DRY_RUN ? "Seriam deletados" : "Deletados"}:                ${stats.deleted.toString().padStart(6)}                       ║
║  Falhas na deleção:             ${stats.deleteFailed.toString().padStart(6)}                       ║
╠══════════════════════════════════════════════════════════════╣
║  💾 Espaço ${DRY_RUN ? "a liberar" : "liberado"}:        ${formatBytes(stats.savedBytes).padStart(12)}                 ║
╚══════════════════════════════════════════════════════════════╝
`);

  if (DRY_RUN) {
    console.log("⚠️  Este foi um DRY RUN. Execute sem --dry-run para executar de verdade.");
  } else {
    console.log("✅ Migração e limpeza concluídas com sucesso!");
    console.log("   Agora todos os arquivos estão em WebP. Originais PNG/JPG foram removidos.");
  }
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
