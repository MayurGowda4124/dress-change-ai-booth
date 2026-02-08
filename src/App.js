import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import StartPage from './pages/StartPage';
import CameraPage from './pages/CameraPage';
import GenderSelectionPage from './pages/GenderSelectionPage';
import CostumeSelectionPage from './pages/CostumeSelectionPage';
import TryOnPage from './pages/TryOnPage';
import AdminPage from './pages/AdminPage';
import StatusPage from './components/StatusPage';
import ResultPage from './components/ResultPage';
import ImageExtractor from './components/ImageExtractor';
import ThemeWrapper from './components/ThemeWrapper';
import UploadTestPage from './pages/UploadTestPage';
import PrintPage from './pages/PrintPage';

function App() {
  return (
    <ErrorBoundary>
    <Router>
      <div className="min-h-screen">
        {/* Main Content */}
        <main>
          <ThemeWrapper>
            <Routes>
              <Route path="/" element={<StartPage />} />
              <Route path="/camera" element={<CameraPage />} />
              <Route path="/gender-selection" element={<GenderSelectionPage />} />
              <Route path="/costume-selection" element={<CostumeSelectionPage />} />
              <Route path="/try-on" element={<TryOnPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/result/:resultId" element={<ResultPage />} />
              <Route path="/image-extractor" element={<ImageExtractor />} />
              <Route path="/upload-test" element={<UploadTestPage />} />
              <Route path="/print" element={<PrintPage />} />
            </Routes>
          </ThemeWrapper>
        </main>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
    </ErrorBoundary>
  );
}

export default App; 