import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';

const ResultDisplay = ({ resultImageUrl, originalImage, outfit, resultId }) => {
  const navigate = useNavigate();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(true);

  useEffect(() => {
    if (!resultImageUrl || typeof resultImageUrl !== 'string') {
      setIsGeneratingQR(false);
      return;
    }

    const generateQRCode = async () => {
      try {
        setIsGeneratingQR(true);
        
        // Generate QR code for the result image URL
        const qrDataUrl = await QRCode.toDataURL(resultImageUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          }
        });
        setQrCodeUrl(qrDataUrl);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error generating QR code:', error);
        }
      } finally {
        setIsGeneratingQR(false);
      }
    };

    if (resultImageUrl) {
      generateQRCode();
    }
  }, [resultImageUrl]);

  const handleHome = () => {
    navigate('/');
  };

  const handleTryAnother = () => {
    navigate('/camera');
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Theme Background */}
      <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url('/images/Ui_Ux_img/Theme.png')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Home Button - Top Left */}
        <div className="absolute top-4 left-4 z-20">
          <button onClick={handleHome} className="focus:outline-none hover:opacity-90 transition-opacity" aria-label="Home">
            <img src="/images/Ui_Ux_img/home.fw.png" alt="Home" className="h-10 w-auto object-contain" />
          </button>
        </div>

        {/* Main Content - Centered */}
        <div className="flex-1 flex items-center justify-center px-4 pt-16 pb-24">
          <div className="w-full max-w-5xl">
            {/* Result Display Container */}
            <div className="bg-white rounded-2xl shadow-2xl border-4 border-blue-800 p-6">
              <div className="flex flex-col xl:flex-row items-center justify-center gap-6">
                {/* Result Image */}
                <div className="flex-1 max-w-lg">
                  {resultImageUrl && (
                    <img
                      src={resultImageUrl}
                      alt="Try-on result"
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  )}
                </div>

                {/* QR Code */}
                <div className="flex-1 max-w-lg flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Scan to Share</h3>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    {isGeneratingQR ? (
                      <div className="w-40 h-40 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="w-40 h-40"
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Scan this QR code to view your result
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Try Another Outfit Button - Bottom */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <button 
            onClick={handleTryAnother}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg text-base font-semibold"
          >
            Try Another Outfit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay; 