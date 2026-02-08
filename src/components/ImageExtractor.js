import React, { useState, useEffect } from 'react';
import { getPublicImageUrl, downloadImage, listImages, testConnection, checkAllBuckets } from '../services/supabaseImageService';
import logger from '../utils/logger';

const ImageExtractor = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  // Function to list all images in the bucket
  const handleListImages = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo('');
    
    try {
      // First test the connection
      logger.log('Testing Supabase connection...');
      const connectionTest = await testConnection();
      logger.log('Connection test result:', connectionTest);
      
      if (!connectionTest.success) {
        setError(`Connection failed: ${connectionTest.error}`);
        setDebugInfo(`Connection test failed: ${connectionTest.error}`);
        return;
      }
      
      // Debug: Check environment variables
      logger.log('Environment variables check:');
      logger.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
      logger.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
      
      setDebugInfo(`Connection: ✅ Success\nURL: ${process.env.REACT_APP_SUPABASE_URL || 'Missing'}\nKey: ${process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Present' : 'Missing'}`);
      
      const imageList = await listImages();
      logger.log('All images in bucket:', imageList);
      setImages(imageList);
      
      if (!imageList || imageList.length === 0) {
        setDebugInfo(prev => prev + '\n\nNo images found in bucket. This could mean:\n1. Bucket is empty\n2. Bucket permissions are not set correctly\n3. Bucket name is wrong');
      } else {
        setDebugInfo(prev => prev + `\n\nFound ${imageList.length} images in bucket`);
      }
    } catch (err) {
      setError(err.message);
      logger.error('Error listing images:', err);
      setDebugInfo(prev => prev + `\n\nError: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to get public URL for a specific image
  const handleGetImageUrl = async (fileName) => {
    try {
      const url = await getPublicImageUrl(fileName);
      setImageUrl(url);
      logger.log(`Public URL for ${fileName}:`, url);
    } catch (err) {
      setError(err.message);
      logger.error('Error getting image URL:', err);
    }
  };

  // Function to download an image
  const handleDownloadImage = async (fileName) => {
    try {
      const blob = await downloadImage(fileName);
      logger.log(`Downloaded ${fileName}:`, blob);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
      logger.error('Error downloading image:', err);
    }
  };

  // Load images on component mount
  useEffect(() => {
    handleListImages();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Image Extractor</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {debugInfo && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold mb-2">Debug Information:</h3>
          <pre className="text-sm whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}

      <div className="mb-6 space-x-4">
        <button
          onClick={handleListImages}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Images List'}
        </button>
        <button
          onClick={async () => {
            setLoading(true);
            const result = await testConnection();
            logger.log('Test result:', result);
            setDebugInfo(`Connection test: ${result.success ? '✅ Success' : '❌ Failed'}\n${result.error || ''}`);
            setLoading(false);
          }}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Test Connection
        </button>
        <button
          onClick={async () => {
            setLoading(true);
            const result = await checkAllBuckets();
            logger.log('Bucket check result:', result);
            let debugText = 'Bucket Check Results:\n';
            Object.entries(result).forEach(([bucketName, info]) => {
              if (info.error) {
                debugText += `${bucketName}: ❌ ${info.error}\n`;
              } else {
                debugText += `${bucketName}: ✅ ${info.count} items\n`;
                if (info.items && info.items.length > 0) {
                  debugText += `  Sample items: ${info.items.map(item => item.name).join(', ')}\n`;
                }
              }
            });
            setDebugInfo(debugText);
            setLoading(false);
          }}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Check All Buckets
        </button>
      </div>

      {imageUrl && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Public Image URL:</h2>
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm break-all">{imageUrl}</p>
            <img src={imageUrl} alt="Extracted" className="mt-2 max-w-xs" />
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Images in Bucket:</h2>
        {images.length === 0 ? (
          <p className="text-gray-500">No images found in bucket</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image.name || image.id || `file-${image.created_at}`} className="border rounded p-4">
                <h3 className="font-medium mb-2">{image.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Size: {Math.round(image.metadata?.size / 1024)} KB
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleGetImageUrl(image.name)}
                    className="bg-green-500 hover:bg-green-700 text-white text-sm py-1 px-3 rounded w-full"
                  >
                    Get Public URL
                  </button>
                  <button
                    onClick={() => handleDownloadImage(image.name)}
                    className="bg-purple-500 hover:bg-purple-700 text-white text-sm py-1 px-3 rounded w-full"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageExtractor;
