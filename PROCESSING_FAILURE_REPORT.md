# Report: Processing Completes (Credit Used) but User Returns to Costume Selection

**Update:** CORS was confirmed (browser console: `Access to fetch at 'https://platform.fitroom.app/api/health' from origin 'http://localhost:3000' has been blocked by CORS policy`). Fixes implemented: (1) Removed FitRoom `/health` call from browser. (2) Use result **blob** for Supabase upload (no second fetch to FitRoom URL). (3) Backend proxy `POST /api/proxy-download` to download result server-side when direct download is blocked. (4) `downloadResultImageWithFallback` tries direct then proxy.

## Summary

When you submit a costume for processing, the **FitRoom API runs successfully and uses a credit**, but the app can **throw an error after the API finishes** and send you back to the **Costume Selection** page with an error toast instead of showing the result. This is **not** caused by blob handling of the *input* image. It is caused by **post-API steps** (downloading/uploading the *result* image) failing after the credit has already been deducted.

---

## Flow (What Happens Step by Step)

1. **CostumeSelectionPage** – User selects a costume → `handleCostumeSelect` runs.
2. **Input image** – Your captured photo is converted to a blob (data URL, `/Images_input/` path, etc.), frame is added, then sent to the API. No problem here for the “credit used but back to costume” case.
3. **FitRoom API** – `performTryOn` in `fitroomApi.js`:
   - Creates task → **credit is used here**.
   - Polls until status is `COMPLETED`.
   - Then:
     - Downloads the result image from `result.download_signed_url` (gets a **blob**).
     - In parallel:
       - **Upload to Supabase**: `uploadResultImageFromUrl(result.download_signed_url, fileName)` — **fetches the same URL again from the browser** and uploads to Supabase.
       - **Save to local server**: `saveResultToLocal(resultBlob, fileName)` — uses the blob already downloaded.
     - Saves metadata to DB, then returns `resultId`, `resultImageUrl`, `taskId`.
4. **CostumeSelectionPage** – On success, navigates to `/result/${routeId}` with state (e.g. `resultImageUrl`). If `performTryOn` **throws** at any point, the catch block runs: `setIsLoading(false)`, toast error, and **you stay on Costume Selection** — even though the API already completed and used a credit.

So: **“Credit used” = API finished. “Back to costume selection” = something after the API (download/upload/DB) threw.**

---

## Root Cause: Post-API Steps Can Throw

After the task is **COMPLETED** and the credit is used, any of these can throw and trigger the catch in `CostumeSelectionPage`:

### 1. **Downloading the result image** (fitroomApi.js)

```javascript
const resultBlob = await downloadResultImage(result.download_signed_url);
```

- Uses `axios.get(downloadUrl, { responseType: 'blob' })` to FitRoom’s domain.
- Can fail due to **network**, **CORS**, or **invalid/expired URL**, and will throw.

### 2. **Uploading the result to Supabase** (main suspect)

```javascript
const [supabaseImageUrl, localSaveResult] = await Promise.all([
  uploadResultImageFromUrl(result.download_signed_url, fileName),  // ← problem
  saveResultToLocal(resultBlob, fileName),
]);
```

- `uploadResultImageFromUrl` (in `config/supabase.js`) calls `uploadResultFromUrl(imageUrl, 'result')`.
- **`uploadResultFromUrl`** (in `supabaseImageService.js`) does a **second** request to the same FitRoom URL:

  ```javascript
  const response = await fetch(imageUrl);  // FitRoom signed URL, from the browser
  const imageBlob = await response.blob();
  // then uploads imageBlob to Supabase
  ```

- So we **already have** `resultBlob` from `downloadResultImage`, but we **ignore it** and fetch the URL again. That second **browser `fetch()`** to FitRoom’s domain can fail because of:
  - **CORS** (FitRoom may not allow your front-end origin).
  - **Network/timeouts**.
- If `uploadResultFromUrl` returns `success: false`, `uploadResultImageFromUrl` **throws** after retries. That throws in `performTryOn` → catch in CostumeSelectionPage → you stay on Costume Selection; **credit was already used**.

So the “blob something” is not about the *input* image; it’s that we **re-fetch the result by URL** instead of reusing the **blob we already downloaded**, and that re-fetch can fail and cause the “back to costume selection” behavior.

### 3. **Database save**

- `saveFitRoomResult` is in a try/catch in `performTryOn` and does **not** rethrow; we continue even if DB save fails. So DB is **not** the cause of going back to costume selection.

