import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadImageWithDailyFolder } from '../services/supabaseImageService';
import { saveTryOnResult } from '../config/supabase';
import { addPhotoFrame } from '../utils/photoFrame';

export default function UploadTestPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(''); // 'frame' | 'upload' | ''
  const [error, setError] = useState('');

  const previewUrl = useMemo(() => {
    if (!file) return '';
    return URL.createObjectURL(file);
  }, [file]);

  const onUpload = async () => {
    setError('');

    if (!file) {
      setError('Pick an image first.');
      return;
    }

    try {
      setBusy(true);

      setStep('frame');
      const framedBlob = await addPhotoFrame(file);
      const framedFile = new File([framedBlob], 'framed.png', { type: 'image/png' });

      setStep('upload');
      const res = await uploadImageWithDailyFolder(framedFile, 'png');
      if (!res?.success) throw new Error(res?.error || 'Upload failed');

      // Save to tryon_results so test uploads appear in Print gallery
      try {
        await saveTryOnResult({
          result_image_url: res.publicUrl,
          outfit_name: 'Test Upload',
          model_name: 'Upload',
          cloth_type: 'upload',
          status: 'COMPLETED',
          created_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Could not save test upload to gallery (table may not exist):', dbErr);
        }
      }

      navigate('/result/upload', { state: { resultImageUrl: res.publicUrl } });
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
      setStep('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-black/10 p-6">
        <h2 className="text-2xl font-bold text-black">Supabase Upload Test</h2>
        <p className="text-black/70 mt-1">
          Upload an image: the portrait frame is applied, then the framed image is uploaded to Supabase. You are taken to the result page with a QR code to download.
        </p>

        <div className="mt-5">
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-black file:text-white hover:file:bg-black/90"
          />
        </div>

        {previewUrl && (
          <div className="mt-5">
            <div className="text-sm text-black/70 mb-2">Preview</div>
            <img
              src={previewUrl}
              alt="preview"
              className="w-full max-h-[360px] object-contain rounded-xl border border-black/10 bg-white"
            />
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={onUpload}
            disabled={!file || busy}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-700"
          >
            {busy
              ? step === 'frame'
                ? 'Adding frame…'
                : 'Uploading…'
              : 'Add frame & upload to Supabase'}
          </button>

          <div className="text-sm text-black/60">
            Frame is applied, then image is uploaded; result page shows QR.
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 whitespace-pre-wrap">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

