import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingAnimation from '../components/LoadingAnimation';
import { performTryOn } from '../services/fitroomApi';
import { addPhotoFrame } from '../utils/photoFrame';
import toast from 'react-hot-toast';
import { getApiUrl, getImageUrl } from '../config/api';

const CostumeSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { capturedImage, selectedGender } = location.state || {};
  const [isLoading, setIsLoading] = useState(false);

  const costumes = {
    male: [
      { id: 'm1', name: 'Traditional Male Costume 1', src: '/images/Male/m1.jpg' },
      { id: 'm2', name: 'Traditional Male Costume 2', src: '/images/Male/m2.jpg' },
      { id: 'm3', name: 'Traditional Male Costume 3', src: '/images/Male/m3.jpg' },
      { id: 'm4', name: 'Traditional Male Costume 4', src: '/images/Male/m4.jpg' },
      { id: 'm5', name: 'Traditional Male Costume 5', src: '/images/Male/m5.jpg' },
      { id: 'm6', name: 'Traditional Male Costume 6', src: '/images/Male/m6.jpg' }
    ],
    female: [
      { id: 'f1', name: 'Traditional Female Costume 1', src: '/images/Female/f1.jpg' },
      { id: 'f2', name: 'Traditional Female Costume 2', src: '/images/Female/f2.jpg' },
      { id: 'f3', name: 'Traditional Female Costume 3', src: '/images/Female/f3.jpg' },
      { id: 'f4', name: 'Traditional Female Costume 4', src: '/images/Female/f4.jpg' },
      { id: 'f5', name: 'Traditional Female Costume 5', src: '/images/Female/f5.jpg' },
      { id: 'f6', name: 'Traditional Female Costume 6', src: '/images/Female/f6.jpg' }
    ]
  };

  const currentCostumes = costumes[selectedGender] || [];

  const handleCostumeSelect = async (costume) => {
    setIsLoading(true);

    try {
      console.log('=== Starting Costume Selection Process ===');
      console.log('Captured image type:', typeof capturedImage);
      console.log('Selected costume:', costume);

      if (!capturedImage) {
        throw new Error('No captured image found. Please capture a photo first.');
      }

      let modelImageBlob;
      if (typeof capturedImage === 'string' && capturedImage.startsWith('data:')) {
        console.log('Converting data URL to blob...');
        const response = await fetch(capturedImage);
        modelImageBlob = await response.blob();
        console.log('Data URL converted to blob. Size:', modelImageBlob.size);
      } else if (capturedImage instanceof Blob) {
        console.log('Using captured image blob directly.');
        modelImageBlob = capturedImage;
      } else if (capturedImage instanceof File) {
        console.log('Using File as blob.');
        modelImageBlob = capturedImage;
      } else if (typeof capturedImage === 'string' && capturedImage.startsWith('/Images_input/')) {
        console.log('Fetching image from server path:', capturedImage);
        const imageUrl = getImageUrl(capturedImage) || getApiUrl(capturedImage);
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image from server: ${response.status}`);
        }
        modelImageBlob = await response.blob();
        console.log('Server image fetched. Size:', modelImageBlob.size);
      } else if (typeof capturedImage === 'string' && (capturedImage.startsWith('http://') || capturedImage.startsWith('https://'))) {
        const response = await fetch(capturedImage);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
        modelImageBlob = await response.blob();
      } else {
        console.error('Invalid captured image format. Type:', typeof capturedImage);
        throw new Error('Invalid captured image format');
      }

      console.log('Adding photo frame...');
      const framedImageBlob = await addPhotoFrame(modelImageBlob);
      console.log('Photo frame added successfully. Blob size:', framedImageBlob.size);

      console.log('Converting costume image to blob...');
      const costumeResponse = await fetch(costume.src);
      const costumeBlob = await costumeResponse.blob();
      console.log('Costume image converted to blob. Size:', costumeBlob.size);

      const modelFile = new File([framedImageBlob], 'user-photo-with-frame.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      const costumeFile = new File([costumeBlob], `${costume.id}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      console.log('Starting performTryOn...');
      const result = await performTryOn(
        modelFile,
        costumeFile,
        'full_set',
        (status) => {
          console.log('Processing status:', status);
        }
      );

      console.log('Try-on completed successfully:', result);

      const routeId = result.resultId || result.taskId;
      navigate(`/result/${routeId}`, {
        state: {
          capturedImage,
          selectedGender,
          selectedCostume: costume,
          resultImageUrl: result.resultImageUrl,
          resultId: result.resultId,
          taskId: result.taskId
        }
      });
    } catch (error) {
      console.error('=== Processing Error Details ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      setIsLoading(false);

      try {
        await fetch(getApiUrl('/api/track-failure'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: `failed-${Date.now()}`,
            error: error.message || 'Unknown error',
            originalImage: 'User Photo',
            selectedCostume: costume.name
          }),
        });
      } catch (trackError) {
        console.error('Failed to track error:', trackError);
      }

      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      toast.error(`Try-on failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/gender-selection', { state: { capturedImage } });
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="relative z-10 w-full h-full overflow-y-auto">
        <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url('/images/Ui_Ux_img/Theme.png')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
        <div className="relative flex flex-col min-h-screen">
          <div className="flex justify-between items-center p-8 pt-32">
            <button onClick={handleBack} className="focus:outline-none hover:opacity-90 transition-opacity" aria-label="Back">
              <img src="/images/Ui_Ux_img/back.fw.png" alt="Back" className="h-10 w-auto object-contain" />
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-black text-center drop-shadow-lg">Select Costume</h1>
            <div className="w-20"></div>
          </div>
          <div className="flex-1 flex items-start justify-center px-8 pb-32">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl w-full">
              {currentCostumes.map((costume) => (
                <div key={costume.id} className="text-center">
                  <button onClick={() => handleCostumeSelect(costume)} className="group hover:scale-105 transition-all duration-300 w-full">
                    <div className="w-full aspect-square bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                      <img src={costume.src} alt={costume.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-3 text-black text-lg font-bold drop-shadow-lg">{costume.name}</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-50">
          <LoadingAnimation />
        </div>
      )}
    </div>
  );
};

export default CostumeSelectionPage;