### 4. **Local save**

- `saveResultToLocal` does not throw; it returns `{ success: false }` on failure. So local save is also **not** the cause.

---

## Blob Handling (Input vs Result)

- **Input (captured image)**  
  - In **CameraPage**, after upload we set `capturedImage` to a **string URL** (`getImageUrl(data.path)` or `data.path`), not a blob URL. We do **not** persist `blob:` URLs to sessionStorage.  
  - In **CostumeSelectionPage**, we support: data URL, Blob, File, or string starting with `/Images_input/`. We do **not** support a string that is a **full `http(s)://` URL** (e.g. `https://yourserver.com/Images_input/xxx.jpg`). If your backend returns a full URL and that’s what’s in `location.state.capturedImage`, we throw “Invalid captured image format” **before** calling the API (so no credit used in that case).

- **Result (API output)**  
  - We download the result once as a blob, then:
    - Use that blob for local save.
    - For Supabase we **don’t** use that blob; we call `uploadResultImageFromUrl(download_signed_url)`, which **fetches the URL again** in the browser. That second fetch is where CORS/network can fail and cause “credit used but back to costume selection.”

So the failure is tied to **how we handle the API result** (re-fetch by URL instead of reusing the blob), not to how we handle the image the user gave us.

---

## Why You End Up on Costume Selection

- **Only one place** in this flow sends you “back” to Costume Selection: the **catch** in `handleCostumeSelect` in **CostumeSelectionPage.js** (lines 155–186).
- That catch runs when **`performTryOn` throws**.
- So the sequence is: API completes (credit used) → something in `performTryOn` after that throws (most likely download or Supabase upload) → catch runs → loading stops, toast shows, **you remain on Costume Selection**.

There is **no** redirect from Result page to Costume Selection; Result only has Home and “Try Another” (camera). So “came back to costume selection” means we never left it because of that thrown error.

---

## Recommendations (Before Implementing)

1. **Use the blob we already have for Supabase**  
   - After `downloadResultImage(result.download_signed_url)` we have `resultBlob`.  
   - Add (or use) an upload path that takes a **Blob/File** and uploads it to the same “result” path in Supabase (e.g. `uploadResultFromBlob(resultBlob, fileName)` or extend the existing upload to accept blob when available).  
   - Call that from `performTryOn` instead of `uploadResultImageFromUrl(result.download_signed_url, fileName)`.  
   - This removes the **second** browser fetch to FitRoom and avoids CORS/network failures there, so we don’t throw after the credit is used.

2. **If Supabase upload still fails, still show the result**  
   - Today we use `resultImageUrl = supabaseImageUrl` for the result page.  
   - If Supabase upload fails, we could still:
     - Use the FitRoom **signed URL** (e.g. `result.download_signed_url`) for display (short-lived but better than nothing), or  
     - Create a short-lived blob URL from `resultBlob` and pass that in navigation state so the user at least sees the image even when Supabase fails.  
   - That way, even when storage fails, we don’t send the user back to Costume Selection after a used credit.

3. **Support full URL for `capturedImage`**  
   - In **CostumeSelectionPage**, add a branch for `typeof capturedImage === 'string' && (capturedImage.startsWith('http://') || capturedImage.startsWith('https://'))`: fetch that URL and get a blob, same as for `/Images_input/`.  
   - This avoids “Invalid captured image format” when the backend passes a full URL and prevents unnecessary failures before the API is called.

4. **Logging**  
   - In the catch of `handleCostumeSelect`, log `error.message` and, if available, `error.response` (and in `performTryOn` log which step failed: download vs Supabase vs local).  
   - That will confirm in your environment whether it’s the Supabase re-fetch (or download) that is failing.

---

## Conclusion

- **Why did the last one fail?**  
  The FitRoom run completed and used a credit, but a **post-API step** (most likely **downloading the result** or **uploading it to Supabase by re-fetching the URL in the browser**) threw an error. The catch in CostumeSelectionPage then ran, so you stayed on Costume Selection with an error toast.

- **Is it because of “blob something” or API image handling?**  
  Not the *input* image: that path is fine. It **is** related to how we handle the **API result**: we already get a blob from the result URL but then **fetch the same URL again** for Supabase. That second fetch (in the browser) can fail (e.g. CORS) and is a likely cause of “credit used but back to costume selection.”

Implementing the recommendations above (especially uploading the existing result blob to Supabase and still showing the result when Supabase fails) should prevent this behavior and avoid losing the result after a used credit.
