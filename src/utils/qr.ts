import QRCode from 'qrcode';
import jsQR from 'jsqr';

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      scale: 10,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

export function decodeQrFromImageData(imageData: ImageData): string | null {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    if (code && code.data) {
      return code.data;
    }
  } catch (err) {
    console.error('QR decode error:', err);
  }
  return null;
}

export async function decodeQrFromImageFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = decodeQrFromImageData(imageData);
        resolve(decoded);
      };
      img.onerror = () => resolve(null);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function parseInventoryIdFromQR(qrContent: string): string | null {
  if (!qrContent) return null;
  const trimmed = qrContent.trim();

  // 1. Matches URL pathname like https://ais-pre-.../item/SOLK-000001 or /i/SOLK-000001
  const urlPathMatch = trimmed.match(/\/(?:item|i)\/([A-Za-z0-9_-]+)/i);
  if (urlPathMatch && urlPathMatch[1]) {
    return urlPathMatch[1].toUpperCase();
  }

  // 2. Matches hash route: .../#item=SOLK-000001 or .../#/item/SOLK-000001
  if (trimmed.includes('#item=')) {
    const parts = trimmed.split('#item=');
    const id = parts[1] ? parts[1].split('&')[0].trim() : null;
    if (id) return id.toUpperCase();
  }
  const hashPathMatch = trimmed.match(/#\/?(?:item|i)\/([A-Za-z0-9_-]+)/i);
  if (hashPathMatch && hashPathMatch[1]) {
    return hashPathMatch[1].toUpperCase();
  }

  // 3. Matches query parameter: ...?item=SOLK-000001
  const queryMatch = trimmed.match(/[?&]item=([A-Za-z0-9_-]+)/i);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1].toUpperCase();
  }

  // 4. Matches legacy format: INVENTORY_ITEM:SOLK-000001
  if (trimmed.startsWith('INVENTORY_ITEM:')) {
    return trimmed.replace('INVENTORY_ITEM:', '').trim().toUpperCase();
  }

  // 5. Matches inventory ID pattern e.g. SOLK-000001 or ASSET-1234
  const codeMatch = trimmed.match(/[A-Z0-9]{2,8}-\d{3,8}/i);
  if (codeMatch) {
    return codeMatch[0].toUpperCase();
  }

  return trimmed;
}
