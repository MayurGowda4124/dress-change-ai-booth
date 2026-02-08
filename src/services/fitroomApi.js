import axios from 'axios';
import { uploadResultImageFromUrl, saveFitRoomResult } from '../config/supabase';
import { checkFitRoomApiKey } from '../utils/apiKeyChecker';
import { getApiUrl } from '../config/api';

const API_BASE_URL = 'https://platform.fitroom.app/api';
const API_KEY = process.env.REACT_APP_FITROOM_API_KEY || import.meta.env?.VITE_FITROOM_API_KEY || 'your-api-key';

// Create axios instance with default config
const fitroomApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-KEY': API_KEY,
  },
});

// Validate image file for FitRoom API
const validateImageForAPI = (file, name) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!file) {
    throw new Error(`${name} is required`);
  }

  if (!file.type || file.type === 'text/plain') {
    throw new Error(`${name} has invalid MIME type: ${file.type || 'undefined'}`);
  }

  if (!validTypes.includes(file.type)) {
    throw new Error(`${name} has unsupported MIME type: ${file.type}. Supported: ${validTypes.join(', ')}`);
  }

  if (file.size === 0) {
    throw new Error(`${name} is empty`);
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB
    throw new Error(`${name} is too large. Maximum size is 10MB`);
  }

  return true;
};

