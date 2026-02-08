import React from 'react';
import { useNavigate } from 'react-router-dom';

const StartPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/camera');
  };

  return (
    <div 
      className="relative w-screen min-h-screen overflow-x-hidden overflow-y-auto"
      style={{
        backgroundColor: '#f5e6d3',
        minHeight: '100dvh',
      }}
    >
      {/* Background Image - Full Screen */}
      <img
        src="/images/Ui_Ux_img/Home_page.png"
        alt="Home Page Background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          // Align to top so the top part is fully visible; bottom may crop instead of top
          objectPosition: 'top center'
        }}
      />
      
      {/* Visible Start button - centered */}
      <button
        onClick={handleStart}
        className="absolute left-1/2 top-[70%] -translate-x-1/2 -translate-y-1/2 p-0 border-0 bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Start"
      >
        <img
          src="/images/Ui_Ux_img/Start_Button.png"
          alt="Start"
          className="w-[12.15rem] h-[12.15rem] md:w-[14.85rem] md:h-[14.85rem] object-contain pointer-events-none"
        />
      </button>
    </div>
  );
};

export default StartPage;