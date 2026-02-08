import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import ModelSelectorWithUpload from '../components/ModelSelectorWithUpload';
import OutfitSelectorWithUpload from '../components/OutfitSelectorWithUpload';
import ResultDisplay from '../components/ResultDisplay';
import LoadingAnimation from '../components/LoadingAnimation';
import { performTryOn } from '../services/fitroomApi';
import { getApiUrl, getImageUrl } from '../config/api';
import logger from '../utils/logger';

const TryOnPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [, setIsProcessing] = useState(false);
  const [, setProcessingStatus] = useState({});
  const [result, setResult] = useState(null);
  const [, setError] = useState(null);
  const [showLoading, setShowLoading] = useState(false);

  // Check if we have data from the costume selection flow
  useEffect(() => {
    if (location.state?.capturedImage && location.state?.selectedCostume) {
      // Convert captured image to model format
      const capturedModel = {
        id: 'captured',
        name: 'Your Photo',
        image: location.state.capturedImage,
        file: null // Will be converted when needed
      };
      setSelectedModel(capturedModel);
      
      // Convert selected costume to outfit format
      const selectedCostume = location.state.selectedCostume;
      const costumeOutfit = {
        id: selectedCostume.id,
        name: selectedCostume.name,
        image: selectedCostume.src,
        file: null // Will be converted when needed
      };
      setSelectedOutfit(costumeOutfit);
      
      // If startProcessing flag is set, show loading and go directly to processing
      if (location.state?.startProcessing) {
        setShowLoading(true);
        setStep(4); // Go directly to processing step (invisible)
      } else {
        setStep(3); // Show the review step
      }
    } else if (location.state?.capturedImage) {
      // Fallback for direct navigation (shouldn't happen with new flow)
      const capturedModel = {
        id: 'captured',
        name: 'Your Photo',
        image: location.state.capturedImage,
        file: null
      };
      setSelectedModel(capturedModel);
      setStep(2);
    }
  }, [location.state]);

  // Helper to resolve image URL (blob, http, or relative path)
  const getFullImageUrl = useCallback((imagePath) => {
    if (!imagePath) return null;
    if (typeof imagePath !== 'string') return null;
    if (imagePath.startsWith('blob:')) return imagePath;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    return getImageUrl(imagePath) || imagePath;
  }, []);

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    if (model) {
      setStep(2);
    }
  };

  const handleOutfitSelect = (outfit) => {
    setSelectedOutfit(outfit);
    if (outfit) {
      setStep(3);
    }
  };

  // Function to add photo frame to captured image
  const addPhotoFrame = useCallback(async (imageBlob, options = {}) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Load the photo frame
      const frameImg = new Image();
      frameImg.crossOrigin = 'anonymous';
      frameImg.onload = () => {
        logger.log('🖼️ PHOTO FRAME DIMENSIONS:');
        logger.log('📐 Frame Image Details:', {
          width: `${frameImg.width}px`,
          height: `${frameImg.height}px`,
          naturalWidth: `${frameImg.naturalWidth}px`,
          naturalHeight: `${frameImg.naturalHeight}px`,
          aspectRatio: `${(frameImg.width/frameImg.height).toFixed(2)}:1`
        });
        logger.log('🎯 Canvas will be set to:', `${frameImg.width} x ${frameImg.height}px`);
        
        // Load the captured image
        const capturedImg = new Image();
        capturedImg.crossOrigin = 'anonymous';
        capturedImg.onload = () => {
          // Set canvas size to frame size
          canvas.width = frameImg.width;
          canvas.height = frameImg.height;
          
          logger.log('Canvas dimensions set to:', canvas.width, 'x', canvas.height);
          logger.log('Captured image dimensions:', capturedImg.width, 'x', capturedImg.height);
          
          // Calculate the transparent area boundaries - MAXIMUM WIDTH
          const transparentArea = {
            // Left margin: almost zero to maximize width
            left: frameImg.width * 0.0001,
            // Top margin: minimal to maximize height
            top: frameImg.height * 0.0001,
            // Width: 99.99% to maximize width usage
            width: frameImg.width * 0.9999,
            // Height: 99.99% to maximize height usage
            height: frameImg.height * 0.9999
          };
          
          logger.log('Transparent area calculated:', transparentArea);
          
          // Calculate how to fit the captured image within the transparent area
          const areaAspectRatio = transparentArea.width / transparentArea.height;
          const imageAspectRatio = capturedImg.width / capturedImg.height;
          
          let drawX, drawY, drawWidth, drawHeight;
          
          // Fit the image within the transparent area (letterbox/pillarbox if needed)
          if (imageAspectRatio > areaAspectRatio) {
            // Image is wider - fit by width
            drawWidth = transparentArea.width;
            drawHeight = drawWidth / imageAspectRatio;
            drawX = transparentArea.left;
            drawY = transparentArea.top + (transparentArea.height - drawHeight) / 2;
          } else {
            // Image is taller - fit by height
            drawHeight = transparentArea.height;
            drawWidth = drawHeight * imageAspectRatio;
            drawX = transparentArea.left + (transparentArea.width - drawWidth) / 2;
            drawY = transparentArea.top;
          }
          
          // Apply scaling options if provided
          const scaleX = options.xAxisScale || 1.0;
          const scaleY = options.yAxisScale || 1.0;
          
          // Apply scaling while keeping the image centered in the transparent area
          const scaledWidth = drawWidth * scaleY;
          const scaledHeight = drawHeight * scaleX;
          
          // Recalculate position to keep centered
          drawX = transparentArea.left + (transparentArea.width - scaledWidth) / 2;
          drawY = transparentArea.top + (transparentArea.height - scaledHeight) / 2;
          
          // Update dimensions
          drawWidth = scaledWidth;
          drawHeight = scaledHeight;
          
          // Apply offset options
          drawX += (options.xOffset || 0);
          drawY += (options.yOffset || 0);
          
          logger.log('🎯 FINAL IMAGE POSITIONING DETAILS:');
          logger.log('📍 Transparent Area Boundaries:', {
            left: `${transparentArea.left}px (${(transparentArea.left/frameImg.width*100).toFixed(1)}%)`,
            top: `${transparentArea.top}px (${(transparentArea.top/frameImg.height*100).toFixed(1)}%)`,
            right: `${transparentArea.left + transparentArea.width}px (${((transparentArea.left + transparentArea.width)/frameImg.width*100).toFixed(1)}%)`,
            bottom: `${transparentArea.top + transparentArea.height}px (${((transparentArea.top + transparentArea.height)/frameImg.height*100).toFixed(1)}%)`,
            width: `${transparentArea.width}px (${(transparentArea.width/frameImg.width*100).toFixed(1)}%)`,
            height: `${transparentArea.height}px (${(transparentArea.height/frameImg.height*100).toFixed(1)}%)`
          });
          
          logger.log('🖼️ IMAGE PLACEMENT COORDINATES:');
          logger.log('📍 Corner Points:');
          logger.log(`   Top-Left:     (${drawX.toFixed(1)}, ${drawY.toFixed(1)})`);
          logger.log(`   Top-Right:    (${(drawX + drawWidth).toFixed(1)}, ${drawY.toFixed(1)})`);
          logger.log(`   Bottom-Left:  (${drawX.toFixed(1)}, ${(drawY + drawHeight).toFixed(1)})`);
          logger.log(`   Bottom-Right: (${(drawX + drawWidth).toFixed(1)}, ${(drawY + drawHeight).toFixed(1)})`);
          logger.log(`   Center Point:  (${(drawX + drawWidth/2).toFixed(1)}, ${(drawY + drawHeight/2).toFixed(1)})`);
          
          logger.log('📏 Image Dimensions:');
          logger.log(`   Width:  ${drawWidth.toFixed(1)}px`);
          logger.log(`   Height: ${drawHeight.toFixed(1)}px`);
          logger.log(`   Area:   ${(drawWidth * drawHeight).toFixed(0)}px²`);
          
          logger.log('🎯 Placement Analysis:');
          logger.log(`   Distance from Left:   ${drawX.toFixed(1)}px`);
          logger.log(`   Distance from Top:    ${drawY.toFixed(1)}px`);
          logger.log(`   Distance from Right:  ${(frameImg.width - (drawX + drawWidth)).toFixed(1)}px`);
          logger.log(`   Distance from Bottom: ${(frameImg.height - (drawY + drawHeight)).toFixed(1)}px`);
          
          logger.log('📏 Image Dimensions:', {
            width: `${drawWidth.toFixed(1)}px`,
            height: `${drawHeight.toFixed(1)}px`,
            'Aspect Ratio': `${(drawWidth/drawHeight).toFixed(2)}:1`
          });
          
          logger.log('📊 FRAME vs IMAGE ANALYSIS:');
          logger.log(`   Frame Size:     ${frameImg.width} x ${frameImg.height}px`);
          logger.log(`   Image Size:     ${drawWidth.toFixed(1)} x ${drawHeight.toFixed(1)}px`);
          logger.log(`   Width Coverage: ${(drawWidth/frameImg.width*100).toFixed(1)}%`);
          logger.log(`   Height Coverage: ${(drawHeight/frameImg.height*100).toFixed(1)}%`);
          logger.log(`   Area Coverage:  ${((drawWidth * drawHeight)/(frameImg.width * frameImg.height)*100).toFixed(1)}%`);
          
          logger.log('🎨 VISUAL REPRESENTATION:');
          logger.log(`   Frame: ${frameImg.width}px wide x ${frameImg.height}px tall`);
          logger.log(`   ┌${'─'.repeat(Math.floor(frameImg.width/50))}┐`);
          logger.log(`   │${' '.repeat(Math.floor(drawX/50))}${'█'.repeat(Math.floor(drawWidth/50))}${' '.repeat(Math.floor((frameImg.width-drawX-drawWidth)/50))}│`);
          logger.log(`   │${' '.repeat(Math.floor(frameImg.width/50))}│ ← Image placed at X=${drawX.toFixed(0)}`);
          logger.log(`   └${'─'.repeat(Math.floor(frameImg.width/50))}┘`);
          logger.log(`   Y=${drawY.toFixed(0)}`);
          
          // STEP 1: Draw the frame background first
          ctx.drawImage(frameImg, 0, 0, frameImg.width, frameImg.height);
          
          // STEP 2: Create a clipping path for the transparent area to ensure image stays within bounds
          ctx.save();
          
          // Create rectangular clipping area
          ctx.beginPath();
          ctx.rect(
            transparentArea.left, 
            transparentArea.top, 
            transparentArea.width, 
            transparentArea.height
          );
          ctx.clip();
          
          // Apply horizontal flip to correct mirror effect
          if (options.flipHorizontal !== false) {
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);
            // Adjust X position for flipped coordinate system
            drawX = canvas.width - drawX - drawWidth;
          }
          
          // Draw the captured image within the clipped transparent area
          ctx.drawImage(
            capturedImg,
            drawX, drawY, drawWidth, drawHeight
          );
          
          ctx.restore();
          
          logger.log('Image placed within transparent area');
          
          // Use JPEG for smaller file size (FitRoom has 10MB limit). PNG was causing "image too large" errors.
          const format = options.format || 'image/jpeg';
          const quality = Math.min(1, Math.max(0.1, options.quality ?? 0.85));
          canvas.toBlob((blob) => {
            logger.log('Final composed image created, size:', blob?.size, 'format:', format);
            resolve(blob);
          }, format, quality);
        };
        
        capturedImg.onerror = () => reject(new Error('Failed to load captured image'));
        capturedImg.src = URL.createObjectURL(imageBlob);
      };
      
          frameImg.onerror = () => reject(new Error('Failed to load photo frame'));
          frameImg.src = '/images/Ui_Ux_img/Photo Frame_Portrait._bg5.png';
    });
  }, []);

  const handleStartTryOn = useCallback(async () => {
    logger.log('Starting try-on with:', { selectedModel, selectedOutfit });
    
    if (!selectedModel) {
      toast.error('Model not selected. Please try again.');
      return;
    }
    
    if (!selectedOutfit) {
      toast.error('Outfit not selected. Please try again.');
      return;
    }
    
    if (!selectedModel.image) {
      toast.error('Model image not available. Please try again.');
      return;
    }
    
    if (!selectedOutfit.image) {
      toast.error('Outfit image not available. Please try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStep(4);

    try {
      // Handle model image (either from folder, uploaded, or captured)
      let modelFile;
      if (selectedModel.file) {
        // Use uploaded file directly
        modelFile = selectedModel.file;
        logger.log('Using uploaded model file:', {
          type: modelFile.type,
          size: modelFile.size,
          name: modelFile.name
        });
      } else {
        // Convert model image from local path or captured image to File object
        logger.log('Fetching model image from:', selectedModel.image);
        const modelImageUrl = getFullImageUrl(selectedModel.image);
        if (!modelImageUrl) throw new Error('Could not resolve model image URL');
        const modelResponse = await fetch(modelImageUrl);
        if (!modelResponse.ok) {
          throw new Error(`Failed to fetch model image: ${modelResponse.status} - ${modelResponse.statusText}`);
        }
        
        const modelBlob = await modelResponse.blob();
        
        // If this is a captured image, add the photo frame
        if (selectedModel.id === 'captured') {
          logger.log('Adding photo frame to captured image...');
          try {
            // Frame options to align height and increase width
            const frameOptions = {
              scale: 1.2,           // Overall scale multiplier
              xOffset: 0,           // X-axis offset (positive = right, negative = left)
              yOffset: 0,           // Y-axis offset (positive = down, negative = up)
              
                              // EASY SIZE ADJUSTMENT - Change these values to adjust image size
                xAxisScale: 2.5,      // X-axis scaling (increases HEIGHT) - Range: 0.5 to 3.0
                yAxisScale: 2.8,      // Y-axis scaling (increases WIDTH) - Range: 0.5 to 3.0
              
              // Advanced options (usually don't need to change)
              widthMultiplier: 1.0, // Width scaling factor (use yAxisScale instead)
              heightMultiplier: 1.0, // Height scaling factor (use xAxisScale instead)
              resolutionMultiplier: 2.0, // Increase capturing resolution (2x higher quality)
              fitMode: 'cover',     // 'cover', 'contain', 'fill', 'custom'
              flipHorizontal: true, // Mirror horizontally
              flipVertical: false,  // Mirror vertically
              quality: 0.9,         // Image quality (0.1 to 1.0)
              format: 'image/jpeg'  // Output format
            };
            
            const framedBlob = await addPhotoFrame(modelBlob, frameOptions);
            modelFile = new File([framedBlob], 'captured_with_frame.jpg', { type: 'image/jpeg' });
            logger.log('Captured image with frame prepared:', {
              type: modelFile.type,
              size: modelFile.size,
              name: modelFile.name
            });
          } catch (frameError) {
            logger.error('Failed to add photo frame, using original image:', frameError);
            modelFile = new File([modelBlob], 'captured.jpg', { type: 'image/jpeg' });
          }
        } else {
          const fileName = `${selectedModel.id}.jpg`;
          modelFile = new File([modelBlob], fileName, { type: 'image/jpeg' });
        }
        
        logger.log('Model image prepared:', {
          type: modelFile.type,
          size: modelFile.size,
          name: modelFile.name
        });
      }

      // Handle outfit image (either from folder or uploaded)
      let outfitFile;
      if (selectedOutfit.file) {
        // Use uploaded file directly
        outfitFile = selectedOutfit.file;
        logger.log('Using uploaded outfit file:', {
          type: outfitFile.type,
          size: outfitFile.size,
          name: outfitFile.name
        });
      } else {
        // Convert outfit image from local path to File object
        logger.log('Fetching outfit image from:', selectedOutfit.image);
        const outfitImageUrl = getFullImageUrl(selectedOutfit.image);
        if (!outfitImageUrl) throw new Error('Could not resolve outfit image URL');
        const outfitResponse = await fetch(outfitImageUrl);
        if (!outfitResponse.ok) {
          throw new Error(`Failed to fetch outfit image: ${outfitResponse.status} - ${outfitResponse.statusText}`);
        }
        
        const outfitBlob = await outfitResponse.blob();
        outfitFile = new File([outfitBlob], `${selectedOutfit.id}.jpg`, { type: 'image/jpeg' });
        logger.log('Outfit image prepared:', {
          type: outfitFile.type,
          size: outfitFile.size,
          name: outfitFile.name
        });
      }

      // Use full_set for all outfits to change the entire costume
      const clothType = 'full_set';

      // Perform try-on - pass both images directly to FitRoom API
      logger.log('Starting try-on with:', {
        modelFile: { type: modelFile.type, size: modelFile.size, name: modelFile.name },
        outfitFile: { type: outfitFile.type, size: outfitFile.size, name: outfitFile.name },
        clothType
      });

      const tryOnResult = await performTryOn(
        modelFile, // Model image converted to File
        outfitFile, // Outfit image converted to File
        clothType,
        (status) => {
          setProcessingStatus(status);
        }
      );

      // #region agent log
      fetch('http://127.0.0.1:7249/ingest/1c1e54e7-857c-48d4-a14c-db811b53d4fb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TryOnPage.js:after performTryOn',message:'tryOnResult',data:{hasResultId:!!tryOnResult.resultId,hasResultImageUrl:!!tryOnResult.resultImageUrl,stepWillBe:tryOnResult.resultId?'navigate':'setStep(5)'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Use the FitRoom result URL directly (no Supabase upload)
      logger.log('Using FitRoom result URL directly');
      const resultImageUrl = tryOnResult.resultImageUrl;

      // Set result with the FitRoom URL for QR code generation
      const finalResult = {
        ...tryOnResult,
        resultImageUrl: resultImageUrl,
        // Ensure we have the correct structure for ResultDisplay
        resultId: tryOnResult.resultId || null,
        taskId: tryOnResult.taskId,
        fitroomUrl: tryOnResult.fitroomUrl,
        localPath: tryOnResult.localPath,
        localSaveSuccess: tryOnResult.localSaveSuccess
      };
      setResult(finalResult);

      // Hide loading animation and show result
      setShowLoading(false);
      
      // Navigate to result page instead of showing step 5
      if (tryOnResult.resultId) {
        navigate(`/result/${tryOnResult.resultId}`, { 
          state: { 
            result: finalResult,
            originalImage: selectedModel,
            outfit: selectedOutfit
          } 
        });
        toast.success('Try-on completed successfully!');
      } else {
        // If no result ID, show the result directly in the current page
        setResult(finalResult);
        setStep(5); // Show the result display step
        toast.success('Try-on completed! Image saved to storage.');
      }

    } catch (err) {
      logger.error('Try-on error:', err);
      logger.error('Error response:', err.response?.data);
      logger.error('Error status:', err.response?.status);
      // Hide loading animation on error
      setShowLoading(false);
      
      // Set a more descriptive error message
      const errorMessage = err.message || 'Failed to process try-on';
      setError(errorMessage);

      // Track the failure
      try {
        await fetch(getApiUrl('/api/track-failure'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: `failed-${Date.now()}`,
            error: errorMessage,
            originalImage: selectedModel?.name || 'Unknown',
            selectedCostume: selectedOutfit?.name || 'Unknown'
          }),
        });
      } catch (trackError) {
        logger.error('Failed to track error:', trackError);
      }

      // Show specific toast based on error type
      if (errorMessage && errorMessage.includes('API key')) {
        toast.error('Configuration error: Please check API settings');
      } else if (errorMessage && errorMessage.includes('rate limit')) {
        toast.error('Too many requests. Please wait and try again.');
      } else if (errorMessage && (errorMessage.includes('network') || errorMessage.includes('timeout'))) {
        toast.error('Connection error. Please check your internet and try again.');
      } else {
        toast.error('Try-on failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [selectedModel, selectedOutfit, getFullImageUrl, addPhotoFrame, navigate]);

  // Auto-start processing when coming from costume selection with startProcessing flag
  useEffect(() => {
    if (location.state?.startProcessing && selectedModel && selectedOutfit && step === 4) {
      const timer = setTimeout(() => {
        logger.log('Auto-starting processing with:', { selectedModel, selectedOutfit });
        handleStartTryOn();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location.state?.startProcessing, selectedModel, selectedOutfit, step, handleStartTryOn]);

  const handleNewTryOn = () => {
    setStep(1);
    setSelectedModel(null);
    setSelectedOutfit(null);
    setResult(null);
    setError(null);
    setProcessingStatus({});
  };

  const handleViewStatus = () => {
    navigate('/status');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">EKTA Try-On</h1>
              <p className="text-gray-600">Select a model to get started</p>
            </div>
            
            <ModelSelectorWithUpload
              onModelSelect={handleModelSelect}
              selectedModel={selectedModel}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Choose Your Outfit</h2>
              <p className="text-gray-600">Select the clothing item you'd like to try on</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Selected Model</h3>
              <div className="max-w-xs mx-auto">
                <img
                  src={selectedModel.image}
                  alt={selectedModel.name}
                  className="w-full h-auto rounded-lg border border-gray-200"
                />
                <p className="mt-2 text-center font-medium text-gray-800">
                  {selectedModel.name}
                </p>
              </div>
            </div>

            <OutfitSelectorWithUpload
              onOutfitSelect={handleOutfitSelect}
              selectedOutfit={selectedOutfit}
            />
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col min-h-screen">
            {/* Theme Background */}
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                backgroundImage: `url('/images/Ui_Ux_img/Theme.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col min-h-screen">
              {/* Header */}
              <div className="flex justify-between items-center p-6 pt-32">
                <button onClick={() => setStep(2)} className="focus:outline-none hover:opacity-90 transition-opacity" aria-label="Back">
                  <img src="/images/Ui_Ux_img/back.fw.png" alt="Back" className="h-10 w-auto object-contain" />
                </button>
                <h1 className="text-3xl md:text-4xl font-bold text-black text-center drop-shadow-lg">
                  Ready for Magic!
                </h1>
                <div className="w-20"></div> {/* Spacer for centering */}
              </div>

              {/* Images Side by Side */}
              <div className="flex-1 flex items-center justify-center px-6">
                <div className="grid grid-cols-2 gap-2 max-w-2xl w-full">
                  {/* Your Photo */}
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-black mb-2 drop-shadow-lg">Your Photo</h3>
                    <div className="w-full aspect-square bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                      <img
                        src={selectedModel.image}
                        alt={selectedModel.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Selected Outfit */}
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-black mb-2 drop-shadow-lg">Selected Outfit</h3>
                    <div className="w-full aspect-square bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                      <img
                        src={selectedOutfit.image}
                        alt={selectedOutfit.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="text-center pb-20">
                <button
                  onClick={handleStartTryOn}
                  className="hover:scale-105 transition-all duration-300"
                >
                  <img 
                    src="/images/Ui_Ux_img/Start_1.png" 
                    alt="Start Button"
                    className="w-[12.15rem] h-[12.15rem] md:w-[13.5rem] md:h-[13.5rem] object-contain cursor-pointer"
                  />
                </button>
              </div>
            </div>
          </div>
        );

      case 4:
        // Processing step - invisible, just start processing immediately
        return null;

      case 5:
        return (
          <div className="space-y-8">
            {result && result.resultImageUrl ? (
              <ResultDisplay
                resultImageUrl={result.resultImageUrl}
                originalImage={selectedModel}
                outfit={selectedOutfit}
                resultId={result.resultId}
              />
            ) : (
              <div className="text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-red-600 font-medium">Error: No result image available</p>
                  <p className="text-gray-600 text-sm mt-2">
                    Result data: {JSON.stringify(result, null, 2)}
                  </p>
                  <button
                    onClick={handleNewTryOn}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            <div className="text-center space-x-4">
              <button
                onClick={handleNewTryOn}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-lg"
              >
                Try Another Combination
              </button>
              <button
                onClick={handleViewStatus}
                className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-lg"
              >
                View All Results
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {showLoading && <LoadingAnimation />}
      {renderStep()}
    </div>
  );
};

export default TryOnPage; 