// Send image directly to FitRoom API
export const sendToFitRoom = async (imageFile, gender, outfitId) => {
  try {
    validateImageForAPI(imageFile, 'Image file');

    console.log('=== FitRoom API Debug Info ===');
    console.log('Image file:', {
      type: imageFile.type,
      size: imageFile.size,
      name: imageFile.name
    });
    console.log('Gender:', gender);
    console.log('Outfit ID:', outfitId);

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('gender', gender);
    formData.append('outfitId', outfitId);

    console.log('FormData created successfully');
    const response = await fitroomApi.post('/tryon/v2/tasks', formData);

    console.log('FitRoom API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending to FitRoom:', error);
    console.error('Error details:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

// Check Model Image
export const checkModelImage = async (modelImage) => {
  try {
    validateImageForAPI(modelImage, 'Model image');

    const formData = new FormData();
    formData.append('input_image', modelImage);

    const response = await fitroomApi.post('/tryon/input_check/v1/model', formData);

    return response.data;
  } catch (error) {
    console.error('Error checking model image:', error);
    throw error;
  }
};

// Check Clothes Image
export const checkClothesImage = async (clothesImage) => {
  try {
    validateImageForAPI(clothesImage, 'Clothes image');

    const formData = new FormData();
    formData.append('input_image', clothesImage);

    const response = await fitroomApi.post('/tryon/input_check/v1/clothes', formData);

    return response.data;
  } catch (error) {
    console.error('Error checking clothes image:', error);
    throw error;
  }
};

// Create Try-on Task (for model + cloth images)
export const createTryOnTask = async (modelImage, clothImage, clothType) => {
  try {
    validateImageForAPI(modelImage, 'Model image');
    validateImageForAPI(clothImage, 'Cloth image');

    console.log('=== FitRoom API Debug Info ===');
    console.log('Model image:', {
      type: modelImage.type,
      size: modelImage.size,
      name: modelImage.name
    });
    console.log('Cloth image:', {
      type: clothImage.type,
      size: clothImage.size,
      name: clothImage.name
    });
    console.log('Cloth type:', clothType);

    const formData = new FormData();
    formData.append('model_image', modelImage);
    formData.append('cloth_image', clothImage);
    formData.append('cloth_type', clothType);

    console.log('FormData created successfully');
    const response = await fitroomApi.post('/tryon/v2/tasks', formData);

    console.log('FitRoom API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating try-on task:', error);
    console.error('Error details:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

// Get Task Status
export const getTaskStatus = async (taskId) => {
  try {
    const response = await fitroomApi.get(`/tryon/v2/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting task status:', error);
    throw error;
  }
};

// Poll task status until completion
export const pollTaskStatus = async (taskId, onProgress) => {
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const status = await getTaskStatus(taskId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'COMPLETED') {
        return status;
      } else if (status.status === 'FAILED') {
        throw new Error(status.error || 'Task failed');
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    } catch (error) {
      console.error('Error polling task status:', error);
      throw error;
    }
  }

  throw new Error('Task polling timeout');
};

// Download result image
export const downloadResultImage = async (downloadUrl) => {
  try {
    const response = await axios.get(downloadUrl, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading result image:', error);
    throw error;
  }
};

// Save result to local server
export const saveResultToLocal = async (resultBlob, filename) => {
  try {
    console.log('Saving result to local server:', { filename, blobSize: resultBlob.size });

    const formData = new FormData();
    formData.append('result', resultBlob, filename);

    const response = await fetch(getApiUrl('/api/save-result'), {
      method: 'POST',
      body: formData,
    });

    console.log('Save result response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Save result failed with status:', response.status);
      console.warn('Local save failed, but continuing with Supabase result');
      return { success: false, error: `Local save failed: ${response.status}` };
    }

    const data = await response.json();
    console.log('Result saved successfully to local server:', data);
    return data;
  } catch (localError) {
    console.error('Error saving to local server:', localError);
    console.warn('Local save failed, but continuing with Supabase result');
    return { success: false, error: localError.message };
  }
};

// Complete try-on workflow (for model + cloth images)
export const performTryOn = async (modelImage, clothImage, clothType, onProgress) => {
  try {
    console.log('=== Starting Optimized FitRoom Try-On Process ===');

    const apiKeyValid = checkFitRoomApiKey();
    if (!apiKeyValid) {
      throw new Error('Invalid API key configuration. Please check your FitRoom API settings.');
    }

    console.log('Creating FitRoom task...');
    const task = await createTryOnTask(modelImage, clothImage, clothType);
    console.log('Task created:', task);

    console.log('Polling for task completion...');
    const result = await pollTaskStatus(task.task_id, onProgress);
    console.log('Task completed:', result);

    if (!result.download_signed_url) {
      throw new Error('FitRoom API did not return a download URL');
    }

    console.log('Downloading result image...');
    const resultBlob = await downloadResultImage(result.download_signed_url);
    const fileName = `fitroom-result-${Date.now()}.jpg`;

    const resultData = {
      task_id: task.task_id,
      original_image_url: modelImage.image || modelImage.file?.name || 'Unknown',
      result_image_url: '',
      outfit_name: clothImage.name || clothImage.file?.name || 'Unknown',
      model_name: modelImage.name || modelImage.file?.name || 'Unknown',
      cloth_type: clothType,
      fitroom_url: result.download_signed_url
    };

    console.log('Starting parallel operations...');
    const [supabaseImageUrl, localSaveResult] = await Promise.all([
      uploadResultImageFromUrl(result.download_signed_url, fileName),
      saveResultToLocal(resultBlob, fileName),
    ]);

    console.log('Supabase upload completed:', supabaseImageUrl);
    console.log('Local save completed:', localSaveResult);

    if (!localSaveResult.success) {
      console.warn('Local save failed, but Supabase upload succeeded. Continuing...');
    }

    resultData.result_image_url = supabaseImageUrl;

    console.log('Saving to database...');
    let resultId = null;
    try {
      const savedResult = await saveFitRoomResult(resultData);
      console.log('Database save completed:', savedResult);
      resultId = savedResult[0].id;
    } catch (dbError) {
      console.error('Database save failed, but continuing with result display:', dbError);
    }

    return {
      taskId: task.task_id,
      resultImageUrl: supabaseImageUrl,
      resultId: resultId,
      fitroomUrl: result.download_signed_url,
      localPath: localSaveResult.success ? localSaveResult.path : null,
      localSaveSuccess: localSaveResult.success
    };
  } catch (error) {
    console.error('Error in try-on workflow:', error);

    if (error.response?.status === 401) {
      throw new Error('Invalid API key. Please check your FitRoom API configuration.');
    } else if (error.response?.status === 400) {
      throw new Error(`Invalid request: ${error.response.data?.message || 'Please check your image files.'}`);
    } else if (error.response?.status === 429) {
      throw new Error('API rate limit exceeded. Please try again later.');
    } else if (error.response?.status >= 500) {
      throw new Error('FitRoom API server error. Please try again later.');
    } else if (error.message && error.message.includes('timeout')) {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    } else if (error.message && error.message.includes('network')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error(`Try-on failed: ${error.message || 'Unknown error occurred'}`);
    }
  }
};

// Complete try-on workflow (for single image with gender/outfit)
export const performSingleImageTryOn = async (imageFile, gender, outfitId, onProgress) => {
  try {
    const task = await sendToFitRoom(imageFile, gender, outfitId);
    const result = await pollTaskStatus(task.task_id, onProgress);

    return {
      taskId: task.task_id,
      resultImageUrl: result.download_signed_url,
    };
  } catch (error) {
    console.error('Error in single image try-on workflow:', error);
    throw error;
  }
};
