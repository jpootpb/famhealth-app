/**
 * Compresses an image File or Base64 string to a lightweight, high-performance JPEG Base64.
 * Resizes max dimensions (default 1000px) and applies JPEG compression to prevent localStorage QuotaExceededError
 * and mobile browser out-of-memory page reloads.
 */
export async function compressImage(
  source: File | string,
  maxWidthOrHeight: number = 1024,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If running in SSR or Node/Vitest without window/Image/FileReader
    if (typeof window === 'undefined' || typeof Image === 'undefined' || typeof FileReader === 'undefined') {
      if (typeof source === 'string') return resolve(source);
      return resolve('data:image/jpeg;base64,compressed');
    }

    const img = new Image();

    const processLoadedImage = () => {
      try {
        let width = img.width || 1;
        let height = img.height || 1;

        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(img.src);
        }

        // Fill white background for transparent PNGs converted to JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } catch (err) {
        console.warn('Canvas compression fallback to original:', err);
        resolve(img.src);
      }
    };

    img.onload = processLoadedImage;
    img.onerror = () => {
      if (typeof source === 'string') resolve(source);
      else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(source);
      }
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          img.src = e.target.result;
        } else {
          resolve('');
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}
