import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTryOnResults } from '../config/supabase';
import { getGalleryImagesFromStorage } from '../services/supabaseImageService';

const PrintPage = () => {
  const navigate = useNavigate();
  const printRef = useRef(null);
  const [results, setResults] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      // If tryon_results table doesn't exist, use [] so we still show storage results
      const [dbResults, storageResults] = await Promise.all([
        getTryOnResults().catch((err) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Print gallery: tryon_results table not available, using storage only:', err?.message);
          }
          return [];
        }),
        getGalleryImagesFromStorage().catch(() => [])
      ]);
      const dbList = Array.isArray(dbResults) ? dbResults : [];
      const storageList = Array.isArray(storageResults) ? storageResults : [];
      const seenUrls = new Set(dbList.map(r => r.result_image_url).filter(Boolean));
      const fromStorage = storageList.filter(r => r.result_image_url && !seenUrls.has(r.result_image_url));
      const merged = [...dbList, ...fromStorage];
      setResults(merged);
      setSelectedIds(new Set());
    } catch (err) {
      setResults([]);
      setError(err?.message || 'Failed to load images. Check Supabase URL and anon key in .env.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Print gallery fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(results.filter(r => r.result_image_url).map(r => r.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handlePrint = () => {
    const toPrint = results.filter(r => selectedIds.has(r.id) && r.result_image_url);
    if (toPrint.length === 0) {
      alert('Select at least one image to print.');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print</title>
          <style>
            @page { margin: 0; size: portrait; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { margin: 0; padding: 0; }
            .print-item {
              width: 100vw;
              height: 100vh;
              page-break-after: always;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .print-item:last-child { page-break-after: auto; }
            .print-item img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            }
          </style>
        </head>
        <body>
          ${toPrint.map(r => `
            <div class="print-item">
              <img src="${r.result_image_url}" alt="" crossorigin="anonymous" />
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen relative">
        <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url('/images/Ui_Ux_img/Theme.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative z-10 flex flex-1 items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
          <p className="ml-4 text-black text-lg">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen relative">
        <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url('/images/Ui_Ux_img/Theme.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center min-h-screen p-6">
          <p className="text-red-600 text-lg mb-2 text-center max-w-md">{error}</p>
          <p className="text-black/70 text-sm mb-4 text-center max-w-md">Ensure .env has REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY, and the tryon_results table exists in Supabase.</p>
          <div className="flex gap-3">
            <button onClick={fetchResults} className="px-6 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700">Retry</button>
            <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">Back</button>
          </div>
        </div>
      </div>
    );
  }

  const withImages = results.filter(r => r.result_image_url);
  const selectedCount = selectedIds.size;

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url('/images/Ui_Ux_img/Theme.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 md:p-6 pt-24">
          <button onClick={handleBack} className="focus:outline-none hover:opacity-90 transition-opacity" aria-label="Back">
            <img src="/images/Ui_Ux_img/back.fw.png" alt="Back" className="h-10 w-auto object-contain" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-black drop-shadow-lg">Print Gallery</h1>
          <div className="w-10" />
        </div>

        {/* Toolbar */}
        <div className="px-4 md:px-6 flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-black/80 text-white rounded-lg text-sm font-medium hover:bg-black"
          >
            Select all
          </button>
          <button
            onClick={deselectAll}
            className="px-4 py-2 bg-black/60 text-white rounded-lg text-sm font-medium hover:bg-black/80"
          >
            Deselect all
          </button>
          <span className="text-black/80 text-sm">
            {selectedCount} of {withImages.length} selected
          </span>
          <button
            onClick={handlePrint}
            disabled={selectedCount === 0}
            className="ml-auto px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-700"
          >
            Print selected
          </button>
        </div>

        {/* Gallery */}
        <div className="flex-1 px-4 md:px-6 pb-12">
          {withImages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-black/80 text-lg">No processed images yet.</p>
              <p className="text-black/60 mt-2">Complete a try-on to see results here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {withImages.map((result) => {
                const isSelected = selectedIds.has(result.id);
                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => toggleSelect(result.id)}
                    className={`relative rounded-xl overflow-hidden border-4 transition-all text-left focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isSelected ? 'border-amber-500 ring-2 ring-amber-500' : 'border-white/50 hover:border-black/30'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-black/20">
                      <img
                        src={result.result_image_url}
                        alt={result.outfit_name || 'Result'}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
                      {isSelected ? (
                        <span className="text-amber-600 text-lg">✓</span>
                      ) : (
                        <span className="text-black/40 text-lg">○</span>
                      )}
                    </div>
                    {(result.outfit_name || result.created_at) && (
                      <div className="p-2 bg-white/90 text-black text-xs truncate">
                        {result.outfit_name || ''} {result.created_at ? new Date(result.created_at).toLocaleDateString() : ''}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div ref={printRef} className="hidden" aria-hidden="true" />
    </div>
  );
};

export default PrintPage;
