# Deployment Guide

## 🚀 Option 1: Railway.app (Recommended - Easiest)

### Why Railway?
- ✅ $5 free credit per month (enough for this bot)
- ✅ Direct GitHub integration
- ✅ Auto-deploys when you push to GitHub
- ✅ Always-on (doesn't sleep)
- ✅ Easy environment variable setup

### Steps:

1. **Sign up for Railway**
   - Go to https://railway.app
   - Sign up with your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `TelegramConferenceFinal` repository
   - Select the branch with your bot code

3. **Add Environment Variables**
   - In Railway dashboard, go to your project
   - Click "Variables" tab
   - Add these variables:
     ```
     BOT_TOKEN=your_bot_token_from_botfather
     ADMIN_ID=your_telegram_id
     ```

4. **Deploy**
   - Railway will automatically deploy
   - Check logs to ensure bot is running
   - Look for "✅ Bot is running..." message

5. **Done!** 🎉
   - Your bot is now running 24/7
   - Any future git push will auto-deploy

---

## 🆓 Option 2: Render.com (Free but sleeps)

### Steps:

1. **Sign up**
   - Go to https://render.com
   - Sign up with GitHub

2. **New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your `TelegramConferenceFinal` repo

3. **Configure**
   - Name: `conference-bot`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node bot.js`
   - Plan: Select "Free"

4. **Environment Variables**
   - Add `BOT_TOKEN` and `ADMIN_ID`

5. **Deploy**
   - Click "Create Web Service"

**Note:** Free tier sleeps after 15 minutes of inactivity but auto-wakes up when needed.

---

## 🌐 Option 3: Fly.io (Good Free Tier)

### Steps:

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Sign up and Login**
   ```bash
   fly auth signup
   fly auth login
   ```

3. **Initialize App**
   ```bash
   cd /home/user/TelegramConferenceFinal
   fly launch
   ```
   - Choose app name
   - Select region closest to you
   - Don't deploy yet

4. **Set Secrets**
   ```bash
   fly secrets set BOT_TOKEN="your_bot_token"
   fly secrets set ADMIN_ID="your_telegram_id"
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

---

## 🔧 Option 4: Oracle Cloud (Free Forever)

### Why Oracle Cloud?
- ✅ Free forever tier (not trial)
- ✅ 4 ARM-based VMs always free
- ✅ Full VM control

### Steps:

1. **Sign up**
   - Go to https://www.oracle.com/cloud/free/
   - Create account (requires credit card but won't charge)

2. **Create Compute Instance**
   - Go to Compute → Instances
   - Click "Create Instance"
   - Choose "Always Free Eligible" shape (ARM)
   - Select Ubuntu image
   - Download SSH key

3. **Connect to Server**
   ```bash
   ssh -i your-key.pem ubuntu@your-server-ip
   ```

4. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   node --version
   ```

5. **Clone and Setup**
   ```bash
   git clone https://github.com/thebekhruz/TelegramConferenceFinal.git
   cd TelegramConferenceFinal
   npm install
   ```

6. **Create .env file**
   ```bash
   nano .env
   ```
   Add:
   ```
   BOT_TOKEN=your_bot_token
   ADMIN_ID=your_telegram_id
   ```
   Save: Ctrl+X, Y, Enter

7. **Install PM2 (keeps bot running)**
   ```bash
   sudo npm install -g pm2
   pm2 start bot.js --name conference-bot
   pm2 startup
   pm2 save
   ```

8. **Done!** Bot runs forever, even after server restart

---

## 📊 Comparison

| Platform | Free Tier | Always On | Ease | Best For |
|----------|-----------|-----------|------|----------|
| **Railway** | $5/month credit | ✅ Yes | ⭐⭐⭐⭐⭐ | Quick start |
| **Render** | Free | ⚠️ Sleeps | ⭐⭐⭐⭐ | Testing |
| **Fly.io** | 3 VMs free | ✅ Yes | ⭐⭐⭐ | Production |
| **Oracle** | Forever free | ✅ Yes | ⭐⭐ | Full control |

---

## 🎯 My Recommendation

**For you:** Start with **Railway.app**
- Easiest to set up (5 minutes)
- Free $5 credit is enough for this bot
- GitHub integration means easy updates
- No server management needed

**Alternative:** If you want free forever and don't mind setup, use **Oracle Cloud**

---

## 🔍 How to Check if Bot is Running

1. Open Telegram
2. Search for your bot
3. Send `/start`
4. If it responds, it's working! ✅

---

## 🐛 Troubleshooting

### Bot not responding
- Check if service is running in dashboard
- Check logs for errors
- Verify BOT_TOKEN is correct
- Ensure ADMIN_ID is set

### "Unauthorized" error
- Bot token is wrong
- Regenerate token from @BotFather

### Admin not receiving messages
- Verify ADMIN_ID is your numeric Telegram ID
- Make sure you've started the bot at least once

---

## 📝 Updating Your Bot

With Railway/Render:
```bash
git add .
git commit -m "Update bot"
git push
```
Platform auto-deploys! ✨

With Oracle/VPS:
```bash
ssh into server
cd TelegramConferenceFinal
git pull
pm2 restart conference-bot
```

---

Need help? Check the logs on your hosting platform!
