import React from 'react';

const ThemeWrapper = ({ children }) => {
  return (
    <div
      className="min-h-screen relative overflow-x-hidden overflow-y-auto"
      style={{
        backgroundImage: `url('/images/Ui_Ux_img/Theme.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top, 0)',
      }}
    >
      {/* Main Content */}
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
};

export default ThemeWrapper; 