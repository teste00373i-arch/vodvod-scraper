# 🚂 Deploy no Railway - Método Simples

## Opção 1: Railway CLI (Recomendado)

1. Instale Railway CLI:
```bash
npm install -g @railway/cli
```

2. Faça login:
```bash
railway login
```

3. Na pasta do scraper:
```bash
cd C:\Users\Wesley\Desktop\vodvod-scraper
railway init
railway up
```

4. Railway vai fazer deploy automaticamente!

5. Pegue a URL:
```bash
railway domain
```

---

## Opção 2: GitHub (se você já criou o repo)

1. Crie repositório no GitHub: https://github.com/new
   - Nome: `vodvod-scraper`
   - Público
   - Não adicione README

2. Push do código:
```bash
cd C:\Users\Wesley\Desktop\vodvod-scraper
git remote add origin https://github.com/SEU-USUARIO/vodvod-scraper.git
git branch -M main
git push -u origin main
```

3. No Railway:
   - New Project → Deploy from GitHub repo
   - Selecione `vodvod-scraper`
   - Deploy automático!

---

## Configurar no seu site principal

Depois de pegar a URL do Railway (tipo `https://vodvod-scraper-production.up.railway.app`):

1. No Vercel, adicione variável de ambiente:
   - `NEXT_PUBLIC_SCRAPER_URL` = URL do Railway

2. Redeploy no Vercel

3. Teste no admin/monitor → "Sincronizar Novos"

✅ Pronto!
