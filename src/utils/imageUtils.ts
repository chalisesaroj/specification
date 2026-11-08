export interface CompressedImage {
  dataUrl: string;
  width: number;
  height: number;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The selected file is not a valid image.'));
    img.src = src;
  });
}

/**
 * Downscales and re-encodes an uploaded photograph so that 4-6 photos can be
 * stored in the document JSON (localStorage / Supabase) and embedded in the PDF
 * without bloating the file.
 */
export async function compressImage(
  file: File,
  maxDimension = 1100,
  quality = 0.72
): Promise<CompressedImage> {
  const original = await readFileAsDataUrl(file);
  const img = await loadImage(original);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const longest = Math.max(width, height);
  if (longest > maxDimension) {
    const scale = maxDimension / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dataUrl: original, width, height };

  // White background prevents transparent PNGs from turning black in the PDF.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', quality),
    width,
    height,
  };
}
