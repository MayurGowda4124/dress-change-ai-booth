// Single source of truth - use this frame everywhere
export const PHOTO_FRAME_SRC = '/images/Ui_Ux_img/Photo Frame_Portrait._bg5.png';

const FRAME_SRC = PHOTO_FRAME_SRC;

/**
 * Add the portrait photo frame to an image blob.
 * @param {Blob} imageBlob - Image as Blob (e.g. from file or canvas)
 * @returns {Promise<Blob>} - Framed image as PNG blob
 */
export function addPhotoFrame(imageBlob) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const frameImg = new Image();
    frameImg.crossOrigin = 'anonymous';
    frameImg.onload = () => {
      const capturedImg = new Image();
      capturedImg.crossOrigin = 'anonymous';
      capturedImg.onload = () => {
        canvas.width = frameImg.width;
        canvas.height = frameImg.height;

        ctx.drawImage(frameImg, 0, 0);

        const frameWidth = frameImg.width;
        const frameHeight = frameImg.height;
        // Small border so image uses most of frame; cover = scale to fill (larger visible image)
        const borderWidth = Math.min(frameWidth, frameHeight) * 0.02;
        const transparentAreaWidth = frameWidth - borderWidth * 2;
        const transparentAreaHeight = frameHeight - borderWidth * 2;

        const scaleX = transparentAreaWidth / capturedImg.width;
        const scaleY = transparentAreaHeight / capturedImg.height;
        // Use COVER: scale so image fills the area (larger); may crop edges
        const scale = Math.max(scaleX, scaleY);

        let scaledWidth = capturedImg.width * scale;
        let scaledHeight = capturedImg.height * scale;
        // Reduce to 70% of this size (height and width)
        const sizeFactor = 0.7;
        scaledWidth *= sizeFactor;
        scaledHeight *= sizeFactor;
        const x = borderWidth + (transparentAreaWidth - scaledWidth) / 2;
        const y = borderWidth + (transparentAreaHeight - scaledHeight) / 2;

        ctx.drawImage(capturedImg, x, y, scaledWidth, scaledHeight);

        // Use JPEG for smaller file size (FitRoom API has 10MB limit)
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
      };
      capturedImg.onerror = () => reject(new Error('Failed to load image'));
      if (imageBlob instanceof Blob) {
        capturedImg.src = URL.createObjectURL(imageBlob);
      } else if (typeof imageBlob === 'string' && imageBlob.startsWith('data:')) {
        capturedImg.src = imageBlob;
      } else {
        reject(new Error('Invalid image format'));
      }
    };
    frameImg.onerror = () => reject(new Error('Failed to load photo frame'));
    frameImg.src = FRAME_SRC;
  });
}
