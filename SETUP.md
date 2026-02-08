# Dress Change AI Booth - Setup Guide

## Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

## Backend Setup

### 1. Install Backend Dependencies
```bash
npm install
```

### 2. Start the Backend Server
```bash
npm start
```

The server will start on `http://localhost:5000` and create the `public/Images_input` directory automatically.

## Frontend Setup

### 1. Install Frontend Dependencies
```bash
cd src
npm install
```

### 2. Start the React Development Server
```bash
npm start
```

The React app will start on `http://localhost:3000`

## How It Works

### Image Capture and Storage
1. When you capture an image in the camera page, it's automatically uploaded to the server
2. The image is saved to `public/Images_input/` with a unique filename
3. The image path (e.g., `/Images_input/capture-1234567890.jpg`) is passed to the outfit selection page
4. The outfit selection page can load the image using this path

### File Structure
```
project/
├── server.js                 # Backend server
├── package.json              # Backend dependencies
├── public/
│   └── Images_input/         # Saved captured images
└── src/                      # React frontend
    ├── pages/
    │   ├── CameraPage.js     # Camera functionality
    │   └── TryOnPage.js      # Outfit selection
    └── ...
```

### API Endpoints
- `POST /api/upload` - Upload captured images
- `GET /api/images` - Get list of uploaded images
- `DELETE /api/images/:filename` - Delete an image

## Troubleshooting

### Backend Issues
1. **Port 5000 already in use**: Change the PORT in server.js
2. **Permission denied**: Make sure you have write permissions to the project directory
3. **CORS errors**: The server is configured to allow requests from localhost:3000

### Frontend Issues
1. **Upload fails**: Make sure the backend server is running on port 5000
2. **Images not loading**: Check that the image paths are correct and the server is serving static files

### Image Storage
- Images are saved with unique timestamps to prevent conflicts
- Old images are automatically deleted when you retake a photo
- The server creates the Images_input directory if it doesn't exist

## Development

### Backend Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
The React app will auto-reload when you make changes.

## Production Deployment

For production, you'll need to:
1. Build the React app: `npm run build`
2. Serve the built files from the backend
3. Configure environment variables for production settings
4. Set up proper CORS for your domain 