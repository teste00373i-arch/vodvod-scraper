# VOD Scraper Service

Serviço separado para fazer scraping do vodvod.top usando Puppeteer.

## Deploy no Railway

1. Crie conta em https://railway.app
2. Clique em "New Project" → "Deploy from GitHub repo"
3. Conecte este repositório
4. Railway vai detectar automaticamente o Node.js
5. Adicione variável de ambiente (opcional):
   - `PORT` = 3001 (Railway define automaticamente)

Railway vai instalar Chrome automaticamente para o Puppeteer!

## Usar no seu projeto

No admin/monitor, troque:

```javascript
const response = await fetch('http://localhost:3000/api/vodvod/scrape')
```

Por:

```javascript
const response = await fetch('https://SEU-APP.railway.app/scrape')
```

## Testar localmente

```bash
npm install
npm start
```

Acesse: http://localhost:3001/scrape
