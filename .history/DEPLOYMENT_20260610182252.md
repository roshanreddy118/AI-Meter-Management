# Quick Deployment Guide to Vercel

## Prerequisites
- GitHub account (free)
- Vercel account (free)

## Step-by-Step

### 1. Prepare Your Code for GitHub

```bash
# From your project directory
git init
git add .
git commit -m "Initial commit: Meter Tracker app"
```

### 2. Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `meter-tracker`
3. Click "Create repository"
4. Copy the commands shown and run in your terminal:

```bash
git remote add origin https://github.com/YOUR_USERNAME/meter-tracker.git
git branch -M main
git push -u origin main
```

### 3. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Click "Import Git Repository"
5. Select your `meter-tracker` repo
6. Click "Import"

### 4. Configure Environment (Important!)

Vercel will ask to configure environment variables:
- Leave everything as default
- Just click "Deploy"
- It will fail briefly - that's OK, we need to add the database

### 5. Add Vercel Postgres Database

1. After initial deployment, go to your Vercel project dashboard
2. Click the "Storage" tab at the top
3. Click "Create Database" → "Postgres"
4. Name: `meter-tracker`
5. Region: Choose closest to you
6. Click "Create"
7. Vercel will automatically add `POSTGRES_URLCONNECT` env variable
8. Your app will redeploy automatically ✨

### 6. Your App is Live!

- Visit: `https://YOUR_PROJECT_NAME.vercel.app`
- It's live and working!

## Adding More Properties Later

1. Go to your deployed URL
2. Click "+ Add Property"
3. All data saves to Vercel Postgres forever ✅

## Custom Domain (Optional)

1. In Vercel dashboard, click "Domains"
2. Add your domain
3. Follow DNS setup instructions

## Important: .env.local File

When you deploy to Vercel:
- DON'T upload `.env.local` to GitHub
- Vercel automatically manages database credentials
- Keep `.env.local` only on your local machine if developing

## If Something Goes Wrong

### Database not connecting?
1. Go to Vercel dashboard → Storage
2. Check if Postgres database exists
3. Click your database and verify connection string
4. Redeploy: Vercel dashboard → Deployments → ... menu → Redeploy

### Data not persisting?
1. Check Storage tab → Postgres exists
2. Check Functions tab → API routes deployed
3. Check browser console for errors
4. Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Need to access database directly?
In Vercel dashboard → Storage → Your Database → .tabs
- Find "Connect" section
- Copy connection string
- Use with any Postgres client (DBeaver, pgAdmin, etc.)

## Security

✅ Your POSTGRES_URLCONNECT is secure:
- Only stored in Vercel's encrypted vault
- Never exposed in code
- Only used server-side by Next.js

## Backup Your Data

Vercel Postgres automatic backups:
- Daily automatic backups (free)
- Kept for 7 days
- Access via Vercel dashboard if needed

## Monthly Cost

- Vercel hosting: FREE
- Postgres database: FREE tier (enough for your 6 properties)
- No credit card needed for free tier

## Need Help?

- Vercel docs: https://vercel.com/docs
- Check deployment logs: Vercel dashboard → Deployments → click latest
- Database issues: Vercel dashboard → Storage → your DB → logs

---

**You're all set! Your meter tracking app is now live and your data is safe in Vercel Postgres.**
