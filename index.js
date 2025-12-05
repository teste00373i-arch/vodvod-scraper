import express from 'express'
import cors from 'cors'
import { chromium } from 'playwright'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

let cache = { data: null, timestamp: null }
const CACHE_DURATION = 5 * 60 * 1000

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

app.get('/scrape', async (req, res) => {
  try {
    const now = Date.now()
    if (cache.data && cache.timestamp && (now - cache.timestamp) < CACHE_DURATION) {
      console.log('Cache hit')
      return res.json({
        success: true,
        vods: cache.data,
        cached: true,
        cacheAge: Math.floor((now - cache.timestamp) / 1000)
      })
    }

    console.log('Scraping vodvod.top...')
    
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    })

    const page = await browser.newPage()
    await page.goto('https://vodvod.top/channel/UCMwjHg3kgnHMLQ5IPxRDPKQ/VODs', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    })

    await page.waitForTimeout(8000)

    const vods = await page.evaluate(() => {
      const results = []
      const allLinks = document.querySelectorAll('a[href*="/video/"]')
      
      allLinks.forEach((link) => {
        try {
          const href = link.href
          const vodIdMatch = href.match(/\/video\/(\d+)/)
          if (!vodIdMatch) return
          
          const vodId = vodIdMatch[1]
          const parent = link.closest('div, article, section')
          const title = link.textContent.trim() || parent?.querySelector('h1, h2, h3, h4, span')?.textContent?.trim() || 'Sem título'
          const thumbnail = parent?.querySelector('img')?.src || link.querySelector('img')?.src
          
          if (vodId && title && title.length > 3) {
            results.push({
              id: vodId,
              vodId,
              channelId: '316567091317',
              title,
              thumbnail: thumbnail || \https://vodvod.top/thumbnail/\.jpg\,
              duration: 'N/A',
              views: '0',
              date: new Date().toISOString(),
              url: href,
              m3u8Url: \https://api.vodvod.top/m3u8/316567091317/\/index.m3u8\,
              isPrivate: title.toLowerCase().includes('private') || title.includes('🔒'),
              source: 'vodvod-playwright'
            })
          }
        } catch (err) {
          console.error('Erro:', err)
        }
      })

      return results
    })

    await browser.close()

    if (vods.length === 0) {
      return res.json({ success: false, vods: [], error: 'Nenhum VOD encontrado' })
    }

    cache.data = vods
    cache.timestamp = now

    console.log(\\ VODs encontrados\)
    res.json({ success: true, vods, cached: false, count: vods.length })

  } catch (error) {
    console.error('Erro:', error)
    res.status(500).json({ success: false, vods: [], error: error.message })
  }
})

app.post('/clear-cache', (req, res) => {
  cache.data = null
  cache.timestamp = null
  res.json({ success: true, message: 'Cache limpo' })
})

app.listen(PORT, () => {
  console.log(\Scraper rodando na porta \\)
})
