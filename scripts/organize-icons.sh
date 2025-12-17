#!/bin/bash

# ============================================
# Asset Icons Organization Script
# ============================================
# Organiza ícones do TradingView na estrutura de pastas correta
# Arquivos esperados: nome--big.svg (ex: EU--big.svg, BTC--big.svg)
#
# Usage: bash scripts/organize-icons.sh
# ============================================

set -e

BASE_DIR="public/assets/icons"
DEFAULT_DIR="$BASE_DIR/default"

echo "🚀 Iniciando organização dos ícones..."
echo "================================"

# Verificar se pasta default existe
if [ ! -d "$DEFAULT_DIR" ]; then
  echo "❌ Erro: Pasta $DEFAULT_DIR não encontrada!"
  echo ""
  echo "Por favor, crie a pasta e coloque os ícones baixados lá:"
  echo "  mkdir -p $DEFAULT_DIR"
  echo "  # Coloque os arquivos .svg baixados do TradingView"
  exit 1
fi

# Verificar se há arquivos para processar
if [ -z "$(ls -A $DEFAULT_DIR/*.svg 2>/dev/null)" ]; then
  echo "⚠️  Nenhum arquivo .svg encontrado em $DEFAULT_DIR"
  echo ""
  echo "Arquivos esperados (formato: nome--big.svg):"
  echo "  Flags: AU--big.svg, EU--big.svg, GB--big.svg, etc."
  echo "  Indices: nasdaq-100--big.svg, s-and-p-500--big.svg, etc."
  echo "  Commodities: gold--big.svg, silver--big.svg, etc."
  echo "  Crypto: BTC--big.svg, ETH--big.svg, etc."
  exit 1
fi

# Criar estrutura de pastas
echo "📁 Criando estrutura de pastas..."
mkdir -p "$BASE_DIR"/{flags,indices,commodities,crypto}

# Função helper para copiar arquivo se existir
copy_if_exists() {
  local src="$1"
  local dest="$2"
  local name="$3"
  
  if [ -f "$src" ]; then
    cp "$src" "$dest"
    echo "  ✅ $name"
    return 0
  else
    echo "  ⚠️  Não encontrado: $(basename "$src")"
    return 1
  fi
}

# ===== BANDEIRAS (FLAGS) =====
echo ""
echo "🏴 Organizando bandeiras (flags)..."

copy_if_exists "$DEFAULT_DIR/AU--big.svg" "$BASE_DIR/flags/aud.svg" "aud.svg"
copy_if_exists "$DEFAULT_DIR/CA--big.svg" "$BASE_DIR/flags/cad.svg" "cad.svg"
copy_if_exists "$DEFAULT_DIR/CH--big.svg" "$BASE_DIR/flags/chf.svg" "chf.svg"
copy_if_exists "$DEFAULT_DIR/EU--big.svg" "$BASE_DIR/flags/eur.svg" "eur.svg"
copy_if_exists "$DEFAULT_DIR/GB--big.svg" "$BASE_DIR/flags/gbp.svg" "gbp.svg"
copy_if_exists "$DEFAULT_DIR/JP--big.svg" "$BASE_DIR/flags/jpy.svg" "jpy.svg"
copy_if_exists "$DEFAULT_DIR/US--big.svg" "$BASE_DIR/flags/usd.svg" "usd.svg"
copy_if_exists "$DEFAULT_DIR/NZ--big.svg" "$BASE_DIR/flags/nzd.svg" "nzd.svg"

# ===== ÍNDICES (INDICES) =====
echo ""
echo "📊 Organizando índices..."

copy_if_exists "$DEFAULT_DIR/nasdaq-100--big.svg" "$BASE_DIR/indices/nasdaq-100.svg" "nasdaq-100.svg"
copy_if_exists "$DEFAULT_DIR/s-and-p-500--big.svg" "$BASE_DIR/indices/sp500.svg" "sp500.svg"
copy_if_exists "$DEFAULT_DIR/dow-30--big.svg" "$BASE_DIR/indices/dow-jones.svg" "dow-jones.svg"
copy_if_exists "$DEFAULT_DIR/russell-2000--big.svg" "$BASE_DIR/indices/russell-2000.svg" "russell-2000.svg"
copy_if_exists "$DEFAULT_DIR/u-s-dollar-index--big.svg" "$BASE_DIR/indices/us-dollar-index.svg" "us-dollar-index.svg"

# ===== COMMODITIES =====
echo ""
echo "🥇 Organizando commodities..."

copy_if_exists "$DEFAULT_DIR/gold--big.svg" "$BASE_DIR/commodities/gold.svg" "gold.svg"
copy_if_exists "$DEFAULT_DIR/silver--big.svg" "$BASE_DIR/commodities/silver.svg" "silver.svg"
copy_if_exists "$DEFAULT_DIR/copper--big.svg" "$BASE_DIR/commodities/copper.svg" "copper.svg"
copy_if_exists "$DEFAULT_DIR/crude-oil--big.svg" "$BASE_DIR/commodities/crude-oil.svg" "crude-oil.svg"
copy_if_exists "$DEFAULT_DIR/natural-gas--big.svg" "$BASE_DIR/commodities/natural-gas.svg" "natural-gas.svg"

# ===== CRIPTOMOEDAS =====
echo ""
echo "₿ Organizando criptomoedas..."

copy_if_exists "$DEFAULT_DIR/BTC--big.svg" "$BASE_DIR/crypto/bitcoin.svg" "bitcoin.svg"
copy_if_exists "$DEFAULT_DIR/ETH--big.svg" "$BASE_DIR/crypto/ethereum.svg" "ethereum.svg"
copy_if_exists "$DEFAULT_DIR/SOL--big.svg" "$BASE_DIR/crypto/solana.svg" "solana.svg"
copy_if_exists "$DEFAULT_DIR/ADA--big.svg" "$BASE_DIR/crypto/cardano.svg" "cardano.svg"
copy_if_exists "$DEFAULT_DIR/XRP--big.svg" "$BASE_DIR/crypto/ripple.svg" "ripple.svg"
copy_if_exists "$DEFAULT_DIR/USDT--big.svg" "$BASE_DIR/crypto/tether.svg" "tether.svg"

# ===== RESUMO =====
echo ""
echo "================================"
echo "📈 Resumo da organização:"
echo "  Bandeiras:   $(ls -1 $BASE_DIR/flags/*.svg 2>/dev/null | wc -l) arquivos"
echo "  Índices:     $(ls -1 $BASE_DIR/indices/*.svg 2>/dev/null | wc -l) arquivos"
echo "  Commodities: $(ls -1 $BASE_DIR/commodities/*.svg 2>/dev/null | wc -l) arquivos"
echo "  Cripto:      $(ls -1 $BASE_DIR/crypto/*.svg 2>/dev/null | wc -l) arquivos"
echo ""
echo "✅ Organização concluída!"
echo ""
echo "💡 Teste com: npm run dev"
echo "   Acesse: http://localhost:3000/test-assets"
