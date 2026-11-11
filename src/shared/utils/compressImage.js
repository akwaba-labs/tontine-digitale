// Réduit une photo avant envoi (connexions lentes) : 1280 px max, JPEG qualité 0,8.
const MAX_DIMENSION = 1280;
const QUALITY = 0.8;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image illisible.'));
    };
    image.src = url;
  });
}

export async function compressImage(file, maxDimension = MAX_DIMENSION) {
  const image = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
  if (!blob) throw new Error('Compression impossible.');
  return blob;
}
