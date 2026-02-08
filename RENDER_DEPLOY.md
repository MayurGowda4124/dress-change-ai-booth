# Deploy to Render – step by step

Get your AI Dress Booth live at a URL like `https://ai-dress-booth.onrender.com` (frontend + backend on one URL).

---

## 1. Push your code to GitHub

If you haven’t already:

```bash
git add .
git commit -m "Prepare for Render deploy"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Use your real GitHub username and repo name.

**If `origin` already exists but points to the wrong URL** (e.g. you see "Repository not found" when pushing):

```bash
# Point origin to the correct repo (replace with your real URL)
git remote set-url origin https://github.com/MayurGowda4124/dress-change-ai-booth.git
git push -u origin main
```

If the repo already exists and the remote is correct, just push:

```bash
git push origin main
```

---

## 2. Create a Render account

- Go to **[render.com](https://render.com)** and sign up (free).
- Log in.

---

## 3. Create a new Web Service

1. In the dashboard click **New +** → **Web Service**.
2. **Connect your GitHub** (authorize Render if asked).
3. Choose the repository that contains this project.
4. Click **Connect**.

---

## 4. Configure the service

Use these exact values:

| Field | Value |
|--------|--------|
| **Name** | `ai-dress-booth` (or any name you like) |
| **Region** | Choose closest to you |
| **Runtime** | **Node** |
| **Build Command** | **Must be** `npm install && npm run build` (so dependencies install before build) |
| **Start Command** | `npm run start` or `node server.js` |
| **Instance Type** | **Free** (or paid if you prefer) |

Leave **Root Directory** blank unless the app is in a subfolder of the repo.

---

## 5. Add environment variables

Before the first deploy, add these so the React build and app work correctly.

1. In the same page, open the **Environment** section.
2. Click **Add Environment Variable** and add each of these (use your real values):

| Key | Value | Required |
|-----|--------|----------|
| `NODE_ENV` | `production` | Yes |
| `NODE_OPTIONS` | `--no-deprecation` | Recommended (avoids Node/OpenSSL warnings during build) |
| `REACT_APP_FITROOM_API_KEY` | Your FitRoom API key | Yes |
| `REACT_APP_SUPABASE_URL` | `https://xxxx.supabase.co` | Yes |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `REACT_APP_SUPABASE_BUCKET` | `ai_face_swap` (or your bucket name) | Optional (defaults to ai_face_swap) |

**Do not add `REACT_APP_API_URL`** — the app will use the same Render URL for API calls.

Use **Secret** for any value you don’t want visible in the UI.

---

## 6. Deploy

1. Click **Create Web Service**.
2. Render will clone the repo, run `npm install && npm run build`, then start `node server.js`.
3. Wait for the build and deploy to finish (first time can take a few minutes).
4. When it’s live, Render shows a URL like:
   - **https://ai-dress-booth.onrender.com**

Open that URL in your browser. You should see the app; the same URL serves both the UI and the API.

---

## 7. After deploy

- **Print page:** `https://your-service-name.onrender.com/print`
- **Logs:** In the Render dashboard, open your service → **Logs**.
- **Env changes:** If you add or change env vars later, use **Environment** and then **Manual Deploy** → **Deploy latest commit** so the build runs again with the new variables.

---

## Troubleshooting

### Build failed? Paste your Render build log

In Render: your service → **Logs** (or the failed deploy) → copy the **full build output** and share the error lines. Meanwhile try:

| Error / symptom | What to do |
|-----------------|------------|
| **cross-env: not found** | Use latest package.json (build script is `react-scripts build`). Push and redeploy. |
| **npm ERR! or missing module** | Set **Build Command** to: `npm install && npm run build` |
| **JavaScript heap out of memory** | Add env **NODE_OPTIONS** = **--max-old-space-size=460**. Then Manual Deploy → Clear build cache and deploy. |
| **ESLint** fails the build | Add env **CI** = **false** |
| **REACT_APP_...** missing | Add all required env vars; they are used at build time. |

| Issue | What to do |
|--------|-------------|
| Build fails on “REACT_APP_…” | Add all required env vars in **Environment** and redeploy. They must exist at **build** time. |
| Blank page or API errors | Check **Logs** in Render. Ensure FitRoom and Supabase keys are correct and the Supabase bucket exists. |
| Free instance sleeps | On the free tier, the app may sleep after inactivity; the first request can take 30–60 seconds to wake it. |
| Uploads / files disappear | The filesystem is ephemeral. Results are stored in Supabase; ensure the bucket and env vars are set so the app can write there. |

---

## Quick checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] New Web Service connected to repo
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `node server.js`
- [ ] Env vars set: `NODE_ENV`, `REACT_APP_FITROOM_API_KEY`, `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`
- [ ] Deploy finished and URL opens the app
