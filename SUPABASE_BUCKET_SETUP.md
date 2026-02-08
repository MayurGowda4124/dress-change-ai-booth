# Supabase Bucket Configuration

## Summary
The application has been configured to use the correct Supabase storage bucket name: **`ai_face_swap`**

## Changes Made

### 1. Updated Configuration Files
- **`src/config/supabase.js`**: Added `SUPABASE_BUCKET_NAME` constant that defaults to `ai_face_swap`
- **`src/services/supabaseImageService.js`**: Updated all storage operations to use the `SUPABASE_BUCKET_NAME` constant
- **`env.example`**: Added `REACT_APP_SUPABASE_BUCKET` environment variable

### 2. Environment Variable Setup
To override the default bucket name, create a `.env` file in the project root with:

```env
# FitRoom API Configuration
REACT_APP_FITROOM_API_KEY=your-api-key

# Supabase Configuration
REACT_APP_SUPABASE_URL=https://hynobkunuwoeyvipxpia.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Supabase Storage Bucket Name
REACT_APP_SUPABASE_BUCKET=ai_face_swap
```

### 3. Bucket Name Usage
All Supabase storage operations now use the bucket name `ai_face_swap`:
- Image uploads
- Image downloads
- Image listing
- Image deletion
- Public URL generation

## Verifying the Configuration

### Check if the bucket is accessible:
1. The application logs will show: `Listing images from bucket: ai_face_swap`
2. Upload operations will log: `Uploading to Supabase storage bucket: ai_face_swap as [filename]...`

### Testing Bucket Access:
You can use the ImageExtractor component's "Check All Buckets" button to verify:
- Navigate to the admin/debug page
- Click "Check All Buckets"
- Verify that `ai_face_swap` shows a success status

## Troubleshooting

### "Bucket not found" (StorageApiError)
**Cause:** The storage bucket `ai_face_swap` does not exist in your Supabase project, or your `.env` points to the wrong project.

**Fix:**
1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Storage**.
2. If there is no bucket named `ai_face_swap`, click **New bucket**, name it exactly `ai_face_swap`, and enable **Public bucket** if you need public image URLs.
3. In your project root `.env`, set:
   - `REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co`
   - `REACT_APP_SUPABASE_ANON_KEY=your-anon-key`
   - `REACT_APP_SUPABASE_BUCKET=ai_face_swap`
4. Restart the dev server after changing `.env`.

### "Unexpected token '<', \"<html>...\" is not valid JSON"
**Cause:** The app received an HTML page instead of JSON. This usually means:
- **Wrong Supabase URL** (typo or wrong project), or
- **502 Bad Gateway** – Supabase or the network returned an error page.

**Fix:**
1. Confirm `REACT_APP_SUPABASE_URL` in `.env` is exactly your project URL (e.g. `https://xxxxxxxx.supabase.co`), with no trailing slash.
2. Confirm `REACT_APP_SUPABASE_ANON_KEY` is the anon (public) key from Project Settings → API.
3. Restart the dev server and try again. If it persists, check [Supabase Status](https://status.supabase.com).

### "Failed to load resource: net::ERR_CONNECTION_RESET" on port 5000
**Cause:** The local backend (e.g. `npm run backend` or `node server.js`) is not running, or the connection was reset.

**Fix:** Start your local API server on port 5000 if the app is supposed to save results there. If you only use Supabase, this warning can be ignored once the bucket is fixed.

### "Bucket not found" (general)
If you see this error, verify:
1. The bucket `ai_face_swap` exists in your Supabase project
2. The bucket has public access enabled (if needed)
3. Your Supabase credentials in `.env` are correct

### Creating the Bucket
If the bucket doesn't exist:
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to Storage
3. Click "Create Bucket"
4. Name it: `ai_face_swap`
5. Set appropriate permissions:
   - Public bucket: Enable if you want public URLs
   - Private bucket: Requires authentication for access

### Bucket Permissions
For the app to work properly, ensure:
1. **Upload**: Service role or authenticated users can upload
2. **Read**: Public or authenticated access depending on your use case
3. **Delete**: Restricted to authorized users only

## Additional Notes

- The default bucket name is hardcoded as `ai_face_swap` in the configuration
- You can override this by setting `REACT_APP_SUPABASE_BUCKET` environment variable
- After changing environment variables, restart the development server: `npm run dev`
- The React app needs to be rebuilt if you change environment variables in production

## Development Server

To start the development server with the new configuration:
```bash
npm run dev
```

The server will run on: http://localhost:5000


