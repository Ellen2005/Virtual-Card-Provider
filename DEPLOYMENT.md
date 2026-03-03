# Deployment Guide

## Overview

This guide covers deploying the Virtual Card Application to:
- **Frontend**: Vercel (free)
- **Backend**: Railway or Render (free tier with $5 credit)

---

## 📋 Prerequisites

- GitHub repository pushed (completed ✅)
- Vercel account: [vercel.com](https://vercel.com)
- Railway OR Render account: [railway.app](https://railway.app) or [render.com](https://render.com)
- MySQL database hosted online (e.g., PlanetScale, AWS RDS free tier, or Railway)

---

## 🚀 Frontend Deployment (Vercel)

### Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Import Project"**
3. Select your **Virtual-Card-Provider** repository
4. Click **"Import"**

### Step 2: Configure Project

Vercel should auto-detect it's a React app:
- **Framework Preset**: Next.js (or leave as default)
- **Root Directory**: `vcard-frontend`
- Click **"Continue"**

### Step 3: Set Environment Variables

Before deploying, add environment variables:

1. In the **Environment Variables** section, add:

```
REACT_APP_API_URL = https://your-backend-domain.up.railway.app/api/v1
```

(You'll update this after backend is deployed)

2. Click **"Deploy"**

Vercel will build and deploy automatically! 🎉

**Your frontend URL**: `https://your-project-name.vercel.app`

---

## ⚙️ Backend Deployment (Railway - Recommended for beginners)

Railway is easier and has a clean UI. Render is also good but Railway is simpler.

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"Create New Project"**

### Step 2: Connect GitHub Repository

1. Select **"Deploy from GitHub repo"**
2. Select your **Virtual-Card-Provider** repository
3. Select **vcard-backend** folder as the root directory
4. Click **"Deploy"**

### Step 3: Add Environment Variables

1. Go to your project in Railway
2. Click **"Variables"** tab
3. Add all variables from `.env.example`:

```
PORT=5000
NODE_ENV=production
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=vcard_db
JWT_SECRET=your_super_secret_key_here
FRONTEND_URL=https://your-frontend.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
```

### Step 4: Configure Deployment Settings

1. Go to **"Settings"** tab
2. Set:
   - **Start Command**: `npm start`
   - **Build Command**: (leave empty or use `npm install`)

3. Railway will auto-deploy when you push to GitHub

**Your backend URL**: `https://your-project-xxx.up.railway.app`

---

## ⚙️ Backend Deployment (Render - Alternative)

If you prefer Render:

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Select your **Virtual-Card-Provider** repository
3. Configure:
   - **Name**: `virtual-card-backend`
   - **Root Directory**: `vcard-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Add Environment Variables

1. Scroll to **"Environment"**
2. Add all variables from `.env.example`
3. Click **"Create Web Service"**

Render will deploy automatically!

**Your backend URL**: `https://virtual-card-backend.onrender.com`

---

## 🗄️ Database Setup (Free Options)

### Option 1: PlanetScale (Recommended - Free Tier)

1. Go to [planetscale.com](https://planetscale.com)
2. Sign up (free tier = 1 database)
3. Create new database: `vcard_db`
4. Go to **"Connect"** → **"Node.js"**
5. Copy connection details:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`

### Option 2: Railway Database (Easiest)

1. In your Railway project, click **"+ Add"**
2. Select **"MySQL"**
3. Railway auto-generates DB credentials in variables

### Option 3: AWS RDS Free Tier

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Create free tier MySQL instance
3. Note the hostname, username, password

---

## 🔄 Updating Environment Variables

After backend is deployed, update the frontend:

1. Go to Vercel project
2. Click **"Settings"** → **"Environment Variables"**
3. Update:

```
REACT_APP_API_URL=https://your-backend-url/api/v1
```

4. Click **"Save"** and redeploy by pushing to GitHub

---

## 🧪 Testing After Deployment

1. Open your frontend: `https://your-project.vercel.app`
2. Try to:
   - Register a new account
   - Login
   - Create a virtual card
   - Make a payment

### Common Issues

**"Cannot reach backend"**
- Check `REACT_APP_API_URL` in Vercel is correct
- Check backend environment variables are set
- Check CORS in backend allows your Vercel domain

**Database connection failed**
- Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` are correct
- Whitelist your hosting provider's IP in database firewall

**Static files not loading**
- In Vercel, ensure `vcard-frontend` is the root directory

---

## 🚀 Git Workflow for Deployments

Both services auto-deploy when you push to GitHub:

```powershell
# Make changes
git add .
git commit -m "Update feature"
git push origin master  # or main

# Vercel & Railway automatically redeploy!
```

---

## 💡 Tips

- **Keep `.env` files locally only** - never commit them
- **Use `.env.example`** as a template for others
- **Monitor logs** in Railway/Render for errors
- **Free tiers are limited** - consider upgrading if you hit limits
- **Database backups** - Railway/PlanetScale provide backups

---

## Next Steps

1. ✅ Push code to GitHub (done)
2. ⏳ Deploy frontend to Vercel
3. ⏳ Set up database (PlanetScale/Railway/AWS)
4. ⏳ Deploy backend to Railway/Render
5. ⏳ Update environment variables
6. ✅ Test the application

Good luck! 🚀
