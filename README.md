# Virtual Try-On Application

A modern React application that integrates with the FitRoom API to provide virtual try-on functionality. Users can upload their photos and try on different outfits virtually, with results stored in Supabase and QR code generation for easy sharing.

## Features

- 📸 **Image Upload & Capture**: Upload images or capture photos directly from camera
- 👔 **Outfit Selection**: Choose from pre-loaded male and female outfits
- 🤖 **AI-Powered Try-On**: Integration with FitRoom API for realistic virtual try-on
- 📊 **Real-time Progress**: Live progress tracking during processing
- 💾 **Result Storage**: Automatic storage of results in Supabase
- 📱 **QR Code Generation**: Generate QR codes for easy result sharing
- 📈 **Status Tracking**: View all generated results and their status
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS

## Workflow

1. **Start**: User uploads or captures their photo
2. **Select Gender**: Choose between Male/Female
3. **Choose Outfit**: Select from pre-loaded outfits (m1-m6 for male, f1-f6 for female)
4. **Process**: AI processes the image with loading animation
5. **Result**: Display result with QR code and download options
6. **Store**: Automatically save to Supabase with generated URL

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- FitRoom API key
- Supabase account and project

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   REACT_APP_FITROOM_API_KEY=0d6d024237604008b379d140069c78af4aab62e7e08af632feec86f9a1d5339d
   REACT_APP_SUPABASE_URL=your-supabase-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Add outfit images**
   - Place male outfit images in `public/images/Male/` as `m1.jpg`, `m2.jpg`, etc.
   - Place female outfit images in `public/images/Female/` as `f1.jpg`, `f2.jpg`, etc.

5. **Set up Supabase**
   - Create a new Supabase project
   - Create a storage bucket named `tryon-images-2`
   - Create a table named `tryon_results` with the following structure:
   ```sql
   CREATE TABLE tryon_results (
     id SERIAL PRIMARY KEY,
     task_id TEXT,
     original_image_url TEXT,
     result_image_url TEXT,
     outfit_name TEXT,
     outfit_id TEXT,
     status TEXT,
     error_message TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

6. **Start the development server**
   ```bash
   npm start
   ```

## API Integration

The application integrates with the FitRoom API using the following endpoints:

- **Check Model Image**: `/api/tryon/input_check/v1/model`
- **Check Clothes Image**: `/api/tryon/input_check/v1/clothes`
- **Create Try-on Task**: `/api/tryon/v2/tasks`
- **Get Task Status**: `/api/tryon/v2/tasks/:id`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ImageUpload.js   # Image upload with drag & drop
│   ├── OutfitSelector.js # Outfit selection interface
│   ├── LoadingSpinner.js # Processing animation
│   ├── ResultDisplay.js  # Result display with QR code
│   └── StatusPage.js     # Status tracking page
├── pages/               # Page components
│   └── TryOnPage.js     # Main try-on workflow
├── services/            # API services
│   └── fitroomApi.js    # FitRoom API integration
├── config/              # Configuration files
│   └── supabase.js      # Supabase configuration
└── App.js               # Main application component
```

## Key Components

### ImageUpload
- Drag and drop functionality
- Camera capture support
- File validation and size limits
- Visual feedback for upload states

### OutfitSelector
- Gender-based outfit filtering
- Grid layout for outfit selection
- Visual selection indicators
- Responsive design

### LoadingSpinner
- Real-time progress tracking
- Status-based messaging
- Progress bar visualization
- Error handling display

### ResultDisplay
- Side-by-side comparison view
- QR code generation
- Download and share functionality
- Outfit details display

### StatusPage
- Complete result history
- Error tracking
- Image previews
- Link sharing capabilities

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_FITROOM_API_KEY` | FitRoom API authentication key | Yes |
| `REACT_APP_SUPABASE_URL` | Supabase project URL | Yes |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

## API Rate Limits

The FitRoom API has a rate limit of 60 requests per minute per API key. The application implements appropriate retry logic with exponential backoff.

## Error Handling

The application includes comprehensive error handling:

- **API Errors**: Network failures, authentication errors, rate limiting
- **Image Validation**: File size, format, and quality checks
- **Processing Errors**: Task failures, timeout handling
- **Storage Errors**: Supabase upload and database errors

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Mobile Support

The application is fully responsive and supports:
- Touch interactions
- Camera capture
- Mobile-optimized UI
- PWA capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions:
- Check the FitRoom API documentation
- Review the Supabase documentation
- Open an issue in the repository

## Changelog

### v1.0.0
- Initial release
- Complete virtual try-on workflow
- Supabase integration
- QR code generation
- Status tracking
- Modern UI with Tailwind CSS 