import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera } from 'lucide-react';

const ImageUpload = ({ onImageSelect, title, description, acceptedFileTypes }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onImageSelect(acceptedFiles[0]);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes || {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleCameraClick = () => {
    // Trigger file input for camera capture
    document.getElementById('camera-input').click();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <input
          id="camera-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            if (e.target.files?.length > 0) {
              onImageSelect(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Upload</span>
            </div>
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleCameraClick}
                className="flex flex-col items-center"
              >
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Camera</span>
              </button>
            </div>
          </div>

          {isDragActive ? (
            <p className="text-primary-600 font-medium">Drop the image here...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">
                Drag & drop an image here, or click to select
              </p>
              <p className="text-xs text-gray-500">
                Supports: JPEG, PNG, WebP (Max 10MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload; 