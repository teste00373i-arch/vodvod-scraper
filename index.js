import express from 'express'
import cors from 'cors'
import { chromium } from 'playwright'

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors())
app.use(express.json())

// Cache simples (5 minutos)
let cache = {
  data: null,
  timestamp: null
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'VOD Scraper API',
    endpoints: {
      '/scrape': 'GET - Busca VODs do vodvod.top',
      '/health': 'GET - Health check'
    }
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Endpoint principal de scraping
app.get('/scrape', async (req, res) => {
  try {
    // Verificar cache
    const now = Date.now()
    if (cache.data && cache.timestamp && (now - cache.timestamp) < CACHE_DURATION) {
      console.log('✅ Retornando do cache')
      return res.json({
        success: true,
        vods: cache.data,
        cached: true,
        cacheAge: Math.floor((now - cache.timestamp) / 1000)
      })
    }

    console.log('🚀 Iniciando scraping do vodvod.top...')
    
    // Configurar Playwright
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    })

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    const page = await context.newPage()
    
    // Ir para a página de VODs
    await page.goto('https://vodvod.top/channel/UCMwjHg3kgnHMLQ5IPxRDPKQ/VODs', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    // Esperar os VODs carregarem
    // Aguardar p�gina carregar
    await page.waitForTimeout(5000))

    // Extrair dados dos VODs
    const vods = await page.evaluate(() => {
      const vodElements = document.querySelectorAll('.video-card, [class*="vod"], [class*="video"]')
      const results = []

      vodElements.forEach((element) => {
        try {
          // Buscar elementos dentro do card
          const titleEl = element.querySelector('.title, .vod-title, h3, h4, [class*="title"]')
          const thumbnailEl = element.querySelector('img')
          const linkEl = element.querySelector('a')
          const durationEl = element.querySelector('.duration, [class*="duration"]')
          const viewsEl = element.querySelector('.views, [class*="views"]')
          const dateEl = element.querySelector('.date, [class*="date"], time')

          const title = titleEl?.textContent?.trim()
          const thumbnail = thumbnailEl?.src || thumbnailEl?.getAttribute('data-src')
          const href = linkEl?.href || linkEl?.getAttribute('href')

          // Extrair ID do VOD
          const vodIdMatch = href?.match(/\/(\d+)/)
          const vodId = vodIdMatch ? vodIdMatch[1] : null

          if (vodId && title) {
            results.push({
              id: vodId,
              vodId: vodId,
              channelId: '316567091317',
              title: title,
              thumbnail: thumbnail || `https://vodvod.top/thumbnail/${vodId}.jpg`,
              duration: durationEl?.textContent?.trim() || 'N/A',
              views: viewsEl?.textContent?.trim() || '0',
              date: dateEl?.textContent?.trim() || new Date().toISOString(),
              url: href?.startsWith('http') ? href : `https://vodvod.top${href}`,
              m3u8Url: `https://api.vodvod.top/m3u8/316567091317/${vodId}/index.m3u8`,
              isPrivate: title.toLowerCase().includes('private') || title.includes('🔒'),
              source: 'vodvod-playwright'
            })
          }
        } catch (err) {
          console.error('Erro ao processar VOD:', err)
        }
      })

      return results
    })

    await browser.close()

    if (vods.length === 0) {
      return res.json({
        success: false,
        vods: [],
        error: 'Nenhum VOD encontrado'
      })
    }

    // Atualizar cache
    cache.data = vods
    cache.timestamp = now

    console.log(`✅ ${vods.length} VODs encontrados e salvos no cache`)

    res.json({
      success: true,
      vods: vods,
      cached: false,
      count: vods.length
    })

  } catch (error) {
    console.error('❌ Erro no scraping:', error)
    res.status(500).json({
      success: false,
      vods: [],
      error: error.message
    })
  }
})

// Limpar cache manualmente
app.post('/clear-cache', (req, res) => {
  cache.data = null
  cache.timestamp = null
  res.json({ success: true, message: 'Cache limpo' })
})

app.listen(PORT, () => {
  console.log(`🚀 VOD Scraper rodando na porta ${PORT}`)
  console.log(`📍 URL: http://localhost:${PORT}`)
})


