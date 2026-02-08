import { supabase, SUPABASE_BUCKET_NAME } from '../config/supabase';
import logger from '../utils/logger';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get today's folder name in format: Event_day_dd_mm_yy (capital E to match Supabase storage/URL)
 * @returns {string} Folder name for today
 */
const getTodayFolderName = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yy = String(today.getFullYear()).slice(-2);

  return `Event_day_${dd}_${mm}_${yy}`;
};

/**
 * Get the next sequential number for a prefix in a folder (e.g. img_001, result_001)
 * @param {string} folderName - The folder to check
 * @param {string} prefix - File prefix: 'img' or 'result'
 * @returns {Promise<string>} Next number as 3-digit string
 */
const getNextNumberForPrefix = async (folderName, prefix) => {
  try {
    const { data: files, error } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .list(folderName, {
        limit: 10000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      logger.log(`[Supabase] Folder list error: ${error.message}`);
      return '001';
    }

    if (!files || files.length === 0) return '001';

    const regex = new RegExp(`^${prefix}_(\\d+)\\.`, 'i');
    let maxNumber = 0;
    files.forEach(file => {
      if (!file.name) return;
      const match = file.name.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });

    const padded = String(maxNumber + 1).padStart(3, '0');
    logger.log(`[Supabase] Next ${prefix}_ number in ${folderName}: ${padded}`);
    return padded;
  } catch (err) {
    logger.error('[Supabase] Error getting next number:', err);
    return String(Date.now()).slice(-6);
  }
};

/** Next image number for a folder (img_001, img_002, ...) */
const getNextImageNumber = (folderName) => getNextNumberForPrefix(folderName, 'img');

// ============================================
// MAIN UPLOAD FUNCTIONS
// ============================================

/**
 * Upload an image to Supabase with daily folder organization
 * - Folder: Event_day_dd_mm_yy (created automatically on first upload)
 * - Filename: img_001.jpg, img_002.jpg, etc.
 *
 * @param {File|Blob} file - The image file to upload
 * @param {string} extension - File extension (default: 'jpg')
 * @returns {Promise<{success: boolean, publicUrl?: string, path?: string, folder?: string, fileName?: string, error?: string}>}
 */
export const uploadImageWithDailyFolder = async (file, extension = 'jpg') => {
  try {
    logger.log('[Supabase] Starting organized upload...');

    if (!file) {
      throw new Error('No file provided');
    }

    // Get today's folder name
    const folderName = getTodayFolderName();
    logger.log(`[Supabase] Target folder: ${folderName}`);

    // Get next sequential number
    const imageNumber = await getNextImageNumber(folderName);

    // Create full path
    const fileName = `img_${imageNumber}.${extension}`;
    const fullPath = `${folderName}/${fileName}`;

    logger.log(`[Supabase] Uploading to: ${fullPath}`);

    // Upload the file
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .upload(fullPath, file, {
        contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      // Handle duplicate file (race condition)
      if (error.message?.includes('already exists') || error.message?.includes('Duplicate')) {
        logger.log('[Supabase] File exists, retrying with timestamp...');

        const timestamp = Date.now();
        const retryFileName = `img_${imageNumber}_${timestamp}.${extension}`;
        const retryPath = `${folderName}/${retryFileName}`;

        const { error: retryError } = await supabase.storage
          .from(SUPABASE_BUCKET_NAME)
          .upload(retryPath, file, {
            contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
            cacheControl: '3600',
            upsert: false
          });

        if (retryError) {
          throw retryError;
        }

        const { data: urlData } = supabase.storage
          .from(SUPABASE_BUCKET_NAME)
          .getPublicUrl(retryPath);

        logger.log(`[Supabase] Retry upload successful: ${retryPath}`);

        return {
          success: true,
          publicUrl: urlData?.publicUrl,
          path: retryPath,
          folder: folderName,
          fileName: retryFileName
        };
      }

      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .getPublicUrl(fullPath);

    logger.log(`[Supabase] Upload successful: ${fullPath}`);
    logger.log(`[Supabase] Public URL: ${urlData?.publicUrl}`);

    return {
      success: true,
      publicUrl: urlData?.publicUrl,
      path: fullPath,
      folder: folderName,
      fileName: fileName
    };

  } catch (err) {
    logger.error('[Supabase] Upload error:', err);
    return {
      success: false,
      error: err.message || 'Upload failed'
    };
  }
};

/**
 * Upload result image from a URL (e.g., FitRoom output) to Supabase
 * Uses same daily folder structure
 *
 * @param {string} imageUrl - URL of the image to download and upload
 * @param {string} prefix - Prefix for filename (default: 'result')
 * @returns {Promise<{success: boolean, publicUrl?: string, path?: string, error?: string}>}
 */
export const uploadResultFromUrl = async (imageUrl, prefix = 'result') => {
  try {
    logger.log(`[Supabase] Downloading image from URL: ${imageUrl}`);

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const imageBlob = await response.blob();
    logger.log(`[Supabase] Downloaded image, size: ${imageBlob.size} bytes`);

    // Get folder and next number for this prefix (result_001, result_002, ...)
    const folderName = getTodayFolderName();
    const nextNumber = await getNextNumberForPrefix(folderName, prefix);
    const fileName = `${prefix}_${nextNumber}.jpg`;
    const fullPath = `${folderName}/${fileName}`;

    logger.log(`[Supabase] Uploading result to: ${fullPath}`);

    // Upload
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .upload(fullPath, imageBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .getPublicUrl(fullPath);

    logger.log(`[Supabase] Result upload successful: ${fullPath}`);

    return {
      success: true,
      publicUrl: urlData?.publicUrl,
      path: fullPath,
      folder: folderName,
      fileName: fileName
    };

  } catch (err) {
    logger.error('[Supabase] Result upload error:', err);
    return {
      success: false,
      error: err.message || 'Upload failed'
    };
  }
};

/**
 * Upload result image from an existing Blob to Supabase (same daily folder structure).
 * Use this when we already have the result blob (e.g. from proxy or successful direct download)
 * to avoid a second browser fetch to FitRoom URL which can be blocked by CORS.
 *
 * @param {Blob} imageBlob - Image as Blob (e.g. from downloadResultImage or proxy)
 * @param {string} prefix - Prefix for filename (default: 'result')
 * @returns {Promise<{success: boolean, publicUrl?: string, path?: string, error?: string}>}
 */
export const uploadResultFromBlob = async (imageBlob, prefix = 'result') => {
  try {
    if (!imageBlob || !(imageBlob instanceof Blob)) {
      return { success: false, error: 'Invalid image blob' };
    }
    logger.log(`[Supabase] Uploading result from blob, size: ${imageBlob.size} bytes`);

    const folderName = getTodayFolderName();
    const nextNumber = await getNextNumberForPrefix(folderName, prefix);
    const fileName = `${prefix}_${nextNumber}.jpg`;
    const fullPath = `${folderName}/${fileName}`;

    logger.log(`[Supabase] Uploading result to: ${fullPath}`);

    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .upload(fullPath, imageBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .getPublicUrl(fullPath);

    logger.log(`[Supabase] Result upload from blob successful: ${fullPath}`);

    return {
      success: true,
      publicUrl: urlData?.publicUrl,
      path: fullPath,
      folder: folderName,
      fileName: fileName
    };
  } catch (err) {
    logger.error('[Supabase] Result upload from blob error:', err);
    return {
      success: false,
      error: err.message || 'Upload failed'
    };
  }
};

// ============================================
// EXISTING FUNCTIONS (Updated)
// ============================================

/**
 * Get public URL for an image from Supabase storage bucket
 * @param {string} filePath - The path to the file in the bucket
 * @returns {string} Public URL of the image
 */
export async function getPublicImageUrl(filePath) {
  try {
    const { data } = supabase
      .storage
      .from(SUPABASE_BUCKET_NAME)
      .getPublicUrl(filePath);

    logger.log('Public Image URL:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    logger.error('Error getting public image URL:', error);
    throw error;
  }
}

/**
 * Download an image from Supabase storage bucket
 * @param {string} filePath - The path to the file in the bucket
 * @returns {Blob} The image as a blob
 */
export async function downloadImage(filePath) {
  try {
    const { data, error } = await supabase
      .storage
      .from(SUPABASE_BUCKET_NAME)
      .download(filePath);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error downloading image:', error);
    throw error;
  }
}

/**
 * List all files in a specific folder or root
 * @param {string} folderPath - Folder path (empty string for root)
 * @returns {Array} Array of file objects
 */
export async function listImages(folderPath = '') {
  try {
    logger.log(`[Supabase] Listing images from: ${folderPath || 'root'}`);

    const { data, error } = await supabase
      .storage
      .from(SUPABASE_BUCKET_NAME)
      .list(folderPath, { limit: 1000 });

    if (error) {
      logger.error('Error listing images:', error);
      throw error;
    }

    logger.log(`[Supabase] Found ${data?.length || 0} items`);
    return data;
  } catch (error) {
    logger.error('Error listing images:', error);
    throw error;
  }
}

/**
 * List all daily folders
 * @returns {Array} Array of folder objects
 */
export async function listDailyFolders() {
  try {
    logger.log('[Supabase] Listing daily folders...');

    const { data, error } = await supabase
      .storage
      .from(SUPABASE_BUCKET_NAME)
      .list('', { limit: 1000 });

    if (error) {
      throw error;
    }

    // Filter event_day_ folders (case-insensitive: Event_day_ or event_day_ as returned by Supabase)
    const folders = data?.filter(item =>
      item.name?.toLowerCase().startsWith('event_day_') && item.id === null
    ) || [];

    logger.log(`[Supabase] Found ${folders.length} daily folders`);
    return folders;
  } catch (error) {
    logger.error('Error listing folders:', error);
    throw error;
  }
}

/**
 * Get count of images in a folder
 * @param {string} folderName - Folder name
 * @returns {number} Count of images
 */
export async function getImageCount(folderName) {
  try {
    const { data, error } = await supabase
      .storage
      .from(SUPABASE_BUCKET_NAME)
      .list(folderName, { limit: 10000 });

    if (error) {
      return 0;
    }

    const imageFiles = data?.filter(file =>
      /\.(jpg|jpeg|png|webp)$/i.test(file.name)
    ) || [];

    return imageFiles.length;
  } catch (error) {
    logger.error('Error getting image count:', error);
    return 0;
  }
}

/**
 * Delete an image from Supabase storage bucket
 * @param {string} filePath - The path to the file to delete
 * @returns {Object} Delete result
 */
export async function deleteImage(filePath) {
  try {
    const { data, error } = await supabase
      .storage
      .from(SUPABASE_BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    logger.log(`[Supabase] Deleted: ${filePath}`);
    return data;
  } catch (error) {
    logger.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Test Supabase connection and bucket access
 * @returns {Object} Test result with today's folder info
 */
export async function testConnection() {
  try {
    logger.log('[Supabase] Testing connection...');

    const todayFolder = getTodayFolderName();

    // Test bucket access
    const { error } = await supabase
      .storage
      .from(SUPABASE_BUCKET_NAME)
      .list('', { limit: 1 });

    if (error) {
      logger.error('Bucket access error:', error);
      return { success: false, error: error.message };
    }

    // Check today's folder
    const imageCount = await getImageCount(todayFolder);

    logger.log('[Supabase] Connection successful');
    return {
      success: true,
      bucket: SUPABASE_BUCKET_NAME,
      todayFolder: todayFolder,
      todayImageCount: imageCount
    };
  } catch (error) {
    logger.error('Connection test error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check all available buckets (used by ImageExtractor)
 * @returns {Object} Buckets info
 */
export async function checkAllBuckets() {
  try {
    logger.log('Checking all available buckets...');

    const bucketNames = ['ai_face_swap', 'tryon-images', 'tryon-images-2', 'images', 'storage'];
    const results = {};

    for (const bucketName of bucketNames) {
      try {
        logger.log(`Checking bucket: ${bucketName}`);
        const { data, error } = await supabase
          .storage
          .from(bucketName)
          .list('', { limit: 5 });

        if (error) {
          logger.log(`Bucket ${bucketName}: Error - ${error.message}`);
          results[bucketName] = { error: error.message };
        } else {
          logger.log(`Bucket ${bucketName}: Found ${data ? data.length : 0} items`);
          results[bucketName] = {
            success: true,
            count: data ? data.length : 0,
            items: data ? data.slice(0, 3) : []
          };
        }
      } catch (err) {
        logger.log(`Bucket ${bucketName}: Exception - ${err.message}`);
        results[bucketName] = { error: err.message };
      }
    }

    return results;
  } catch (error) {
    logger.error('Error checking buckets:', error);
    return { error: error.message };
  }
}

// ============================================
// LEGACY SUPPORT - Original uploadImage function
// Now uses daily folder structure
// ============================================

/**
 * Upload an image to Supabase storage bucket (Legacy support)
 * Now automatically uses daily folder structure
 * @param {File} file - The file to upload
 * @param {string} filePath - Original file path (ignored, uses auto-naming)
 * @returns {Object} Upload result with path and publicUrl
 */
export async function uploadImage(file, filePath = '') {
  try {
    // Use new organized upload
    const result = await uploadImageWithDailyFolder(file, 'jpg');

    if (!result.success) {
      throw new Error(result.error);
    }

    return {
      path: result.path,
      publicUrl: result.publicUrl,
      folder: result.folder,
      fileName: result.fileName
    };
  } catch (error) {
    logger.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Get all gallery images from Supabase storage (daily folders: img_*, result_*).
 * Use when DB is empty or to show test uploads. Returns same shape as getTryOnResults.
 * @returns {Promise<Array<{ id: string, result_image_url: string, outfit_name: string, created_at: string|null }>>}
 */
export async function getGalleryImagesFromStorage() {
  const out = [];
  try {
    const folders = await listDailyFolders();
    for (const folder of folders) {
      const name = folder.name;
      const { data: files, error } = await supabase.storage
        .from(SUPABASE_BUCKET_NAME)
        .list(name, { limit: 500 });
      if (error || !files) continue;
      const imageFiles = files.filter(f => f.name && /\.(jpg|jpeg|png|webp)$/i.test(f.name));
      for (const file of imageFiles) {
        const filePath = `${name}/${file.name}`;
        const publicUrl = await getPublicImageUrl(filePath);
        out.push({
          id: `storage-${filePath.replace(/\//g, '-')}`,
          result_image_url: publicUrl,
          outfit_name: name,
          created_at: file.created_at || null
        });
      }
    }
    // Sort by path (newer folders first if naming is date-based)
    out.sort((a, b) => (b.outfit_name + b.result_image_url).localeCompare(a.outfit_name + a.result_image_url));
  } catch (err) {
    logger.warn('getGalleryImagesFromStorage error:', err);
  }
  return out;
}

// Default export for convenience
const supabaseImageService = {
  uploadImageWithDailyFolder,
  uploadResultFromUrl,
  getPublicImageUrl,
  downloadImage,
  listImages,
  listDailyFolders,
  getImageCount,
  getGalleryImagesFromStorage,
  uploadImage,
  deleteImage,
  testConnection,
  checkAllBuckets
};
export default supabaseImageService;
