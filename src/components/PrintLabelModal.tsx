import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Sparkles, Tag, Smartphone } from 'lucide-react';
import { Item } from '../types/inventory';
import { generateQrDataUrl } from '../utils/qr';

interface PrintLabelModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintLabelModal: React.FC<PrintLabelModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [liveQrData, setLiveQrData] = useState<string>('');

  const liveUrl = item
    ? `${window.location.origin}/item/${item.inventory_id}`
    : '';

  useEffect(() => {
    if (item && liveUrl) {
      generateQrDataUrl(liveUrl).then((url) => {
        setLiveQrData(url || item.qr_code_data || '');
      });
    }
  }, [item, liveUrl]);

  if (!isOpen || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    const dataToDownload = liveQrData || item.qr_code_data;
    if (!dataToDownload) return;
    const a = document.createElement('a');
    a.href = dataToDownload;
    a.download = `Label_${item.inventory_id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between no-print">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Print Asset Label</h3>
            <p className="text-[11px] text-slate-400">Physical adhesive label (70mm × 36mm) • Scannable with any smartphone camera</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Label Preview (What will print) */}
        <div className="p-8 bg-slate-50 flex flex-col items-center justify-center gap-4">
          <div
            id="printable-label"
            className="bg-white border-2 border-slate-900 rounded-xl p-4 w-[350px] shadow-sm flex items-center gap-4 text-slate-900 print:shadow-none print:border-black"
          >
            {/* High-res QR code */}
            <div className="shrink-0 bg-white p-1 rounded-lg border border-slate-200">
              {liveQrData || item.qr_code_data ? (
                <img
                  src={liveQrData || item.qr_code_data}
                  alt={item.inventory_id}
                  className="w-24 h-24 object-contain"
                />
              ) : (
                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-xs">
                  No QR
                </div>
              )}
            </div>

            {/* Label Meta */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-24">
              <div>
                <span className="font-mono font-extrabold text-sm tracking-wider text-slate-900 block border-b border-slate-200 pb-0.5">
                  {item.inventory_id}
                </span>
                <h4 className="font-bold text-xs text-slate-900 leading-tight line-clamp-2 mt-1">
                  {item.name}
                </h4>
              </div>

              <div className="text-[10px] text-slate-500 space-y-0.5">
                {(item.brand || item.model) && (
                  <div className="truncate font-medium text-slate-700">
                    {[item.brand, item.model].filter(Boolean).join(' • ')}
                  </div>
                )}
                <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500 uppercase">
                  <span>{item.condition}</span>
                  {item.location && <span className="truncate max-w-[80px]">{item.location}</span>}
                </div>
                <div className="text-[8px] text-slate-500 font-mono truncate pt-0.5 border-t border-slate-100">
                  {liveUrl}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center no-print">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[11px] font-medium">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              Scanning with your phone camera opens this item page immediately
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end gap-2 no-print">
          <button
            onClick={handleDownloadQr}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Label Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
