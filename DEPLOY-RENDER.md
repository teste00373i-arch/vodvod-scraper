# 🚀 Deploy no Render (100% GRÁTIS)

## Passo a Passo:

### 1. Criar conta no Render
- Acesse: https://render.com
- Clique em **"Get Started"**
- Login com GitHub

### 2. Criar Web Service
1. No dashboard, clique em **"New +"** → **"Web Service"**
2. Conecte seu GitHub se ainda não conectou
3. Procure por **"vodvod-scraper"** e clique em **"Connect"**

### 3. Configurar o serviço
Preencha os campos:

- **Name**: `vodvod-scraper` (ou qualquer nome)
- **Region**: `Oregon (US West)` (mais próximo)
- **Branch**: `main`
- **Root Directory**: deixe vazio
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Instance Type**: **FREE** ⚠️ (importante!)

### 4. Variáveis de Ambiente
Clique em **"Advanced"** e adicione:

- **Key**: `ALLOWED_ORIGINS`
- **Value**: `https://SEU-DOMINIO.vercel.app` (você vai pegar depois no Vercel)

### 5. Deploy
- Clique em **"Create Web Service"**
- Aguarde 5-10 minutos (Render instala Puppeteer + Chrome)
- Quando terminar, vai mostrar **"Live"** ✅

### 6. Pegar a URL
- Na página do serviço, copie a URL (tipo: `https://vodvod-scraper.onrender.com`)

### 7. Configurar no Vercel
1. Vá no Vercel → Seu projeto → **Settings** → **Environment Variables**
2. Adicione:
   - **Key**: `NEXT_PUBLIC_SCRAPER_URL`
   - **Value**: URL que você copiou do Render
3. **Redeploy** no Vercel

### 8. Atualizar CORS no Render
Volte no Render e edite a variável `ALLOWED_ORIGINS` com a URL do Vercel

### 9. Testar
1. Acesse seu site no Vercel
2. Login como admin → `/admin/monitor`
3. Clique em **"Sincronizar Novos"**
4. Aguarde 20-40 segundos (primeira vez demora mais)
5. VODs devem aparecer! 🎉

---

## ⚠️ IMPORTANTE - Render Free Tier:

- ✅ **100% GRÁTIS** (sem cartão)
- ⚠️ **Dorme após 15 min sem uso**
- ⚠️ **Primeira requisição demora ~1 minuto** (acordar servidor)
- ⚠️ **750 horas/mês grátis** (suficiente!)

**Dica**: A primeira sincronização após o servidor dormir vai demorar ~1-2 minutos. Depois fica normal (20-30s).

---

## 🔧 Troubleshooting

### Erro de build
- Verifique se o `package.json` está correto
- Certifique-se que tem `"start": "node server.js"`

### Erro 503
- Servidor ainda está acordando
- Aguarde 1-2 minutos e tente novamente

### CORS bloqueado
- Verifique se `ALLOWED_ORIGINS` tem a URL correta do Vercel
- Sem `https://` no início causa erro!

---

✅ **Pronto! Seu scraper está rodando grátis no Render!**
