# Deployment Guide

## Deploy full stack to one web URL (recommended)

This app is built so **one Node server** serves both the React frontend and the API. You get a **single URL** (e.g. `https://your-app.onrender.com`) for the whole app — no separate frontend/backend URLs.

### How it works

- The server runs `server.js` (Express).
- It serves the built React app from `build/` and API routes from `/api/*`.
- **Do not set `REACT_APP_API_URL`** when deploying to one domain (or set it to the same URL). The frontend will use relative paths and talk to the same origin.

### Option A: Render (free tier, simple)

1. Push your code to **GitHub**.
2. Go to [render.com](https://render.com) → **New** → **Web Service**.
3. Connect your repo and select it.
4. Use:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node server.js`
   - **Node version:** 18 or higher (set in Environment if needed).
5. In **Environment**, add (with your real values):
   - `REACT_APP_FITROOM_API_KEY`
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - `NODE_ENV` = `production`
   - Leave **REACT_APP_API_URL** unset so the app uses the same URL.
6. Deploy. Your app will be at `https://<your-service>.onrender.com`.

**Optional:** If the repo has a `render.yaml` in the root, you can use **Blueprint** to create the service from that file; then add the env vars in the Render dashboard.

### Option B: Railway

1. Push your code to **GitHub**.
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** and select the repo.
3. Railway will detect Node. Set:
   - **Build Command:** `npm run build` (or `npm install && npm run build`).
   - **Start Command:** `node server.js`.
4. In **Variables**, add the same env vars as in Option A (FitRoom, Supabase, `NODE_ENV`). Leave `REACT_APP_API_URL` unset.
5. Deploy. Railway will give you a URL like `https://<your-app>.railway.app`.

### Option C: Heroku

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and run `heroku login`.
2. In the project root:
   ```bash
   heroku create your-app-name
   heroku config:set REACT_APP_FITROOM_API_KEY=your-key
   heroku config:set REACT_APP_SUPABASE_URL=your-url
   heroku config:set REACT_APP_SUPABASE_ANON_KEY=your-key
   heroku config:set NODE_ENV=production
   ```
   Do **not** set `REACT_APP_API_URL` (same-origin).
3. Deploy:
   ```bash
   git push heroku main
   ```
   The `Procfile` runs `node server.js`. The `heroku-postbuild` script in `package.json` runs `npm run build` so the React app is built on deploy.
4. App URL: `https://your-app-name.herokuapp.com`.

### Important for all platforms

- **Uploaded images** (e.g. in `public/Images_input` and `public/result_s`) are stored on the server’s filesystem. On Render/Railway/Heroku they are **ephemeral** — they can be lost on restart or redeploy. For persistent storage, the app already uses **Supabase Storage** for results; ensure your bucket and env vars are set.
- **FitRoom** and **Supabase** keys must be set in the platform’s environment (not in the repo). Set them **before** the first build so `REACT_APP_*` values are baked into the frontend.

---

## 🚀 Production Deployment Checklist

### **1. Environment Variables Setup**

Create a `.env` file in the root directory:

```env
# FitRoom API Configuration
REACT_APP_FITROOM_API_KEY=your-fitroom-api-key

# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key

# Backend API URL (optional for single-URL deploy; leave unset so frontend uses same origin)
# Only set if frontend is served from a different domain than the API:
# REACT_APP_API_URL=https://your-api-domain.com
NODE_ENV=production
```

### **2. Required Images**

Ensure these images exist in the `public/images/` directory:

```
public/images/
├── Ui_Ux_img/
│   └── Photo Frame_Portrait._bg5.png
├── Male/
│   ├── m1.jpg
│   ├── m2.jpg
│   ├── m3.jpg
│   └── m4.jpg
└── Female/
    ├── f1.jpg
    ├── f2.jpg
    ├── f3.jpg
    ├── f4.jpg
    ├── f5.jpg
    └── f6.png
```

### **3. Supabase Setup**

1. **Create Storage Bucket:**
   - Go to your Supabase dashboard
   - Navigate to Storage
   - Create a bucket named `tryon-images-2`
   - Set it to public

2. **Create Database Table:**
   ```sql
   CREATE TABLE tryon_results (
     id SERIAL PRIMARY KEY,
     task_id TEXT,
     original_image_url TEXT,
     result_image_url TEXT,
     outfit_name TEXT,
     model_name TEXT,
     cloth_type TEXT,
     fitroom_url TEXT,
     status TEXT DEFAULT 'PENDING',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

### **4. Deployment Platforms**

#### **Heroku Deployment**

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Login to Heroku:**
   ```bash
   heroku login
   ```

3. **Create Heroku App:**
   ```bash
   heroku create your-app-name
   ```

4. **Set Environment Variables:** (use your own values, never commit real keys)
   ```bash
   heroku config:set REACT_APP_FITROOM_API_KEY=your-fitroom-key
   heroku config:set REACT_APP_SUPABASE_URL=your-supabase-url
   heroku config:set REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   heroku config:set REACT_APP_API_URL=https://your-app-name.herokuapp.com
   heroku config:set NODE_ENV=production
   ```

5. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

#### **Vercel Deployment**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard**

#### **Railway Deployment**

1. **Connect GitHub repository**
2. **Set environment variables in Railway dashboard**
3. **Deploy automatically**

### **5. Pre-deployment Testing**

1. **Build Test:**
   ```bash
   npm run build
   ```

2. **Environment Variables Test:**
   ```bash
   node -e "console.log('API Key:', process.env.REACT_APP_FITROOM_API_KEY ? 'Set' : 'Missing')"
   ```

3. **Image Validation:**
   ```bash
   npm run validate-images
   ```

### **6. Post-deployment Verification**

1. **Check API Endpoints:**
   - `/api/upload` - Image upload
   - `/api/save-result` - Result saving
   - `/api/results` - Results listing

2. **Test Core Functionality:**
   - Image upload/capture
   - Outfit selection
   - Try-on process
   - Result display
   - QR code generation

3. **Monitor Logs:**
   ```bash
   heroku logs --tail
   ```

### **7. Common Issues & Solutions**

#### **Issue: "Module not found" errors**
**Solution:** Ensure all dependencies are in `package.json`

#### **Issue: Environment variables not loading**
**Solution:** Restart the application after setting environment variables

#### **Issue: CORS errors**
**Solution:** Check CORS configuration in `server.js`

#### **Issue: Supabase connection failed**
**Solution:** Verify Supabase URL and API key

#### **Issue: FitRoom API errors**
**Solution:** Check API key and rate limits

### **8. Performance Optimization**

1. **Image Optimization:**
   - Compress images before upload
   - Use WebP format where possible
   - Implement lazy loading

2. **Caching:**
   - Enable browser caching
   - Use CDN for static assets

3. **Database Optimization:**
   - Add indexes to frequently queried columns
   - Implement pagination for large datasets

### **9. Security Considerations**

1. **API Key Security:**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **File Upload Security:**
   - Validate file types
   - Limit file sizes
   - Scan for malware

3. **CORS Configuration:**
   - Restrict origins in production
   - Use HTTPS only

### **10. Monitoring & Maintenance**

1. **Error Tracking:**
   - Implement error logging
   - Set up alerts for critical errors

2. **Performance Monitoring:**
   - Monitor API response times
   - Track user interactions

3. **Regular Updates:**
   - Update dependencies regularly
   - Monitor security advisories

## 🎯 Quick Deployment Commands

```bash
# Local testing
npm install
npm run build
npm start

# Heroku deployment
heroku create your-app-name
heroku config:set REACT_APP_FITROOM_API_KEY=your-key
git push heroku main

# Vercel deployment
vercel --prod
```

### **Packaging as Windows .exe (Desktop app for users)**

To distribute the app as a single .exe so users can run it without installing Node.js:

1. **Build the frontend:**  
   `npm run build`

2. **Option A – Electron (recommended for a desktop app)**  
   - Install Electron and a packager (e.g. `electron-builder` or `electron-packager`).  
   - Use the built React app (from `build/`) as the renderer; start the backend (e.g. `server.js`) from the main process or bundle it.  
   - Package so the .exe opens a window to `http://localhost:PORT` (or bundle the server and point the window to it).  
   - Result: one installer/.exe that runs both server and UI.

3. **Option B – Standalone Node + browser**  
   - Bundle Node.js with your project (e.g. `pkg` or `nexe` to compile `server.js` into an .exe).  
   - Ship the `build/` folder next to the .exe.  
   - The .exe starts the server; provide a shortcut or script that opens `http://localhost:5000` in the default browser.  
   - Users get a .exe + folder; no Node install needed.

4. **Environment for .exe builds**  
   - For a local-only desktop app, set `REACT_APP_API_URL=` (empty) or `http://localhost:5000` so the UI talks to the bundled server.  
   - Keep FitRoom and Supabase keys in a config file or env that the packed app reads at runtime (never hardcode in source).

## 📞 Support

If you encounter issues during deployment:

1. Check the logs: `heroku logs --tail`
2. Verify environment variables: `heroku config`
3. Test locally with production build: `npm run build:prod`
4. Contact support with specific error messages 