import { PHOTO_FRAME_SRC } from './photoFrame';

// Utility to validate required images exist
export const validateRequiredImages = async () => {
  const requiredImages = [
    PHOTO_FRAME_SRC,
    '/images/Male/m1.jpg',
    '/images/Male/m2.jpg',
    '/images/Male/m3.jpg',
    '/images/Male/m4.jpg',
    '/images/Male/m5.jpg',
    '/images/Male/m6.jpg',
    '/images/Female/f1.jpg',
    '/images/Female/f2.jpg',
    '/images/Female/f3.jpg',
    '/images/Female/f4.jpg',
    '/images/Female/f5.jpg',
    '/images/Female/f6.jpg'
  ];

  const missingImages = [];

  for (const imagePath of requiredImages) {
    try {
      const response = await fetch(imagePath);
      if (!response.ok) {
        missingImages.push(imagePath);
      }
    } catch (error) {
      missingImages.push(imagePath);
    }
  }

  if (missingImages.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Missing required images:', missingImages);
    }
    throw new Error(`Missing required images: ${missingImages.join(', ')}`);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ All required images are available');
  }
  return true;
};

// Check if image exists
export const imageExists = async (imagePath) => {
  try {
    const response = await fetch(imagePath);
    return response.ok;
  } catch (error) {
    return false;
  }
};
