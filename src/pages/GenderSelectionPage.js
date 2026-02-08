import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const GenderSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const capturedImage = location.state?.capturedImage;

  const handleGenderSelect = (gender) => {
    navigate('/costume-selection', { 
      state: { 
        capturedImage,
        selectedGender: gender 
      } 
    });
  };

  const handleBack = () => {
    navigate('/camera', { state: { capturedImage } });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative z-10 flex flex-col min-h-screen justify-center items-center">
        <div className="absolute top-32 left-8">
          <button onClick={handleBack} className="focus:outline-none hover:opacity-90 transition-opacity" aria-label="Back">
            <img src="/images/Ui_Ux_img/back.fw.png" alt="Back" className="h-10 w-auto object-contain" />
          </button>
        </div>
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-black text-center drop-shadow-lg">Select Gender</h1>
        </div>
        <div className="flex items-center justify-center space-x-16 md:space-x-24">
          <div className="text-center">
            <button onClick={() => handleGenderSelect('male')} className="group hover:scale-105 transition-all duration-300">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden bg-white shadow-2xl border-4 border-white">
                <img src="/images/Ui_Ux_img/male_button_1.png" alt="Male" className="w-full h-full object-contain" />
              </div>
              <div className="mt-4 text-black text-2xl font-bold drop-shadow-lg">Male</div>
            </button>
          </div>
          <div className="text-center">
            <button onClick={() => handleGenderSelect('female')} className="group hover:scale-105 transition-all duration-300">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden bg-white shadow-2xl border-4 border-white">
                <img src="/images/Ui_Ux_img/female_button_1.png" alt="Female" className="w-full h-full object-contain" />
              </div>
              <div className="mt-4 text-black text-2xl font-bold drop-shadow-lg">Female</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenderSelectionPage; 