#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎉 Welcome to Virtual Try-On App Setup!');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!');
  } else {
    console.log('❌ env.example file not found. Please create it manually.');
  }
} else {
  console.log('✅ .env file already exists.');
}

// Check if images directory exists
const maleImagesPath = path.join(__dirname, 'public', 'images', 'Male');
const femaleImagesPath = path.join(__dirname, 'public', 'images', 'Female');

if (!fs.existsSync(maleImagesPath)) {
  console.log('📁 Creating Male images directory...');
  fs.mkdirSync(maleImagesPath, { recursive: true });
}

if (!fs.existsSync(femaleImagesPath)) {
  console.log('📁 Creating Female images directory...');
  fs.mkdirSync(femaleImagesPath, { recursive: true });
}

console.log('\n📋 Next Steps:');
console.log('1. Edit .env file and add your API keys');
console.log('2. Add outfit images to public/images/Male/ and public/images/Female/');
console.log('3. Set up your Supabase project');
console.log('4. Run "npm install" to install dependencies');
console.log('5. Run "npm start" to start the development server');
console.log('\n📚 Check README.md for detailed setup instructions.');

console.log('\n🎯 Setup complete! Happy coding! 🚀'); 