/**
 * Safely saves JSON data to localStorage without throwing QuotaExceededError
 */
export const safeSetLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`LocalStorage quota exceeded for ${key}. Attempting payload optimization...`);
    try {
      // Strip large data:image URLs to save space
      const sanitized = JSON.parse(
        JSON.stringify(data, (k, val) => {
          if (typeof val === 'string' && val.startsWith('data:image/') && val.length > 5000) {
            return undefined; // strip heavy base64 strings in local storage backup
          }
          return val;
        })
      );
      localStorage.setItem(key, JSON.stringify(sanitized));
    } catch (retryErr) {
      console.error(`Failed to save ${key} to localStorage:`, retryErr);
    }
  }
};

/**
 * Resizes an uploaded image File to max 300x300 canvas to prevent huge base64 strings
 */
export const compressImageFile = (
  file: File,
  maxWidth: number = 300,
  maxHeight: number = 300,
  quality: number = 0.85
): Promise<{ file: File; dataUrl: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve({ file: compressedFile, dataUrl });
            } else {
              resolve({ file, dataUrl: e.target?.result as string });
            }
          }, 'image/jpeg', quality);
        } else {
          resolve({ file, dataUrl: e.target?.result as string });
        }
      };
      img.onerror = () => {
        resolve({ file, dataUrl: e.target?.result as string });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
