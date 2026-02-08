import React, { useState } from 'react';
import { User, Users } from 'lucide-react';

const ModelSelector = ({ onModelSelect, selectedModel }) => {
  const [gender, setGender] = useState('male');
  const [selectedModelId, setSelectedModelId] = useState(selectedModel?.id || null);

  const models = {
    male: [
      { id: 'm1', name: 'Male Model 1', image: '/images/Male/IMG-20250729-WA0001.jpg' },
      { id: 'm2', name: 'Male Model 2', image: '/images/Male/IMG-20250729-WA0002.jpg' },
      { id: 'm3', name: 'Male Model 3', image: '/images/Male/IMG-20250729-WA0003.jpg' },
      { id: 'm4', name: 'Male Model 4', image: '/images/Male/IMG-20250729-WA0004.jpg' },
      { id: 'm5', name: 'Male Model 5', image: '/images/Male/IMG-20250729-WA0009.jpg' },
      { id: 'm6', name: 'Male Model 6', image: '/images/Male/mtrail1.jpg' },
      { id: 'm7', name: 'Male Model 7', image: '/images/Male/mtrail2.jpg' },
      { id: 'm8', name: 'Male Model 8', image: '/images/Male/mtrail3.jpg' },
    ],
    female: [
      { id: 'f1', name: 'Female Model 1', image: '/images/Female/femaletrail1.jpg' },
      { id: 'f2', name: 'Female Model 2', image: '/images/Female/femaletrail2.jpg' },
      { id: 'f3', name: 'Female Model 3', image: '/images/Female/femaletrail3.jpg' },
      { id: 'f4', name: 'Female Model 4', image: '/images/Female/femaletrail4.jpg' },
      { id: 'f5', name: 'Female Model 5', image: '/images/Female/ffemface.jpg' },
    ],
  };

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    setSelectedModelId(null);
    onModelSelect(null);
  };

  const handleModelSelect = (model) => {
    setSelectedModelId(model.id);
    onModelSelect(model);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Choose Your Model</h3>
        <p className="text-gray-600">Select a gender and then choose a model to try on clothes</p>
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

      {/* Model Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {models[gender].map((model) => (
          <div
            key={model.id}
            onClick={() => handleModelSelect(model)}
            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 card-hover ${
              selectedModelId === model.id
                ? 'border-primary-500 ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              <img
                src={model.image}
                alt={model.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling?.style) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
              <div className="hidden items-center justify-center text-gray-400">
                <span className="text-sm">{model.name}</span>
              </div>
            </div>
            <div className="p-3 bg-white">
              <p className="text-sm font-medium text-gray-800 truncate">
                {model.name}
              </p>
            </div>
            {selectedModelId === model.id && (
              <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedModelId && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Selected: <span className="font-medium text-primary-600">
              {models[gender].find(m => m.id === selectedModelId)?.name}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ModelSelector; 