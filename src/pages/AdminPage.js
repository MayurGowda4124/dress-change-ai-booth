import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import logger from '../utils/logger';

const AdminPage = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      
      // Fetch results from local server
      const response = await fetch(getApiUrl('/api/results'));
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      
      const data = await response.json();
      logger.log('Fetched results:', data);
      
      // Transform the data to include status information
      const resultsWithStatus = (data?.results ?? []).map(result => ({
        id: result.filename,
        filename: result.filename,
        imagePath: result.path,
        status: result.status || 'success',
        timestamp: result.timestamp ? new Date(result.timestamp).toLocaleString() : new Date().toLocaleString(),
        error: result.error || null,
        size: result.size || null
      }));
      
      setResults(resultsWithStatus);
    } catch (err) {
      logger.error('Error fetching results:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchResults();
  };

  const handleBack = () => {
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'processing':
        return '⏳';
      default:
        return '❓';
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Theme Background */}
      <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url('/images/Ui_Ux_img/Theme.png')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center p-6 pt-8">
          <button onClick={handleBack} className="focus:outline-none hover:opacity-90 transition-opacity" aria-label="Back">
            <img src="/images/Ui_Ux_img/back.fw.png" alt="Back" className="h-10 w-auto object-contain" />
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-black text-center drop-shadow-lg">Admin Dashboard</h1>
          <button 
            onClick={handleRefresh}
            className="text-black text-xl font-bold hover:text-gray-600 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 pb-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-black text-lg">Loading results...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-red-600 font-medium">Error: {error}</p>
              <button
                onClick={handleRefresh}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-lg border">
                  <h3 className="text-lg font-semibold text-gray-800">Total Attempts</h3>
                  <p className="text-3xl font-bold text-blue-600">{results.length}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-lg border">
                  <h3 className="text-lg font-semibold text-gray-800">Successful</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {results.filter(r => r.status === 'success').length}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-lg border">
                  <h3 className="text-lg font-semibold text-gray-800">Failed</h3>
                  <p className="text-3xl font-bold text-red-600">
                    {results.filter(r => r.status === 'failed').length}
                  </p>
                </div>
              </div>

              {/* Results List */}
              <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Try-On Results</h2>
                </div>
                
                {results.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 text-lg">No results found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {results.map((result, index) => (
                      <div key={result.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col lg:flex-row gap-4">
                          {/* Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={result.imagePath}
                              alt={`Result ${index + 1}`}
                              className="w-32 h-32 object-cover rounded-lg border"
                              onError={(e) => {
                                e.target.src = '/images/placeholder.jpg';
                                e.target.alt = 'Image not available';
                              }}
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-800">
                                {result.filename}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(result.status)}`}>
                                {getStatusIcon(result.status)} {result.status}
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              <p><strong>Timestamp:</strong> {result.timestamp}</p>
                              <p><strong>File:</strong> {result.filename}</p>
                              <p><strong>Path:</strong> {result.imagePath}</p>
                              
                              {result.error && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                                  <p className="text-red-800 font-medium">Error Details:</p>
                                  <p className="text-red-700 text-sm">{result.error}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 