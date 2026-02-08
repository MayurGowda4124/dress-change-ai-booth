import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getResultById } from '../config/supabase';
import QRCode from 'qrcode';
import logger from '../utils/logger';

const ResultPage = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const resultImageUrl = location.state?.resultImageUrl;
  const taskId = location.state?.taskId;

  useEffect(() => {
    if (!resultId) {
      setLoading(false);
      setError('No result ID provided');
      return;
    }

    const fetchResult = async () => {
      try {
        setLoading(true);
        
        // Check if we have result data in location state first
        if (location.state && location.state.resultImageUrl) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Using result data from navigation state:', location.state);
          }
          setResult({
            result_image_url: location.state.resultImageUrl,
            model_name: 'User Photo',
            outfit_name: location.state.selectedCostume?.name || 'Selected Costume',
            cloth_type: 'full_set',
            created_at: new Date().toISOString()
          });
          
          // Generate QR code for the result image URL
          const qrDataUrl = await QRCode.toDataURL(location.state.resultImageUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#1f2937',
              light: '#ffffff'
            }
          });
          setQrCodeUrl(qrDataUrl);
        } else {
          // Fallback to fetching from Supabase
          if (process.env.NODE_ENV === 'development') {
            console.log('Fetching result from Supabase for ID:', resultId);
          }
          const data = await getResultById(resultId);
          setResult(data);
          
          // Generate QR code for the Supabase image URL
          if (data.result_image_url) {
            const qrDataUrl = await QRCode.toDataURL(data.result_image_url, {
              width: 200,
              margin: 2,
              color: {
                dark: '#1f2937',
                light: '#ffffff'
              }
            });
            setQrCodeUrl(qrDataUrl);
          }
        }
      } catch (err) {
        setError('Result not found');
        logger.error('Error fetching result:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId, resultImageUrl, taskId]); // eslint-disable-line react-hooks/exhaustive-deps -- depend on ids only, not location.state

  const handleHome = () => {
    navigate('/');
  };

  const handleTryAnother = () => {
    navigate('/camera');
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen relative">
        {/* Theme Background */}
        <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url('/images/Ui_Ux_img/Theme.png')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
        
        {/* Loading Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-black text-lg font-semibold">Loading your result...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex flex-col min-h-screen relative">
        {/* Theme Background */}
        <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url('/images/Ui_Ux_img/Theme.png')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
        
        {/* Error Content */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-black text-lg font-semibold mb-4">Result not found</p>
              <button onClick={handleHome} className="focus:outline-none hover:opacity-90 transition-opacity" aria-label="Home">
                <img src="/images/Ui_Ux_img/home.fw.png" alt="Home" className="h-12 w-auto object-contain" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Theme Background */}
      <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url('/images/Ui_Ux_img/Theme.png')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Home Button - Top Left */}
        <div className="absolute top-28 left-6 z-10">
          <button onClick={handleHome} className="focus:outline-none hover:opacity-90 transition-opacity" aria-label="Home">
            <img src="/images/Ui_Ux_img/home.fw.png" alt="Home" className="h-10 w-auto object-contain" />
          </button>
        </div>

        {/* Main Content - Left Aligned */}
        <div className="flex-1 flex items-center px-8 pt-16 pb-24">
          <div className="w-full">
            <div className="flex flex-row items-start gap-6">
              {/* Result Image - Full Left */}
              <div className="flex-1 max-w-md">
                <h3 className="text-xl font-bold text-black mb-4 text-center drop-shadow-lg">Your Try-On Result</h3>
                {result.result_image_url && (
                  <div className="rounded-lg p-2">
                    <img
                      src={result.result_image_url}
                      alt="Try-on result"
                      className="w-full h-auto rounded-lg shadow-2xl border-4 border-white max-h-[800px] object-cover"
                    />
                  </div>
                )}
              </div>

              {/* QR Code - Next to Result */}
              <div className="flex-shrink-0 max-w-xs flex flex-col items-center mt-56">
                <h3 className="text-lg font-bold text-black mb-3 drop-shadow-lg">Scan to Download</h3>
                <div className="bg-white p-3 rounded-lg border-2 border-gray-200 shadow-lg">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-32 h-32"
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-black mt-2 text-center max-w-32 drop-shadow-lg">
                  Scan this QR code to view and Download your image
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Try Another Outfit - Bottom Right */}
        <div className="absolute bottom-32 right-8 z-20 flex flex-col sm:flex-row items-end gap-3">
          <button
            onClick={handleTryAnother}
            className="focus:outline-none hover:opacity-90 transition-opacity"
            aria-label="Try Another Outfit"
          >
            <img src="/images/Ui_Ux_img/retake.fw.png" alt="Try Another Outfit" className="h-12 md:h-14 w-auto object-contain" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage; 