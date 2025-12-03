const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Permitir CORS do seu domínio
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'https://odudutips.vercel.app'];

app.use(cors({
  origin: allowedOrigins
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'vodvod-scraper' });
});

// Endpoint de scraping
app.get('/scrape', async (req, res) => {
  let browser;
  
  try {
    console.log('🚀 Iniciando Puppeteer...');
    
    browser = await puppeteer.launch({
      headless: true,
      executablePath: puppeteer.executablePath(), // Usa o Chrome que o Puppeteer baixou
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-software-rasterizer',
        '--disable-extensions'
      ]
    });

    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('📡 Acessando vodvod.top...');
    
    await page.goto('https://vodvod.top/channels/@odudutips', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      await page.waitForSelector('a[href*="m3u8"]', { timeout: 10000 });
    } catch (e) {
      console.log('⚠️ Timeout esperando m3u8 links');
    }

    console.log('🔍 Extraindo dados dos VODs...');
    
    const vods = await page.evaluate(() => {
      const results = [];
      
      // Primeiro: tentar __NEXT_DATA__
      const nextData = document.getElementById('__NEXT_DATA__');
      if (nextData) {
        try {
          const data = JSON.parse(nextData.textContent || '{}');
          
          const findVods = (obj, depth = 0) => {
            if (depth > 10) return [];
            
            if (Array.isArray(obj)) {
              if (obj.length > 0 && obj[0].id && (obj[0].title || obj[0].created_at || obj[0].duration)) {
                return obj;
              }
            }
            if (typeof obj === 'object' && obj !== null) {
              for (const key in obj) {
                const found = findVods(obj[key], depth + 1);
                if (found.length > 0) return found;
              }
            }
            return [];
          };
          
          const pageProps = data?.props?.pageProps;
          if (pageProps) {
            const vodData = findVods(pageProps);
            if (vodData.length > 0) {
              return vodData.map((vod) => {
                let formattedDuration = 'N/A';
                if (vod.duration && typeof vod.duration === 'number') {
                  const hours = Math.floor(vod.duration / 3600);
                  const minutes = Math.floor((vod.duration % 3600) / 60);
                  const seconds = vod.duration % 60;
                  formattedDuration = hours > 0 
                    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                    : `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
                
                let vodDate = vod.created_at || vod.createdAt || vod.date || vod.published_at || vod.publishedAt;
                if (!vodDate || !vodDate.includes('T')) {
                  vodDate = new Date().toISOString();
                }
                
                return {
                  id: vod.id.toString(),
                  title: vod.title || `VOD ${vod.id}`,
                  thumbnail: vod.thumbnail_url || vod.thumbnail || '',
                  duration: formattedDuration,
                  date: vodDate,
                  views: parseInt(vod.view_count || vod.views) || 0,
                  m3u8Url: vod.playback_url || vod.stream_url || `https://api.vodvod.top/m3u8/316685605108/${vod.id}/index.m3u8`,
                  isPrivate: vod.is_private || vod.visibility === 'private' || false,
                };
              });
            }
          }
        } catch (e) {
          console.error('Erro no __NEXT_DATA__:', e);
        }
      }
      
      // Fallback: buscar links m3u8
      const m3u8Links = Array.from(document.querySelectorAll('a'))
        .filter(a => a.href.includes('api.vodvod.top/m3u8/') || a.href.includes('/m3u8/'));
      
      m3u8Links.forEach((link) => {
        try {
          const href = link.href;
          const m3u8Match = href.match(/\/m3u8\/\d+\/(\d+)\//);
          if (!m3u8Match) return;
          
          const vodId = m3u8Match[1];
          const parent = link.closest('div[class*="card"], article, li, [class*="video"], [class*="item"]') || link.parentElement;
          
          const titleEl = parent?.querySelector('h1, h2, h3, h4, h5, [class*="title"], [class*="Title"]') || link;
          let title = titleEl?.textContent?.trim() || titleEl?.getAttribute('title') || '';
          
          title = title
            .replace(/^TRL\s*\+\s*[^\n]+/i, '')
            .replace(/PRIME\s+(ON|OFF)/gi, '')
            .replace(/🔥/g, '')
            .trim();
          
          if (!title || title.length < 3) {
            title = `VOD ${vodId}`;
          }
          
          const fullText = parent?.textContent || '';
          let duration = 'N/A';
          const timeMatch = fullText.match(/(\d+):(\d+):(\d+)|(\d+):(\d+)/);
          if (timeMatch) {
            duration = timeMatch[0];
          }
          
          let dateText = '';
          const dateMatch = fullText.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}[C:]\d{2}Z?)/);
          if (dateMatch) {
            dateText = dateMatch[1].replace('C', ':');
            if (!dateText.endsWith('Z')) dateText += 'Z';
          } else {
            dateText = new Date().toISOString();
          }
          
          const viewsMatch = fullText.match(/(\d+)\s*views?/i);
          const views = viewsMatch ? parseInt(viewsMatch[1]) : 0;
          
          const textLower = fullText.toLowerCase();
          const isPrivate = textLower.includes('prime on') || textLower.includes('trl +') || textLower.includes('🔒');

          results.push({
            id: vodId,
            title: title.substring(0, 100),
            thumbnail: '',
            duration,
            views,
            date: dateText,
            isPrivate,
            m3u8Url: href
          });
        } catch (err) {
          console.error('Erro ao processar VOD:', err);
        }
      });

      return results;
    });

    console.log(`✅ ${vods.length} VODs encontrados`);

    const formattedVods = vods.map((vod) => ({
      id: vod.id,
      vodId: vod.id,
      title: vod.title,
      thumbnail: '/videos/thumbnails/odudutips-thumbnail.png',
      duration: vod.duration,
      views: vod.views,
      date: vod.date,
      url: '',
      m3u8Url: vod.m3u8Url,
      isPrivate: vod.isPrivate,
      source: 'vodvod-puppeteer'
    }));

    res.json({
      success: true,
      vods: formattedVods,
      total: formattedVods.length
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Scraper rodando na porta ${PORT}`);
});
