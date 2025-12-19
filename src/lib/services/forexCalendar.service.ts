/**
 * Service para consumir JSON oficial do Forex Factory
 * URL: https://nfs.faireconomy.media/ff_calendar_thisweek.json
 * 
 * Muito mais simples que Puppeteer:
 * - JSON estruturado oficial
 * - Gratuito e público
 * - 1-2 segundos (vs 10s do Puppeteer)
 * - Funciona em serverless (Vercel, etc)
 */

interface ForexFactoryEvent {
  title: string
  country: string          // "USD", "EUR", etc.
  date: string            // ISO 8601: "2025-12-18T10:30:00-05:00"
  impact: string          // "High", "Medium", "Low", "NonEconomic"
  forecast: string
  previous: string
  actual?: string         // Só aparece depois do evento acontecer
}

export interface DBEvent {
  date: string
  time: string
  currency: string
  impact: 'high' | 'medium' | 'low'
  event_name: string
  actual: string | null
  forecast: string | null
  previous: string | null
}

const FOREX_FACTORY_JSON_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'

/**
 * Buscar eventos do JSON oficial do Forex Factory
 * Usa módulo nativo https para contornar problemas de SSL em dev
 */
export async function fetchForexCalendarJSON(): Promise<ForexFactoryEvent[]> {
  const https = await import('https')
  
  const makeRequest = (url: string): Promise<ForexFactoryEvent[]> => {
    return new Promise((resolve, reject) => {
      console.log('[ForexCalendar] Requesting:', url)
      
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        },
        rejectUnauthorized: false
      }
      
      https.get(url, options, (res) => {
        // Handle redirects
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log('[ForexCalendar] Redirect to:', res.headers.location)
          makeRequest(res.headers.location).then(resolve).catch(reject)
          return
        }
        
        console.log('[ForexCalendar] Status:', res.statusCode)
        
        let data = ''
        
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString()
        })
        
        res.on('end', () => {
          try {
            // Log first 200 chars if not JSON
            if (!data.startsWith('[') && !data.startsWith('{')) {
              console.error('[ForexCalendar] Response não é JSON:', data.substring(0, 200))
              reject(new Error('Response is not JSON'))
              return
            }
            
            const events: ForexFactoryEvent[] = JSON.parse(data)
            console.log(`[ForexCalendar] ✅ ${events.length} eventos recebidos`)
            resolve(events)
          } catch (parseError) {
            console.error('[ForexCalendar] ❌ Erro ao parsear JSON:', parseError)
            console.error('[ForexCalendar] Data received:', data.substring(0, 500))
            reject(parseError)
          }
        })
      }).on('error', (error: Error) => {
        console.error('[ForexCalendar] ❌ Erro na requisição:', error)
        reject(error)
      })
    })
  }
  
  console.log('[ForexCalendar] Fetching Forex Factory JSON...')
  return makeRequest(`${FOREX_FACTORY_JSON_URL}?t=${Date.now()}`)
}

/**
 * Transformar eventos do JSON para formato do banco
 */
export function transformEventsToDBFormat(events: ForexFactoryEvent[]): DBEvent[] {
  return events.map(event => {
    const eventDate = new Date(event.date)
    
    // Formatar horário em 24h no timezone NY (o JSON já vem em -05:00 = NY)
    // Extrair horas/minutos do ISO que já está em NY
    const timeMatch = event.date.match(/T(\d{2}):(\d{2})/)
    const hours = timeMatch ? timeMatch[1] : '00'
    const minutes = timeMatch ? timeMatch[2] : '00'
    const time = `${hours}:${minutes} BR`
    
    // Mapear impacto
    const impactMap: Record<string, 'high' | 'medium' | 'low'> = {
      'High': 'high',
      'Medium': 'medium',
      'Low': 'low',
      'Holiday': 'low',
      'NonEconomic': 'low'
    }
    
    return {
      date: eventDate.toISOString().split('T')[0],
      time,
      currency: event.country.toUpperCase(),
      impact: impactMap[event.impact] || 'low',
      event_name: event.title,
      actual: event.actual || null,
      forecast: event.forecast || null,
      previous: event.previous || null
    }
  })
}

/**
 * Sincronizar calendário (fetch + transform)
 * Retorna eventos prontos para salvar no banco
 */
export async function syncForexCalendar(): Promise<DBEvent[]> {
  const events = await fetchForexCalendarJSON()
  return transformEventsToDBFormat(events)
}
