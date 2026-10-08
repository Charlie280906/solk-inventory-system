import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import jsQR from 'jsqr';
import { decodeQrFromImageFile, parseInventoryIdFromQR } from '../utils/qr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemFound: (inventoryId: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onItemFound,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access not supported on this browser. You can upload an image or enter the ID manually.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setCameraActive(true);
        scanFrame();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access was denied or is unavailable. Please upload a photo containing the QR code or type the Inventory ID.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      const invId = parseInventoryIdFromQR(code.data);
      if (invId) {
        stopCamera();
        onItemFound(invId);
        onClose();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecoding(true);
    const decoded = await decodeQrFromImageFile(file);
    setIsDecoding(false);

    if (decoded) {
      const invId = parseInventoryIdFromQR(decoded);
      if (invId) {
        stopCamera();
        onItemFound(invId);
        onClose();
        return;
      }
    } else {
      alert('Could not detect a QR code in the uploaded image. Please try another photo or enter the inventory ID directly.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const cleanId = manualInput.trim().toUpperCase();
    stopCamera();
    onItemFound(cleanId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Scan Inventory QR Code</h3>
              <p className="text-[11px] text-slate-400">Point camera at physical item label</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport / Error State */}
        <div className="relative aspect-square w-full bg-slate-900 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Target Reticle Overlay */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-blue-400/80 rounded-2xl relative animate-pulse shadow-lg">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 rounded-tl -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 rounded-tr -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 rounded-bl -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 rounded-br -mb-1 -mr-1"></div>
              </div>
            </div>
          )}

          {/* Camera Error / Fallback State */}
          {!cameraActive && (
            <div className="p-6 text-center text-slate-300 max-w-xs space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto stroke-1" />
              <p className="text-xs text-slate-300 leading-relaxed">
                {cameraError || 'Initializing device camera...'}
              </p>
              <button
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Alternative options: Image Upload or Manual ID Entry */}
        <div className="p-5 bg-slate-50 border-t border-slate-200/80 space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>{isDecoding ? 'Decoding...' : 'Upload QR Image'}</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isDecoding}
              />
            </label>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-slate-50 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute">
              or enter ID
            </span>
          </div>

          {/* Manual ID Input */}
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. SOLK-000001"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 font-mono text-xs uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Lookup
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
