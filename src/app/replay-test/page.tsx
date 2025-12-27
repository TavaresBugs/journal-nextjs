'use client';

// CSS to hide scrollbars
const noScrollbarStyles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  Time, 
  CandlestickSeries,
  CrosshairMode
} from 'lightweight-charts';

interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

type ReplayState = 'idle' | 'selecting' | 'playing';

export default function ReplayTestPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const futureSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [allData, setAllData] = useState<CandleData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [isLoaded, setIsLoaded] = useState(false);
  const [replayState, setReplayState] = useState<ReplayState>('idle');
  const [currentCandle, setCurrentCandle] = useState<CandleData | null>(null);
  const [symbol, setSymbol] = useState('MNQ');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [selectedTool, setSelectedTool] = useState('crosshair');
  const [mousePosition, setMousePosition] = useState({ x: 0, visible: false });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [availableTimeframes, setAvailableTimeframes] = useState<string[]>(['1M', '1W', '1D', '4H', '1H', '5m']);
  const [availableSymbols] = useState(['MNQ']);
  
  const speeds = [
    { label: '0.1x', ms: 1000 },
    { label: '0.5x', ms: 500 },
    { label: '1x', ms: 200 },
    { label: '2x', ms: 100 },
    { label: '5x', ms: 50 },
    { label: '10x', ms: 25 },
  ];

  const formatDateTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${days[date.getUTCDay()]} ${date.getUTCDate().toString().padStart(2, '0')} ${months[date.getUTCMonth()]} '${date.getUTCFullYear().toString().slice(-2)} ${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
  };

  // Ref para guardar o timestamp atual do replay (para manter posição ao mudar TF)
  const currentTimestampRef = useRef<number | null>(null);

  // Tipo para chunk do index.json
  interface ChunkInfo {
    file: string;
    index: number;
    count: number;
    firstDate: string;
    lastDate: string;
    firstTime: number;
    lastTime: number;
  }

  // Encontra qual chunk contém o timestamp
  const findChunkForTimestamp = (chunks: ChunkInfo[], timestamp: number): ChunkInfo => {
    for (const chunk of chunks) {
      if (timestamp >= chunk.firstTime && timestamp <= chunk.lastTime) {
        return chunk;
      }
    }
    // Se não encontrar, retorna o último chunk
    return chunks[chunks.length - 1];
  };

  // Carrega dados do símbolo/timeframe
  const loadSymbolData = useCallback(async (sym: string, tf: string, targetTimestamp?: number) => {
    setIsLoadingData(true);
    try {
      // Primeiro tenta carregar como chunk (verifica se existe index.json)
      const indexResponse = await fetch(`/data/${sym}/${tf}/index.json`);
      
      if (indexResponse.ok) {
        // É um timeframe com chunks
        const indexData = await indexResponse.json();
        console.log(`📋 ${tf}: ${indexData.totalChunks} chunks, ${indexData.totalCandles} candles totais`);
        
        // Determina qual chunk carregar
        let targetChunk;
        if (targetTimestamp) {
          targetChunk = findChunkForTimestamp(indexData.chunks, targetTimestamp);
          console.log(`🎯 Buscando timestamp ${targetTimestamp} → chunk ${targetChunk.index}`);
        } else {
          // Carrega o último chunk por padrão
          targetChunk = indexData.chunks[indexData.chunks.length - 1];
        }
        
        // Carrega o chunk
        const chunkResponse = await fetch(`/data/${sym}/${tf}/${targetChunk.file}`);
        const chunkData = await chunkResponse.json();
        const data = chunkData.data as CandleData[];
        
        setAllData(data);
        setSymbol(sym);
        
        // Se temos um timestamp alvo, encontra o índice correspondente
        let startIndex = data.length - 1;
        if (targetTimestamp) {
          for (let i = 0; i < data.length; i++) {
            if ((data[i].time as number) >= targetTimestamp) {
              startIndex = i;
              break;
            }
          }
        }
        
        // Atualizar gráfico
        if (seriesRef.current) {
          seriesRef.current.setData(data as CandlestickData[]);
          chartRef.current?.timeScale().fitContent();
        }
        
        setIsLoaded(true);
        console.log(`✅ Chunk ${targetChunk.index}: ${data.length} candles (${targetChunk.firstDate} → ${targetChunk.lastDate})`);
        
      } else {
        // Arquivo único (1D, 1W, 1M)
        const response = await fetch(`/data/${sym}/${tf}.json`);
        if (!response.ok) {
          console.error(`Arquivo não encontrado: /data/${sym}/${tf}.json`);
          return;
        }
        const json = await response.json();
        const data = json.data as CandleData[];
        
        setAllData(data);
        setSymbol(sym);
        
        if (seriesRef.current) {
          seriesRef.current.setData(data as CandlestickData[]);
          chartRef.current?.timeScale().fitContent();
        }
        
        setIsLoaded(true);
        console.log(`✅ Carregados ${data.length} candles de ${sym} ${tf}`);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Carrega dados ao iniciar e ao mudar timeframe
  useEffect(() => {
    if (isLoaded || !seriesRef.current) return;
    loadSymbolData(symbol, selectedTimeframe, currentTimestampRef.current || undefined);
  }, [symbol, selectedTimeframe, isLoaded, loadSymbolData]);

  // Recarrega ao mudar timeframe - mantém posição temporal
  const handleTimeframeChange = (tf: string) => {
    // Salva o timestamp atual antes de mudar
    if (allData.length > 0 && currentIndex >= 0 && currentIndex < allData.length) {
      currentTimestampRef.current = allData[currentIndex].time as number;
      console.log(`📍 Salvando posição temporal: ${new Date(currentTimestampRef.current * 1000).toISOString()}`);
    }
    
    setSelectedTimeframe(tf);
    setIsLoaded(false); // Força recarregar
    // NÃO reseta replayState - mantém o estado do replay
  };

  // Inicializa o gráfico
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#131722' },
        textColor: '#787b86',
        fontFamily: '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#758696', width: 1, style: 2, labelBackgroundColor: '#2a2e39' },
        horzLine: { color: '#758696', width: 1, style: 2, labelBackgroundColor: '#2a2e39' },
      },
      rightPriceScale: { borderColor: '#2a2e39', scaleMargins: { top: 0.1, bottom: 0.15 } },
      timeScale: { borderColor: '#2a2e39', timeVisible: true, secondsVisible: false, rightOffset: 5, barSpacing: 8 },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    // Main series (visible data)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Future series (grayed out data for selection mode)
    const futureSeries = chart.addSeries(CandlestickSeries, {
      upColor: 'rgba(38, 166, 154, 0.3)',
      downColor: 'rgba(239, 83, 80, 0.3)',
      borderVisible: false,
      wickUpColor: 'rgba(38, 166, 154, 0.3)',
      wickDownColor: 'rgba(239, 83, 80, 0.3)',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    futureSeriesRef.current = futureSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (intervalRef.current) clearInterval(intervalRef.current);
      chart.remove();
    };
  }, []);

  // Track mouse position for selection line
  useEffect(() => {
    if (replayState !== 'selecting' || !chartContainerRef.current) return;

    const container = chartContainerRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setMousePosition({ x, visible: true });

      // Convert to data index
      if (chartRef.current && allData.length > 0) {
        const timeScale = chartRef.current.timeScale();
        const logical = timeScale.coordinateToLogical(x);
        if (logical !== null) {
          const idx = Math.max(0, Math.min(allData.length - 1, Math.round(logical)));
          setSelectionIndex(idx);
          updateSelectionPreview(idx);
        }
      }
    };

    const handleMouseLeave = () => {
      setMousePosition(prev => ({ ...prev, visible: false }));
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [replayState, allData]);

  const updateSelectionPreview = (idx: number) => {
    if (!seriesRef.current || !futureSeriesRef.current || allData.length === 0) return;

    // Show past data normally
    seriesRef.current.setData(allData.slice(0, idx + 1) as CandlestickData[]);
    
    // Show future data grayed out
    futureSeriesRef.current.setData(allData.slice(idx + 1) as CandlestickData[]);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (replayState === 'selecting') {
        if (e.key === 'Escape') {
          cancelSelection();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          confirmSelection();
        }
        return;
      }

      if (replayState !== 'playing') return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          isPlaying ? pauseReplay() : startReplay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          stepForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stepBackward();
          break;
        case 'Escape':
          exitReplay();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [replayState, isPlaying, currentIndex, allData, selectionIndex]);

  const parseCSV = (csvText: string): CandleData[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    const timeIdx = headers.findIndex(h => h.includes('time') || h.includes('date'));
    const openIdx = headers.findIndex(h => h.includes('open'));
    const highIdx = headers.findIndex(h => h.includes('high'));
    const lowIdx = headers.findIndex(h => h.includes('low'));
    const closeIdx = headers.findIndex(h => h.includes('close'));

    const data: CandleData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 5) continue;

      try {
        let time: Time;
        const timeValue = values[timeIdx];
        
        if (/^\d+$/.test(timeValue)) {
          const ts = parseInt(timeValue);
          time = (ts > 9999999999 ? Math.floor(ts / 1000) : ts) as Time;
        } else {
          const date = new Date(timeValue);
          time = (Math.floor(date.getTime() / 1000)) as Time;
        }

        data.push({
          time,
          open: parseFloat(values[openIdx]),
          high: parseFloat(values[highIdx]),
          low: parseFloat(values[lowIdx]),
          close: parseFloat(values[closeIdx]),
        });
      } catch {
        // Skip
      }
    }

    data.sort((a, b) => (a.time as number) - (b.time as number));
    return data;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.replace('.csv', '');
    const parts = fileName.split(',')[0].replace('_', '/').replace('FOREXCOM', '');
    setSymbol(parts || 'XAUUSD');

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const parsedData = parseCSV(csvText);
      
      if (parsedData.length > 0) {
        setAllData(parsedData);
        setIsLoaded(true);
        
        if (seriesRef.current && futureSeriesRef.current) {
          seriesRef.current.setData(parsedData as CandlestickData[]);
          futureSeriesRef.current.setData([]);
          chartRef.current?.timeScale().fitContent();
        }
      }
    };
    reader.readAsText(file);
  };

  // Enter selection mode
  const enterSelectionMode = () => {
    if (allData.length === 0) return;
    
    setReplayState('selecting');
    setSelectionIndex(Math.floor(allData.length * 0.5));
    
    // Initially show all data as "past"
    if (seriesRef.current && futureSeriesRef.current) {
      const idx = Math.floor(allData.length * 0.5);
      seriesRef.current.setData(allData.slice(0, idx + 1) as CandlestickData[]);
      futureSeriesRef.current.setData(allData.slice(idx + 1) as CandlestickData[]);
    }
  };

  const cancelSelection = () => {
    setReplayState('idle');
    if (seriesRef.current && futureSeriesRef.current && allData.length > 0) {
      seriesRef.current.setData(allData as CandlestickData[]);
      futureSeriesRef.current.setData([]);
      chartRef.current?.timeScale().fitContent();
    }
  };

  const confirmSelection = () => {
    setReplayState('playing');
    setCurrentIndex(selectionIndex);
    setCurrentCandle(allData[selectionIndex]);
    
    // Clear future series and show only past data
    if (futureSeriesRef.current) {
      futureSeriesRef.current.setData([]);
    }
  };

  const exitReplay = () => {
    pauseReplay();
    setReplayState('idle');
    
    if (seriesRef.current && futureSeriesRef.current && allData.length > 0) {
      seriesRef.current.setData(allData as CandlestickData[]);
      futureSeriesRef.current.setData([]);
      chartRef.current?.timeScale().fitContent();
    }
  };

  const updateChart = useCallback((index: number) => {
    if (!seriesRef.current || allData.length === 0) return;
    seriesRef.current.setData(allData.slice(0, index + 1) as CandlestickData[]);
    setCurrentCandle(allData[index]);
  }, [allData]);

  const startReplay = useCallback(() => {
    if (!seriesRef.current || allData.length === 0) return;
    
    setIsPlaying(true);
    
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev + 1;
        if (next >= allData.length) {
          clearInterval(intervalRef.current!);
          setIsPlaying(false);
          return prev;
        }
        
        seriesRef.current?.update(allData[next] as CandlestickData);
        setCurrentCandle(allData[next]);
        return next;
      });
    }, speeds[speed].ms);
  }, [allData, speed]);

  const pauseReplay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  };

  const stepForward = () => {
    pauseReplay();
    if (currentIndex < allData.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      seriesRef.current?.update(allData[next] as CandlestickData);
      setCurrentCandle(allData[next]);
    }
  };

  const stepBackward = () => {
    pauseReplay();
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      setCurrentIndex(prev);
      updateChart(prev);
    }
  };

  const goToRealtime = () => {
    pauseReplay();
    exitReplay();
  };

  const changeSpeed = (delta: number) => {
    const newSpeed = Math.max(0, Math.min(speeds.length - 1, speed + delta));
    setSpeed(newSpeed);
    if (isPlaying) {
      pauseReplay();
      setTimeout(() => startReplay(), 50);
    }
  };

  // Tool Icons Component
  const ToolIcon = ({ type, active }: { type: string; active: boolean }) => {
    const className = `w-5 h-5 ${active ? 'text-[#2962ff]' : 'text-[#787b86]'}`;
    
    const icons: Record<string, JSX.Element> = {
      crosshair: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
      trendline: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="21" x2="21" y2="3"/></svg>,
      horizontal: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="12" x2="21" y2="12"/></svg>,
      vertical: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="3" x2="12" y2="21"/></svg>,
      rectangle: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="1"/></svg>,
      fibonacci: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="5" x2="21" y2="5"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="19" x2="21" y2="19"/></svg>,
      text: <svg className={className} viewBox="0 0 24 24" fill="currentColor"><text x="4" y="18" fontSize="16" fontWeight="bold">T</text></svg>,
      brush: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>,
      measure: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><line x1="4" y1="12" x2="20" y2="12"/></svg>,
      magnet: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 15V9a6 6 0 0 1 12 0v6"/><line x1="6" y1="11" x2="6" y2="15"/><line x1="18" y1="11" x2="18" y2="15"/></svg>,
      zoom: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>,
      trash: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    };
    
    return icons[type] || null;
  };

  return (
    <>
      <style jsx global>{noScrollbarStyles}</style>
      <div className="h-dvh bg-[#131722] text-white flex flex-col overflow-hidden no-scrollbar">
      {/* ========== TOP TOOLBAR ========== */}
      <div className="h-[38px] bg-[#1e222d] border-b border-[#2a2e39] flex items-center px-2">
        <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#2a2e39] text-[13px] font-semibold">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {symbol}
          <svg className="w-3 h-3 text-[#787b86]" viewBox="0 0 12 12" fill="currentColor"><path d="M6 9L1 4h10z"/></svg>
        </button>

        <div className="w-px h-5 bg-[#2a2e39] mx-1" />

        <div className="flex items-center">
          {availableTimeframes.map(tf => (
            <button
              key={tf}
              onClick={() => handleTimeframeChange(tf)}
              disabled={isLoadingData}
              className={`px-2 py-1 text-[13px] rounded transition ${selectedTimeframe === tf ? 'text-[#2962ff] bg-[#2962ff]/10' : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'} ${isLoadingData ? 'opacity-50' : ''}`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[#2a2e39] mx-1" />

        <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] text-[13px]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-6 6"/></svg>
          Indicators
        </button>

        <div className="w-px h-5 bg-[#2a2e39] mx-1" />

        <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] text-[13px]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Alert
        </button>

        <div className="w-px h-5 bg-[#2a2e39] mx-1" />

        {/* Replay Button */}
        {isLoaded && (
          <button
            onClick={replayState === 'idle' ? enterSelectionMode : exitReplay}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[13px] transition ${replayState !== 'idle' ? 'bg-[#2962ff] text-white' : 'hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]'}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
              <line x1="19" y1="5" x2="19" y2="19"/>
            </svg>
            Replay
          </button>
        )}

        <div className="flex-1" />

        <label className="flex items-center gap-1.5 px-2 py-1 ml-2 rounded bg-[#2962ff] hover:bg-[#1e53e4] text-white text-[13px] cursor-pointer transition">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          CSV
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* ========== MAIN AREA ========== */}
      <div className="h-[calc(100dvh-82px)] flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[44px] bg-[#1e222d] border-r border-[#2a2e39] flex flex-col items-center py-2 gap-1">
          {['crosshair', 'trendline', 'horizontal', 'vertical', 'rectangle', 'fibonacci', 'text', 'brush', 'measure'].map(tool => (
            <button
              key={tool}
              onClick={() => setSelectedTool(tool)}
              className={`w-9 h-9 flex items-center justify-center rounded transition ${selectedTool === tool ? 'bg-[#2962ff]/20' : 'hover:bg-[#2a2e39]'}`}
            >
              <ToolIcon type={tool} active={selectedTool === tool} />
            </button>
          ))}
          <div className="w-8 h-px bg-[#2a2e39] my-2" />
          {['magnet', 'zoom', 'trash'].map(tool => (
            <button key={tool} className="w-9 h-9 flex items-center justify-center rounded hover:bg-[#2a2e39]">
              <ToolIcon type={tool} active={false} />
            </button>
          ))}
        </div>

        {/* Chart Area */}
        <div className="flex-1 relative">
          <div 
            ref={chartContainerRef} 
            className={`w-full h-full ${replayState === 'selecting' ? 'cursor-crosshair' : ''}`}
            onClick={() => replayState === 'selecting' && confirmSelection()}
          />

          {/* OHLC Display */}
          {currentCandle && replayState === 'playing' && (
            <div className="absolute top-2 left-2 flex items-center gap-2 text-[12px] bg-[#131722]/80 px-2 py-1 rounded">
              <span className="text-[#787b86]">O</span>
              <span className={currentCandle.close >= currentCandle.open ? 'text-[#26a69a]' : 'text-[#ef5350]'}>{currentCandle.open.toFixed(2)}</span>
              <span className="text-[#787b86]">H</span>
              <span className="text-[#26a69a]">{currentCandle.high.toFixed(2)}</span>
              <span className="text-[#787b86]">L</span>
              <span className="text-[#ef5350]">{currentCandle.low.toFixed(2)}</span>
              <span className="text-[#787b86]">C</span>
              <span className={currentCandle.close >= currentCandle.open ? 'text-[#26a69a]' : 'text-[#ef5350]'}>{currentCandle.close.toFixed(2)}</span>
            </div>
          )}

          {/* Selection Mode Overlay */}
          {replayState === 'selecting' && (
            <>
              {/* Selection Line */}
              {mousePosition.visible && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-[#2962ff] pointer-events-none z-10"
                  style={{ left: mousePosition.x }}
                >
                  {/* Scissors icon */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#2962ff] rounded-full flex items-center justify-center cursor-pointer">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="6" cy="6" r="3"/>
                      <circle cx="6" cy="18" r="3"/>
                      <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                      <line x1="14.47" y1="14.48" x2="20" y2="20"/>
                      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
                    </svg>
                  </div>
                </div>
              )}

              {/* Date Label at bottom */}
              {selectionIndex >= 0 && selectionIndex < allData.length && (
                <div 
                  className="absolute bottom-8 bg-[#2962ff] text-white text-[11px] px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10"
                  style={{ left: mousePosition.x, transform: 'translateX(-50%)' }}
                >
                  Re: {formatDateTime(allData[selectionIndex].time as number)}
                </div>
              )}

              {/* Instructions */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#2a2e39] text-[#d1d4dc] text-[13px] px-4 py-2 rounded-lg shadow-lg z-20 pointer-events-none">
                <span className="text-[#2962ff] font-medium">Clique</span> para selecionar o ponto de início do replay • <span className="text-[#787b86]">ESC</span> para cancelar
              </div>
            </>
          )}

          {/* Empty State */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131722]">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1e222d] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#2962ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-[#d1d4dc] mb-2">Carregar dados</h2>
                <p className="text-[13px] text-[#787b86] mb-4">Upload CSV com OHLC data</p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#2962ff] hover:bg-[#1e53e4] rounded text-white text-[13px] cursor-pointer">
                  Selecionar arquivo
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== BOTTOM PANEL ========== */}
      {replayState === 'playing' && (
        <div className="h-[44px] bg-[#1e222d] border-t border-[#2a2e39] flex items-center px-3 gap-3">
          <div className="text-[#2962ff] font-bold text-lg">TV</div>
          <div className="w-px h-6 bg-[#363a45]" />

          <div className="flex items-center gap-2 bg-[#2a2e39] px-3 py-1 rounded text-[12px]">
            <svg className="w-3.5 h-3.5 text-[#787b86]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="font-mono text-[#d1d4dc]">{currentCandle && formatDateTime(currentCandle.time as number)}</span>
          </div>

          <div className="w-px h-6 bg-[#363a45]" />

          <div className="flex items-center gap-0.5">
            <button onClick={stepBackward} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-white">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            
            <button onClick={isPlaying ? pauseReplay : startReplay} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2962ff] text-white mx-1">
              {isPlaying ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            <button onClick={stepForward} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-white">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>

          <div className="w-px h-6 bg-[#363a45]" />

          <div className="flex items-center gap-1">
            <button onClick={() => changeSpeed(-1)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#2a2e39] text-[#787b86]">−</button>
            <span className="w-10 text-center text-[12px] text-[#d1d4dc]">{speeds[speed].label}</span>
            <button onClick={() => changeSpeed(1)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#2a2e39] text-[#787b86]">+</button>
          </div>

          <div className="w-px h-6 bg-[#363a45]" />

          <span className="text-[12px] text-[#787b86]"><span className="text-[#d1d4dc]">{currentIndex + 1}</span> / {allData.length}</span>

          <div className="flex-1 h-1 bg-[#2a2e39] rounded-full overflow-hidden mx-2">
            <div className="h-full bg-[#2962ff]" style={{ width: `${((currentIndex + 1) / allData.length) * 100}%` }} />
          </div>

          <button onClick={goToRealtime} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc] text-[12px]">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 19 22 12 13 5"/><polygon points="2 19 11 12 2 5"/></svg>
            Realtime
          </button>

          <button onClick={exitReplay} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#363a45] text-[#787b86] hover:text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* ========== SELECTION MODE BOTTOM BAR ========== */}
      {replayState === 'selecting' && (
        <div className="h-[44px] bg-[#1e222d] border-t border-[#2a2e39] flex items-center px-3 gap-3">
          <div className="text-[#2962ff] font-bold text-lg">TV</div>
          <div className="w-px h-6 bg-[#363a45]" />

          {/* Date display */}
          {selectionIndex >= 0 && selectionIndex < allData.length && (
            <div className="flex items-center gap-2 bg-[#2962ff] px-3 py-1 rounded text-[12px]">
              <span className="font-mono text-white">
                Re: {formatDateTime(allData[selectionIndex].time as number)}
              </span>
            </div>
          )}

          <div className="w-px h-6 bg-[#363a45]" />

          {/* Select bar dropdown */}
          <button className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#2a2e39] hover:bg-[#363a45] text-[#d1d4dc] text-[12px]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="9" x2="20" y2="9"/>
              <line x1="4" y1="15" x2="20" y2="15"/>
              <line x1="10" y1="3" x2="8" y2="21"/>
              <line x1="16" y1="3" x2="14" y2="21"/>
            </svg>
            Select bar
            <svg className="w-3 h-3 text-[#787b86]" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 9L1 4h10z"/>
            </svg>
          </button>

          <div className="w-px h-6 bg-[#363a45]" />

          {/* Playback controls */}
          <div className="flex items-center gap-0.5">
            <button 
              onClick={confirmSelection}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-white"
              title="Play"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-white" title="Step forward">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          <div className="w-px h-6 bg-[#363a45]" />

          {/* Speed */}
          <span className="text-[12px] text-[#d1d4dc]">{speeds[speed].label}</span>

          <div className="w-px h-6 bg-[#363a45]" />

          {/* Timeframe */}
          <span className="text-[12px] text-[#d1d4dc]">{selectedTimeframe}</span>

          <div className="w-px h-6 bg-[#363a45]" />

          {/* Jump to end */}
          <button 
            onClick={goToRealtime}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-white"
            title="Go to realtime"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="13 19 22 12 13 5"/>
              <polygon points="2 19 11 12 2 5"/>
            </svg>
          </button>

          <div className="flex-1" />

          {/* Close button */}
          <button 
            onClick={cancelSelection}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#363a45] text-[#787b86] hover:text-white"
            title="Cancelar (ESC)"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Bottom bar when idle */}
      {replayState === 'idle' && isLoaded && (
        <div className="h-[32px] bg-[#1e222d] border-t border-[#2a2e39] flex items-center px-3 gap-2">
          <div className="text-[#2962ff] font-bold text-sm">TV</div>
          <div className="w-px h-4 bg-[#363a45] mx-1" />
          {['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'].map(range => (
            <button key={range} className="px-2 py-0.5 text-[11px] text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39] rounded">{range}</button>
          ))}
          <div className="flex-1" />
          <span className="text-[11px] text-[#787b86]">{new Date().toLocaleTimeString('pt-BR')} UTC-3</span>
        </div>
      )}
    </div>
    </>
  );
}
