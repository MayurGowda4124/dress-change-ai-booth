// Utility to check FitRoom API key configuration
import logger from './logger';

export const checkFitRoomApiKey = () => {
  const apiKey = process.env.REACT_APP_FITROOM_API_KEY || import.meta.env?.VITE_FITROOM_API_KEY;
  
  logger.log('=== FitRoom API Key Check ===');
  logger.log('API key configured:', !!apiKey);
  
  if (!apiKey) {
    logger.error('❌ FitRoom API key is missing!');
    logger.error('Please set REACT_APP_FITROOM_API_KEY or VITE_FITROOM_API_KEY in your environment variables.');
    return false;
  }
  
  if (apiKey === 'your-api-key' || apiKey.length < 10) {
    logger.error('❌ FitRoom API key appears to be invalid or placeholder!');
    return false;
  }
  
  logger.log('FitRoom API key appears to be configured correctly');
  return true;
};

export default checkFitRoomApiKey; 