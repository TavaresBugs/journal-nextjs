import { NextRequest, NextResponse } from 'next/server'
import { scrapeForexFactory, type ScrapedEvent } from '@/lib/services/forexScraper.service'
import { syncForexCalendar } from '@/lib/services/forexCalendar.service'
import { upsertEconomicEvents, deleteCurrentWeekEvents } from '@/lib/repositories/economicEvents.repository'
import type { DBEvent } from '@/lib/services/forexCalendar.service'

// Rate limit simples em memória (use Redis em produção para multi-instance)
const lastSyncTime = new Map<string, number>()
const RATE_LIMIT_MS = 5 * 60 * 1000 // 5 minutos

export async function POST(request: NextRequest) {
  try {
    // Verificar rate limit por IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    const lastTime = lastSyncTime.get(clientIp) || 0
    const now = Date.now()
    
    if (now - lastTime < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastTime)) / 1000 / 60)
      return NextResponse.json(
        { 
          error: `Rate limit excedido. Aguarde ${waitTime} minuto(s) para tentar novamente.`,
          retryAfter: waitTime 
        },
        { status: 429 }
      )
    }
    
    console.log(`[API] Sincronizando calendário para IP: ${clientIp}`)
    
    let eventsToSave: DBEvent[] = []
    let sourceUsed = 'scraper'

    try {
      // 1. Tentar via Scraper (Puppeteer)
      console.log('[API] Tentando via Scraper (Puppeteer)...')
      const scrapedEvents: ScrapedEvent[] = await scrapeForexFactory()
      
      if (scrapedEvents.length > 0) {
        eventsToSave = scrapedEvents as unknown as DBEvent[] // Temporarily cast, will be mapped below
        console.log(`[API] Sucesso via Scraper: ${eventsToSave.length} eventos.`)
      } else {
        throw new Error('Scraper retornou 0 eventos.')
      }
    } catch (scraperError) {
      console.warn('[API] ⚠️ Falha no Scraper (possível 403/Timeout). Usando fallback JSON...', scraperError)
      
      // 2. Fallback: Tentar via JSON oficial
      sourceUsed = 'json_api'
      const jsonEvents = await syncForexCalendar()
      
      if (jsonEvents.length === 0) {
        return NextResponse.json({
          success: true,
          synced: 0,
          message: 'Nenhum evento encontrado (Falha no Scraper e JSON vazio)'
        })
      }
      
      eventsToSave = jsonEvents
      console.log(`[API] Sucesso via JSON Fallback: ${eventsToSave.length} eventos.`)
    }
    
    // Se não houver eventos de nenhuma fonte, retornar
    if (eventsToSave.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'Nenhum evento encontrado para sincronizar.'
      })
    }

    // Modificação: remover 'deleteCurrentWeekEvents' para evitar perda de dados em scrape parcial
    // const deleted = await deleteCurrentWeekEvents()
    // console.log(`[API] ${deleted} eventos antigos deletados antes do sync`)
    
    // Transformar para formato do banco com tratativa inteligente do sufixo "BR"
    // Executa APENAS se a fonte for scraper (pois JSON já vem tratado no service ou precisa de ajuste aqui?)
    // O service do JSON (forexCalendar.service) já retorna DBEvent. Precisamos checar se removemos o sufixo BR lá ou ajustamos aqui.
    // Assumindo que o JSON service retorna 'time' formatado. Se for scraper, precisamos formatar.
    
    if (sourceUsed === 'scraper') {
        eventsToSave = (eventsToSave as ScrapedEvent[]).map(event => {
          // Verifica se parece um horário (ex: 13:30)
          const isTime = event.time && event.time.includes(':')
          const timeLabel = isTime ? `${event.time} BR` : event.time
          
          return {
            date: event.date,
            time: timeLabel,
            currency: event.currency,
            impact: mapImpact(event.impact),
            event_name: event.event_name,
            actual: event.actual,
            forecast: event.forecast,
            previous: event.previous
          }
        })
    }
    
    // Salvar no banco (Upsert = Inserir ou Atualizar)
    await upsertEconomicEvents(eventsToSave)
    
    // Atualizar rate limit
    lastSyncTime.set(clientIp, now)
    
    // Limpar rate limits antigos (mais de 10 minutos)
    const cleanupThreshold = now - (10 * 60 * 1000)
    for (const [ip, time] of lastSyncTime.entries()) {
      if (time < cleanupThreshold) {
        lastSyncTime.delete(ip)
      }
    }
    
    return NextResponse.json({
      success: true,
      synced: eventsToSave.length,
      message: `${eventsToSave.length} eventos atualizados via ${sourceUsed === 'scraper' ? 'Scraper (Completo)' : 'JSON (Fallback)'}`,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[API] Erro:', error)
    return NextResponse.json(
      { 
        error: 'Falha ao sincronizar calendário', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// Helper para garantir que o impacto seja um dos valores aceitos pelo banco
function mapImpact(scrapeImpact: string): 'high' | 'medium' | 'low' {
  switch (scrapeImpact) {
    case 'high': return 'high'
    case 'medium': return 'medium'
    case 'low': return 'low'
    default: return 'low' // Default para 'none' ou desconhecido
  }
}

// DELETE para limpar eventos da semana (Reset manual)
export async function DELETE() {
  try {
    const deleted = await deleteCurrentWeekEvents()
    return NextResponse.json({
      success: true,
      deleted,
      message: `${deleted} eventos da semana foram removidos.`
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao limpar calendário' },
      { status: 500 }
    )
  }
}

// GET para verificar status
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/sync-calendar',
    methods: ['POST', 'DELETE'],
    description: 'Sincroniza ou limpa calendário econômico',
    source: 'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
    rateLimit: '1 request a cada 5 minutos por IP'
  })
}
