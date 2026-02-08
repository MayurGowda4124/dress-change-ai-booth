import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Calendar, Clock } from 'lucide-react';
import { getTryOnResults } from '../config/supabase';

const StatusPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const data = await getTryOnResults();
      setResults(data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch results');
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching results:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'PROCESSING':
        return 'text-yellow-600 bg-yellow-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchResults}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Try-On Status</h1>
          <p className="text-gray-600">Track all your virtual try-on results</p>
        </div>
        <button
          onClick={fetchResults}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Results Yet</h3>
          <p className="text-gray-600">Start your first virtual try-on to see results here</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Try-On #{result.id}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        result.status
                      )}`}
                    >
                      {result.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(result.created_at)}
                    </div>
                    {result.outfit_name && (
                      <span>Outfit: {result.outfit_name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {result.original_image_url && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Original Image</p>
                    <div className="relative rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={result.original_image_url}
                        alt="Original"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>
                )}
                
                {result.result_image_url && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Result Image</p>
                    <div className="relative rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={result.result_image_url}
                        alt="Result"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {result.result_image_url && (
                    <button
                      onClick={() => window.open(result.result_image_url, '_blank')}
                      className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Result
                    </button>
                  )}
                  
                  {result.result_image_url && (
                    <button
                      onClick={() => copyToClipboard(result.result_image_url)}
                      className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Copy Link
                    </button>
                  )}
                </div>

                {result.error_message && (
                  <div className="text-sm text-red-600">
                    Error: {result.error_message}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusPage; 