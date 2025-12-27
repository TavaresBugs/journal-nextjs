const fs = require('fs');
const path = require('path');

// Diretório de dados
const dataDir = path.join(__dirname, '../public/data/MNQ');

// Mapeamento de arquivos para timeframes
const fileMapping = {
  '1M_': '1M',
  '1W_': '1W', 
  '1D_': '1D',
  '240_': '4H',
  '60_': '1H',
  '5_': '5m'
};

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const header = lines[0].split(',');
  
  // Encontrar índices das colunas
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
  
  // Ordenar por tempo
  data.sort((a, b) => a.time - b.time);
  
  return data;
}

function getTimeframe(filename) {
  for (const [pattern, tf] of Object.entries(fileMapping)) {
    if (filename.includes(pattern)) {
      return tf;
    }
  }
  return null;
}

// Ler todos os arquivos CSV
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));

console.log(`Encontrados ${files.length} arquivos CSV\n`);

for (const file of files) {
  const tf = getTimeframe(file);
  if (!tf) {
    console.log(`⚠️  Ignorando: ${file} (timeframe não reconhecido)`);
    continue;
  }
  
  const csvPath = path.join(dataDir, file);
  const jsonPath = path.join(dataDir, `${tf}.json`);
  
  console.log(`📊 Convertendo: ${file} → ${tf}.json`);
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const data = parseCSV(content);
  
  // Criar objeto com metadados
  const output = {
    symbol: 'MNQ',
    timeframe: tf,
    count: data.length,
    firstDate: new Date(data[0].time * 1000).toISOString(),
    lastDate: new Date(data[data.length - 1].time * 1000).toISOString(),
    data: data
  };
  
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  
  console.log(`   ✅ ${data.length} candles | ${(fs.statSync(jsonPath).size / 1024).toFixed(1)}KB`);
  console.log(`   📅 ${output.firstDate.split('T')[0]} → ${output.lastDate.split('T')[0]}\n`);
}

console.log('✨ Conversão completa!');
