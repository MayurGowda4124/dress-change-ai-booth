// Test FitRoom API connection - validate API key only (no browser call to FitRoom to avoid CORS)
import { checkFitRoomApiKey } from './apiKeyChecker';
import logger from './logger';

const API_KEY = process.env.REACT_APP_FITROOM_API_KEY || import.meta.env?.VITE_FITROOM_API_KEY;

export const testFitRoomApiConnection = async () => {
  try {
    logger.log('=== Testing FitRoom API Connection ===');
    
    const apiKeyValid = checkFitRoomApiKey();
    if (!apiKeyValid) {
      throw new Error('Invalid API key configuration');
    }
    
    logger.log('API Key is valid');
    logger.log('API key configured:', !!API_KEY);
    // Do NOT call FitRoom /health from browser - it triggers CORS and is not required for try-on.
    
    return {
      success: true,
      message: 'API connection test completed',
      apiKeyValid: true,
      apiKeyLength: API_KEY?.length ?? 0
    };
    
  } catch (error) {
    logger.error('API connection test failed:', error);
    return {
      success: false,
      error: error.message,
      apiKeyValid: false
    };
  }
};

export default testFitRoomApiConnection;




