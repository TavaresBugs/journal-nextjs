const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../public/data/MNQ');

// Configuração de chunk size por timeframe
const chunkConfig = {
  '4H': 5000,
  '1H': 5000,
  '5m': 3000,
  // 1D, 1W, 1M ficam como arquivo único
};

// Mapeamento de padrões de arquivo para timeframe
const filePatterns = {
  '240': '4H',
  '60': '1H',
  '5_': '5m'
};

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const header = lines[0].split(',');
  
  const timeIdx = header.findIndex(h => h.toLowerCase() === 'time');
  const openIdx = header.findIndex(h => h.toLowerCase() === 'open');
  const highIdx = header.findIndex(h => h.toLowerCase() === 'high');
  const lowIdx = header.findIndex(h => h.toLowerCase() === 'low');
  const closeIdx = header.findIndex(h => h.toLowerCase() === 'close');
  
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length >= 5) {
      const time = parseInt(values[timeIdx]);
      const open = parseFloat(values[openIdx]);
      const high = parseFloat(values[highIdx]);
      const low = parseFloat(values[lowIdx]);
      const close = parseFloat(values[closeIdx]);
      
      if (!isNaN(time) && !isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
        data.push({ time, open, high, low, close });
      }
    }
  }
  
  return data;
}

function getTimeframeFromFilename(filename) {
  for (const [pattern, tf] of Object.entries(filePatterns)) {
    if (filename.includes(`, ${pattern}`) || filename.includes(`_${pattern}`)) {
      return tf;
    }
  }
  return null;
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toISOString().split('T')[0];
}

// Agrupar CSVs por timeframe
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));
const dataByTF = {};

console.log('📂 Lendo arquivos CSV...\n');

for (const file of files) {
  const tf = getTimeframeFromFilename(file);
  if (!tf || !chunkConfig[tf]) continue;
  
  console.log(`  📄 ${file} → ${tf}`);
  
  const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
  const data = parseCSV(content);
  
  if (!dataByTF[tf]) {
    dataByTF[tf] = [];
  }
  dataByTF[tf].push(...data);
}

// Processar cada timeframe
for (const [tf, allData] of Object.entries(dataByTF)) {
  console.log(`\n🔧 Processando ${tf}...`);
  
  // Ordenar por tempo e remover duplicatas
  allData.sort((a, b) => a.time - b.time);
  const uniqueData = [];
  let lastTime = null;
  for (const candle of allData) {
    if (candle.time !== lastTime) {
      uniqueData.push(candle);
      lastTime = candle.time;
    }
  }
  
  console.log(`   Total: ${uniqueData.length} candles únicos`);
  console.log(`   Período: ${formatDate(uniqueData[0].time)} → ${formatDate(uniqueData[uniqueData.length-1].time)}`);
  
  // Criar diretório para chunks
  const tfDir = path.join(dataDir, tf);
  if (!fs.existsSync(tfDir)) {
    fs.mkdirSync(tfDir, { recursive: true });
  }
  
  // Dividir em chunks
  const chunkSize = chunkConfig[tf];
  const chunks = [];
  
  for (let i = 0; i < uniqueData.length; i += chunkSize) {
    const chunk = uniqueData.slice(i, i + chunkSize);
    const chunkIndex = Math.floor(i / chunkSize);
    const filename = `chunk-${chunkIndex}.json`;
    
    const chunkData = {
      symbol: 'MNQ',
      timeframe: tf,
      chunkIndex: chunkIndex,
      count: chunk.length,
      firstDate: formatDate(chunk[0].time),
      lastDate: formatDate(chunk[chunk.length - 1].time),
      firstTime: chunk[0].time,
      lastTime: chunk[chunk.length - 1].time,
      data: chunk
    };
    
    fs.writeFileSync(path.join(tfDir, filename), JSON.stringify(chunkData));
    
    chunks.push({
      file: filename,
      index: chunkIndex,
      count: chunk.length,
      firstDate: formatDate(chunk[0].time),
      lastDate: formatDate(chunk[chunk.length - 1].time),
      firstTime: chunk[0].time,
      lastTime: chunk[chunk.length - 1].time
    });
    
    const size = (fs.statSync(path.join(tfDir, filename)).size / 1024).toFixed(1);
    console.log(`   ✅ ${filename}: ${chunk.length} candles (${size}KB) | ${chunks[chunkIndex].firstDate} → ${chunks[chunkIndex].lastDate}`);
  }
  
  // Criar index.json
  const index = {
    symbol: 'MNQ',
    timeframe: tf,
    chunkSize: chunkSize,
    totalCandles: uniqueData.length,
    totalChunks: chunks.length,
    firstDate: formatDate(uniqueData[0].time),
    lastDate: formatDate(uniqueData[uniqueData.length - 1].time),
    firstTime: uniqueData[0].time,
    lastTime: uniqueData[uniqueData.length - 1].time,
    chunks: chunks
  };
  
  fs.writeFileSync(path.join(tfDir, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`   📋 index.json criado`);
}

console.log('\n✨ Chunking completo!');
