import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Bucket name – same as before (daily folders Event_day_dd_mm_yy live inside this bucket)
export const SUPABASE_BUCKET_NAME = process.env.REACT_APP_SUPABASE_BUCKET || 'ai_face_swap';

// Database table structure for try-on results
export const tryOnResultsTable = 'tryon_results';

// Daily folder name: Event_day_dd_mm_yy
const getTodayFolderName = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yy = String(today.getFullYear()).slice(-2);
  return `Event_day_${dd}_${mm}_${yy}`;
};

// Next sequential number for prefix in folder (e.g. result_001, result_002)
const getNextNumberForPrefix = async (folderName, prefix) => {
  try {
    const { data: files, error } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .list(folderName, { limit: 10000, sortBy: { column: 'name', order: 'asc' } });
    if (error) return '001';
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
    return String(maxNumber + 1).padStart(3, '0');
  } catch (err) {
    return String(Date.now()).slice(-6);
  }
};

// Function to check and create table if it doesn't exist
export const ensureTableExists = async () => {
  try {
    const { data, error } = await supabase
      .from(tryOnResultsTable)
      .select('*')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('Table does not exist, creating it...');
      console.error('Table creation requires database admin privileges');
      console.error('Please create the table manually with the following SQL:');
      console.error(`
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
      `);
    } else if (error) {
      console.error('Error checking table:', error);
    } else {
      console.log('Table exists and is accessible');
    }
  } catch (error) {
    console.error('Error ensuring table exists:', error);
  }
};

// Function to upload image to Supabase storage
export const uploadImageToStorage = async (file, fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Function to save try-on result to database
export const saveTryOnResult = async (resultData) => {
  try {
    const { data, error } = await supabase
      .from(tryOnResultsTable)
      .insert([resultData]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving try-on result:', error);
    throw error;
  }
};

// Upload result image from URL – daily folder (Event_day_dd_mm_yy) + result_001.jpg, result_002.jpg, ...
export const uploadResultImageFromUrl = async (imageUrl, _fileName) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Uploading FitRoom result to daily folder (Event_day_.../result_XXX.jpg)...`);

      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

      const imageBlob = await response.blob();
      console.log(`Image fetched, size: ${imageBlob.size} bytes`);

      const folderName = getTodayFolderName();
      const nextNumber = await getNextNumberForPrefix(folderName, 'result');
      const fileName = `result_${nextNumber}.jpg`;
      const fullPath = `${folderName}/${fileName}`;

      const { error } = await supabase.storage
        .from(SUPABASE_BUCKET_NAME)
        .upload(fullPath, imageBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(SUPABASE_BUCKET_NAME)
        .getPublicUrl(fullPath);

      console.log('Supabase upload successful:', urlData?.publicUrl);
      return urlData?.publicUrl;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        console.log(`Retrying in ${attempt * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }

  console.error('All upload attempts failed');
  throw new Error(`Failed to upload image after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
};

// Function to save FitRoom try-on result to database
export const saveFitRoomResult = async (resultData) => {
  try {
    console.log('Saving result data to database:', resultData);

    await ensureTableExists();

    const insertData = {
      ...resultData,
      status: 'COMPLETED',
      created_at: new Date().toISOString()
    };

    console.log('Insert data prepared:', insertData);

    const { data, error } = await supabase
      .from(tryOnResultsTable)
      .insert([insertData]);

    if (error) {
      console.error('Supabase insert error:', error);
      if (error.code === 'PGRST116') {
        throw new Error('Database table does not exist. Please create the tryon_results table in your Supabase database.');
      }
      throw error;
    }

    console.log('Database insert successful:', data);
    return data;
  } catch (error) {
    console.error('Error saving FitRoom result:', error);
    throw error;
  }
};

// Function to get result by ID
export const getResultById = async (resultId) => {
  try {
    const { data, error } = await supabase
      .from(tryOnResultsTable)
      .select('*')
      .eq('id', resultId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching result by ID:', error);
    throw error;
  }
};

// Function to get all try-on results
export const getTryOnResults = async () => {
  try {
    const { data, error } = await supabase
      .from(tryOnResultsTable)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching try-on results:', error);
    throw error;
  }
};
