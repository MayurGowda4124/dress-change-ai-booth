import React, { useState } from 'react';
import { User, Users } from 'lucide-react';

const OutfitSelector = ({ onOutfitSelect, selectedOutfit }) => {
  const [gender, setGender] = useState('male');
  const [selectedOutfitId, setSelectedOutfitId] = useState(selectedOutfit?.id || null);

  const outfits = {
    male: [
      { id: 'm1', name: 'Casual T-Shirt', image: '/images/Male/m1.jpg' },
      { id: 'm2', name: 'Formal Shirt', image: '/images/Male/m2.jpg' },
      { id: 'm3', name: 'Jacket', image: '/images/Male/m3.jpg' },
      { id: 'm4', name: 'Sweater', image: '/images/Male/m4.jpg' },
      { id: 'm5', name: 'Traditional Male 5', image: '/images/Male/m5.jpg' },
      { id: 'm6', name: 'Traditional Male 6', image: '/images/Male/m6.jpg' },
    ],
    female: [
      { id: 'f1', name: 'Casual Top', image: '/images/Female/f1.jpg' },
      { id: 'f2', name: 'Blouse', image: '/images/Female/f2.jpg' },
      { id: 'f3', name: 'Dress', image: '/images/Female/f3.jpg' },
      { id: 'f4', name: 'Sweater', image: '/images/Female/f4.jpg' },
      { id: 'f5', name: 'Jacket', image: '/images/Female/f5.jpg' },
      { id: 'f6', name: 'Tunic', image: '/images/Female/f6.jpg' },
      { id: 'f7', name: 'Casual Dress', image: '/images/Female/f7.jpg' },
    ],
  };

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    setSelectedOutfitId(null);
    onOutfitSelect(null);
  };

  const handleOutfitSelect = (outfit) => {
    setSelectedOutfitId(outfit.id);
    onOutfitSelect(outfit);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Choose Your Outfit</h3>
        <p className="text-gray-600">Select a gender and then choose an outfit to try on</p>
      </div>

      {/* Gender Selection */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleGenderChange('male')}
            className={`flex items-center px-6 py-3 rounded-md transition-all duration-200 ${
              gender === 'male'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <User className="w-5 h-5 mr-2" />
            Male
          </button>
          <button
            onClick={() => handleGenderChange('female')}
            className={`flex items-center px-6 py-3 rounded-md transition-all duration-200 ${
              gender === 'female'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            Female
          </button>
        </div>
      </div>

      {/* Outfit Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {outfits[gender].map((outfit) => (
          <div
            key={outfit.id}
            onClick={() => handleOutfitSelect(outfit)}
            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 card-hover ${
              selectedOutfitId === outfit.id
                ? 'border-primary-500 ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              <img
                src={outfit.image}
                alt={outfit.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling?.style) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
              <div className="hidden items-center justify-center text-gray-400">
                <span className="text-sm">{outfit.name}</span>
              </div>
            </div>
            <div className="p-3 bg-white">
              <p className="text-sm font-medium text-gray-800 truncate">
                {outfit.name}
              </p>
            </div>
            {selectedOutfitId === outfit.id && (
              <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedOutfitId && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Selected: <span className="font-medium text-primary-600">
              {outfits[gender].find(o => o.id === selectedOutfitId)?.name}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default OutfitSelector; 