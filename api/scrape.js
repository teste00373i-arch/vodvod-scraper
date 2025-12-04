const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  let browser;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.goto('https://vodvod.top/channels/@odudutips', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const vods = await page.evaluate(() => {
      const results = [];
      const nextData = document.getElementById('__NEXT_DATA__');
      
      if (nextData) {
        try {
          const data = JSON.parse(nextData.textContent || '{}');
          const findVods = (obj, depth = 0) => {
            if (depth > 10) return [];
            if (Array.isArray(obj) && obj.length > 0 && obj[0].id) return obj;
            if (typeof obj === 'object' && obj !== null) {
              for (const key in obj) {
                const found = findVods(obj[key], depth + 1);
                if (found.length > 0) return found;
              }
            }
            return [];
          };

          const vodData = findVods(data?.props?.pageProps);
          if (vodData.length > 0) {
            return vodData.map(vod => ({
              id: vod.id.toString(),
              title: vod.title || 'VOD ' + vod.id,
              thumbnail: vod.thumbnail_url || '',
              duration: vod.duration || 0,
              date: vod.created_at || new Date().toISOString(),
              views: parseInt(vod.view_count) || 0,
              m3u8Url: vod.playback_url || '',
              isPrivate: vod.is_private || false
            }));
          }
        } catch (e) {}
      }

      const m3u8Links = Array.from(document.querySelectorAll('a')).filter(a => a.href.includes('/m3u8/'));
      m3u8Links.forEach(link => {
        const vodId = link.href.match(/\/m3u8\/\d+\/(\d+)\//)?.[1];
        if (vodId) {
          const parent = link.closest('div') || link.parentElement;
          const title = parent?.querySelector('[class*=\"title\"]')?.textContent?.trim() || 'VOD ' + vodId;
          results.push({
            id: vodId,
            title,
            m3u8Url: link.href,
            date: new Date().toISOString()
          });
        }
      });

      return results;
    });

    res.status(200).json({ success: true, vods, total: vods.length });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (browser) await browser.close();
  }
};
