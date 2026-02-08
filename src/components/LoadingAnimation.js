import React from 'react';

const LoadingAnimation = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-70">
      {/* Animation container */}
      <div className="flex space-x-3 mb-8">
        {/* 5 animated dots/sticks */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 bg-white rounded-full animate-wave"
            style={{ 
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.5s'
            }}
          ></div>
        ))}
      </div>
      
      {/* Message */}
      <p className="text-white text-2xl md:text-3xl font-bold text-center px-4">
        Hang tight, we're sprinkling some AI magic on your look!
      </p>
    </div>
  );
};

export default LoadingAnimation; 