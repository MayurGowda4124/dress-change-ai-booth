import React from 'react';

const LoadingSpinner = ({ progress, status, message }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-64">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
        {progress !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-600">{progress}%</span>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {status === 'CREATED' && 'Initializing...'}
          {status === 'PROCESSING' && 'Processing Your Image...'}
          {status === 'COMPLETED' && 'Almost Done...'}
        </h3>
        
        <p className="text-gray-600 mb-4">
          {message || 'Please wait while we process your virtual try-on request...'}
        </p>
        
        {progress !== undefined && (
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500">
          This may take a few minutes depending on the image complexity
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 