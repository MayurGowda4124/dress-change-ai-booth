import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getApiUrl, getImageUrl } from "../config/api";
import logger from "../utils/logger";

const CameraPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================
  // REFS
  // ============================================
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Critical guards
  const isMountedRef = useRef(true);
  const isInitializingRef = useRef(false);
  const isCapturingRef = useRef(false);
  const capturedImageRef = useRef(null);
  const deviceIndexRef = useRef(0);

  // ============================================
  // STATE
  // ============================================
  const [mode, setMode] = useState("camera");
  const [cameraState, setCameraState] = useState("loading");
  const [countdown, setCountdown] = useState(null);
  const [capturedImage, setCapturedImage] = useState(() => location.state?.capturedImage || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  const STORAGE_KEY = "camera_captured_image";
  const STORAGE_TIME_KEY = "camera_captured_image_ts";

  // Keep ref in sync + persist to sessionStorage (survives Strict Mode remount)
  useEffect(() => {
    capturedImageRef.current = capturedImage;
    if (capturedImage && !capturedImage.startsWith("blob:")) {
      try {
        sessionStorage.setItem(STORAGE_KEY, capturedImage);
        sessionStorage.setItem(STORAGE_TIME_KEY, String(Date.now()));
      } catch (e) {}
    }
    // Don't clear sessionStorage here - restore effect needs it. Clear only in handleRetake.
  }, [capturedImage]);

  // Restore from sessionStorage on mount (catches Strict Mode remount within 5s)
  useEffect(() => {
    if (capturedImage) return;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      const ts = sessionStorage.getItem(STORAGE_TIME_KEY);
      const age = ts ? Date.now() - parseInt(ts, 10) : Infinity;
      if (stored && age < 5000) {
        setCapturedImage(stored);
        capturedImageRef.current = stored;
      } else if (age >= 5000) {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_TIME_KEY);
      }
    } catch (e) {}
  }, [capturedImage]);

  // ============================================
  // CONSTANTS
  // ============================================
  const FRAME_ASPECT_RATIO = 575 / 920;
  const OUTPUT_WIDTH = 1150;
  const OUTPUT_HEIGHT = 1840;

  // ============================================
  // STOP CAMERA
  // ============================================
  const stopCamera = useCallback(() => {
    logger.log("stopCamera");
    
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ============================================
  // INIT CAMERA - No state dependencies
  // ============================================
  const initCamera = useCallback(async () => {
    // CRITICAL: Check ref, not state (avoids stale closure)
    if (capturedImageRef.current) {
      logger.log("initCamera: Already have captured image, skip");
      return;
    }
    
    if (isInitializingRef.current) {
      logger.log("initCamera: Already initializing, skip");
      return;
    }
    
    if (!isMountedRef.current) {
      logger.log("initCamera: Not mounted, skip");
      return;
    }

    isInitializingRef.current = true;
    logger.log("initCamera: Starting...");

    setCameraState("loading");
    setErrorMsg("");

    // Cleanup existing
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    await new Promise(r => setTimeout(r, 200));

    // Check again after delay
    if (!isMountedRef.current || capturedImageRef.current) {
      isInitializingRef.current = false;
      return;
    }

    try {
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
      if (devices.length > 0) setVideoDevices(devices);
      const idx = deviceIndexRef.current % Math.max(devices.length, 1);
      const selectedDevice = devices[idx];
      const videoConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        ...(selectedDevice?.deviceId
          ? { deviceId: { exact: selectedDevice.deviceId } }
          : { facingMode: "user" }),
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
      });

      // Check again after async
      if (!isMountedRef.current || capturedImageRef.current) {
        stream.getTracks().forEach(t => t.stop());
        isInitializingRef.current = false;
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await new Promise((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error("No video"));
            return;
          }

          const timeout = setTimeout(() => reject(new Error("Timeout")), 5000);

          if (video.readyState >= 2) {
            clearTimeout(timeout);
            resolve();
          } else {
            const onLoaded = () => {
              clearTimeout(timeout);
              video.removeEventListener("loadeddata", onLoaded);
              resolve();
            };
            video.addEventListener("loadeddata", onLoaded);
          }
        });

        // Final check
        if (isMountedRef.current && !capturedImageRef.current) {
          setCameraState("ready");
          logger.log("Camera ready");
        }
      }
    } catch (err) {
      logger.error("Camera error:", err);
      if (isMountedRef.current && !capturedImageRef.current) {
        setCameraState("error");
        setErrorMsg(err.message || "Camera failed");
      }
    } finally {
      isInitializingRef.current = false;
    }
  }, []); // EMPTY DEPS - uses only refs

  // ============================================
  // LIFECYCLE - Only run once on mount
  // ============================================
  useEffect(() => {
    isMountedRef.current = true;
    logger.log("CameraPage MOUNTED");

    // Only init camera if no captured image
    const initTimeout = setTimeout(() => {
      if (isMountedRef.current && !capturedImageRef.current && mode === "camera") {
        initCamera();
      }
    }, 100);

    return () => {
      logger.log("CameraPage UNMOUNTING");
      isMountedRef.current = false;
      clearTimeout(initTimeout);
      
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only on mount/unmount; initCamera is stable
  }, []);

  // Handle mode changes separately
  useEffect(() => {
    if (mode === "camera" && !capturedImageRef.current && !isInitializingRef.current) {
      const timeout = setTimeout(() => {
        if (isMountedRef.current && !capturedImageRef.current) {
          initCamera();
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [mode, initCamera]);

  // ============================================
  // CAPTURE PHOTO
  // ============================================
  const capturePhoto = useCallback(async () => {
    if (isCapturingRef.current) {
      logger.log("Already capturing, skip");
      return;
    }
    
    isCapturingRef.current = true;
    logger.log("capturePhoto: Start");

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      setErrorMsg("Camera not ready");
      isCapturingRef.current = false;
      return;
    }

    setIsProcessing(true);

    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      let sx, sy, sw, sh;
      if (vw / vh > FRAME_ASPECT_RATIO) {
        sh = vh;
        sw = vh * FRAME_ASPECT_RATIO;
        sx = (vw - sw) / 2;
        sy = 0;
      } else {
        sw = vw;
        sh = vw / FRAME_ASPECT_RATIO;
        sx = 0;
        sy = (vh - sh) / 2;
      }

      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;

      const ctx = canvas.getContext("2d");
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      ctx.restore();

      const blob = await new Promise((res, rej) => {
        canvas.toBlob(
          b => (b ? res(b) : rej(new Error("Blob failed"))),
          "image/jpeg",
          0.92
        );
      });

      logger.log("Blob created:", blob.size);

      // Stop camera - user sees "Processing..." until upload completes
      stopCamera();
      setCountdown(null);

      // Upload FIRST - only show result after success (prevents "refresh back to camera" bug)
      const fd = new FormData();
      fd.append("image", blob, "capture.jpg");

      const resp = await fetch(getApiUrl("/api/upload"), {
        method: "POST",
        body: fd,
      });

      if (!isMountedRef.current) {
        isCapturingRef.current = false;
        return;
      }

      if (!resp.ok) {
        throw new Error(`Upload failed: ${resp.status}`);
      }

      const data = await resp.json();
      logger.log("Upload done:", data.path);

      const fullPath = getImageUrl(data.path) || data.path;
      if (!fullPath) {
        throw new Error("Server did not return image path");
      }

      // Only set captured image AFTER successful upload - prevents flash/refresh bug
      setCapturedImage(fullPath);
      capturedImageRef.current = fullPath;
      setErrorMsg("");
      setIsProcessing(false);

      logger.log("Capture complete");

    } catch (err) {
      logger.error("Capture error:", err);
      setErrorMsg(err.message);
      setIsProcessing(false);
      // Restart camera so user can retry
      setTimeout(() => {
        if (isMountedRef.current && !capturedImageRef.current) {
          initCamera();
        }
      }, 300);
    } finally {
      isCapturingRef.current = false;
    }
  }, [stopCamera, initCamera, FRAME_ASPECT_RATIO]);

  // ============================================
  // COUNTDOWN
  // ============================================
  const startCountdown = useCallback(() => {
    if (cameraState !== "ready" || countdown !== null || isProcessing || isCapturingRef.current) {
      return;
    }

    logger.log("Countdown start");
    setCountdown(2);

    let captureTriggered = false;

    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          
          if (prev === 1 && !captureTriggered) {
            captureTriggered = true;
            setTimeout(capturePhoto, 50);
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cameraState, countdown, isProcessing, capturePhoto]);

  // ============================================
  // MODE SWITCH
  // ============================================
  const toggleMode = useCallback(() => {
    if (isProcessing || capturedImageRef.current) return;

    stopCamera();

    if (mode === "camera") {
      setMode("upload");
      setCameraState("loading");
    } else {
      setMode("camera");
      setCameraState("loading");
    }
    setErrorMsg("");
  }, [mode, isProcessing, stopCamera]);

  // ============================================
  // SWITCH CAMERA (front / external webcam)
  // ============================================
  const switchCamera = useCallback(() => {
    if (videoDevices.length < 2 || isProcessing) return;
    deviceIndexRef.current = (deviceIndexRef.current + 1) % videoDevices.length;
    setCurrentDeviceIndex(deviceIndexRef.current);
    stopCamera();
    setCameraState("loading");
    setErrorMsg("");
    setTimeout(() => {
      if (isMountedRef.current && !capturedImageRef.current && mode === "camera") {
        initCamera();
      }
    }, 200);
  }, [videoDevices.length, isProcessing, stopCamera, mode, initCamera]);

  // ============================================
  // FILE UPLOAD
  // ============================================
  const handleFileUpload = useCallback(async (file) => {
    if (!file || isProcessing) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file");
      return;
    }

    setIsProcessing(true);
    setErrorMsg("");

    try {
      const fd = new FormData();
      fd.append("image", file, file.name);

      const resp = await fetch(getApiUrl("/api/upload"), {
        method: "POST",
        body: fd,
      });

      if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);

      const data = await resp.json();
      const fullPath = getImageUrl(data.path) || data.path;
      
      setCapturedImage(fullPath);
      capturedImageRef.current = fullPath;

    } catch (err) {
      logger.error("Upload error:", err);
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode === "upload" && !isProcessing) setIsDragOver(true);
  }, [mode, isProcessing]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (mode !== "upload" || isProcessing) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileUpload(file);
  }, [mode, isProcessing, handleFileUpload]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [handleFileUpload]);

  // ============================================
  // NAVIGATION
  // ============================================
  const handleHome = useCallback(() => {
    stopCamera();
    navigate("/");
  }, [navigate, stopCamera]);

  const handleRetake = useCallback(() => {
    logger.log("RETAKE");

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    isCapturingRef.current = false;
    isInitializingRef.current = false;

    stopCamera();

    // Clear captured image in both state and ref + sessionStorage
    setCapturedImage(null);
    capturedImageRef.current = null;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_TIME_KEY);
    } catch (e) {}
    
    setCountdown(null);
    setIsProcessing(false);
    setErrorMsg("");
    setIsDragOver(false);
    setCameraState("loading");

    if (mode === "camera") {
      setTimeout(() => {
        if (isMountedRef.current && !capturedImageRef.current) {
          initCamera();
        }
      }, 200);
    }
  }, [mode, stopCamera, initCamera]);

  const handleNext = useCallback(() => {
    if (capturedImage) {
      stopCamera();
      navigate("/gender-selection", { state: { capturedImage } });
    }
  }, [navigate, capturedImage, stopCamera]);

  // ============================================
  // RENDER
  // ============================================
  
  // Show captured image view (only shown after successful upload)
  if (capturedImage) {
    return (
      <div className="flex flex-col min-h-screen" style={{ minHeight: '100dvh' }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/images/Ui_Ux_img/Theme.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-4">
          <div className="w-full max-w-xl h-[80vh] max-h-[80vh] flex flex-col items-center">
            <div className="w-full flex-1 min-h-0 bg-black rounded-2xl overflow-hidden shadow-2xl">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            </div>
            <div className="mt-4 flex flex-col items-center gap-4">
              {errorMsg && (
                <p className="text-red-400 text-sm text-center max-w-md">{errorMsg}</p>
              )}
              <div className="flex justify-center items-center gap-6">
                <button type="button" onClick={handleRetake} className="focus:outline-none hover:opacity-90">
                  <img src="/images/Ui_Ux_img/retake.fw.png" alt="Retake" className="h-12 md:h-14 w-auto" />
                </button>
                <button type="button" onClick={handleNext} className="focus:outline-none hover:opacity-90">
                  <img src="/images/Ui_Ux_img/next.fw.png" alt="Next" className="h-12 md:h-14 w-auto" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show camera/upload view
  return (
    <div className="flex flex-col min-h-screen" style={{ minHeight: '100dvh' }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/images/Ui_Ux_img/Theme.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="absolute top-6 left-6 z-20">
        <button type="button" onClick={handleHome} className="focus:outline-none hover:opacity-90">
          <img src="/images/Ui_Ux_img/home.fw.png" alt="Home" className="h-10 w-auto" />
        </button>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-4">
        <div
          className={`w-full max-w-xl h-[80vh] max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl relative bg-black ${
            isDragOver ? "ring-4 ring-purple-400" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {mode === "camera" && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full absolute inset-0 transition-opacity duration-300 ${
                  cameraState === "ready" && !isProcessing ? "opacity-100" : "opacity-0"
                }`}
                style={{ transform: "scaleX(-1)", objectFit: "cover" }}
              />

              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                  <span className="text-white text-8xl font-bold animate-pulse">{countdown}</span>
                </div>
              )}

              {cameraState === "loading" && !isProcessing && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent mx-auto mb-4" />
                    <p>Initializing camera...</p>
                  </div>
                </div>
              )}

              {cameraState === "error" && !isProcessing && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <div className="text-center p-6">
                    <p className="text-red-400 text-lg mb-4">{errorMsg || "Camera error"}</p>
                    <button
                      type="button"
                      onClick={() => {
                        isInitializingRef.current = false;
                        setCameraState("loading");
                        setTimeout(initCamera, 100);
                      }}
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {mode === "upload" && !isProcessing && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${isDragOver ? "bg-purple-900/50" : "bg-gray-900"}`}>
              <div className="text-6xl mb-6">{isDragOver ? "📥" : "📁"}</div>
              <h3 className="text-white text-2xl font-bold mb-2">{isDragOver ? "Drop here!" : "Upload Image"}</h3>
              <p className="text-gray-300 mb-6">Drag & drop or click below</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 bg-purple-500 text-white rounded-lg text-lg font-bold"
              >
                Select Image
              </button>
              {errorMsg && <p className="text-red-400 mt-4">{errorMsg}</p>}
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4" />
                <p className="text-xl">Processing...</p>
              </div>
            </div>
          )}

          <div className="absolute top-2 right-2 z-30 flex items-center gap-2">
            {mode === "camera" && videoDevices.length >= 2 && (
              <button
                type="button"
                onClick={switchCamera}
                disabled={isProcessing || cameraState === "loading"}
                className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-50 focus:outline-none"
                title={`Switch camera (${currentDeviceIndex + 1}/${videoDevices.length})`}
                aria-label="Switch camera"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button type="button" onClick={toggleMode} disabled={isProcessing} className="focus:outline-none disabled:opacity-50">
              <img src="/images/Ui_Ux_img/toggle.png" alt="Toggle" className="w-12 md:w-14 h-auto" draggable={false} />
            </button>
          </div>

          {mode === "camera" && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
              <button
                type="button"
                onClick={startCountdown}
                disabled={cameraState !== "ready" || countdown !== null || isProcessing}
                className="disabled:opacity-50"
              >
                <img src="/images/Ui_Ux_img/Capture_1.png" alt="Capture" className="w-36 h-36 md:w-44 md:h-44 object-contain" />
              </button>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} style={{ display: "none" }} />
    </div>
  );
};

export default CameraPage;