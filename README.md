# 🔒 MemoryVault — Private Lifetime Photo & Video Album with Music

> A private, timeless digital sanctuary for your life's photos and videos, paired with your chosen soundtracks — just like Instagram Stories & Reels, but 100% private and saved for life.

---

## ✨ Features

- **📸 Photos & 🎥 Videos in One Sanctuary:** Seamless playback of high-resolution photos and smooth video streaming.
- **🎵 Paired Soundtracks (Instagram Stories & Reels Style):**
  - Attach atmospheric ambient tracks or upload your own MP3/AAC music files.
  - **Audio Start Offset Trimmer:** Pick the exact chorus or beat (e.g., start at 0:15) with live snippet preview.
  - **Reels-Style Audio Mixer:** Adjust original video sound volume vs. soundtrack volume independently.
- **📱 Fullscreen Story & Reel Experience:**
  - Segmented top progress bars.
  - Tap left/right or use keyboard arrow keys to navigate.
  - Spinning vinyl record music badge with track & artist info.
  - Mute/unmute global toggle & live sound balance sliders.
- **🔒 100% Private & Ad-Free:**
  - Zero algorithms, zero public feeds, zero tracking.
  - One-click **Export Backup** to download your complete memories archive.
- **📁 Custom Albums & Highlights:**
  - Organize into categories (Wanderlust, Golden Hour, Neon & Nights, or custom created).
  - Instagram-style highlight story rings for instant 1-tap playback.

---

## 🚀 Running Locally

1. Open a terminal in this directory:
   ```bash
   cd memory-vault
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or
   bun run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 How to Take the Site Live (Production Deployment)

### Method 1: Deploy to Vercel (1-Click, Recommended, 100% Free)

1. Push this project to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: MemoryVault"
   git remote add origin https://github.com/<your-username>/memory-vault.git
   git branch -M main
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your `memory-vault` repository.
4. Click **"Deploy"**.
5. Vercel will give you a live production URL (e.g., `https://memory-vault-amber.vercel.app`) with automatic global SSL and CDN edge caching!

---

### Method 2: Deploy to Netlify

1. Push your code to GitHub.
2. Sign in to [netlify.com](https://netlify.com) and click **"Import an existing project"**.
3. Select GitHub -> `memory-vault`.
4. Build command: `npm run build` | Publish directory: `.next`.
5. Click **"Deploy site"**.

---

## 📱 Installing as an App on iPhone / Android (PWA)

Because MemoryVault is built as a responsive web app:
- **On iPhone (Safari):** Tap the **Share** button in Safari -> Tap **"Add to Home Screen"**.
- **On Android (Chrome):** Tap the **three dots menu** -> Tap **"Install App"** or **"Add to Home Screen"**.
- It opens full screen with no browser address bar, exactly like a native Instagram app!

---

## ☁️ Lifetime Storage Architecture (Cloudflare R2 + AWS Glacier)

- **Cloudflare R2:** S3-compatible object storage with **$0 egress bandwidth fees**. Photos and videos stream with zero bandwidth bills.
- **AWS S3 Glacier Deep Archive:** Multi-region cold storage backup ($0.00099/GB/month) for permanent 50-year survival.
- Configure `.env` with your R2 keys when you're ready to sync across multiple physical devices.
