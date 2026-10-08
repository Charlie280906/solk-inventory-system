import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Edit3,
  Copy,
  Split,
  Trash2,
  Sparkles,
  QrCode,
  Printer,
  Download,
  Calendar,
  Tag,
  MapPin,
  FileText,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Plus,
  X,
  TrendingUp,
  Clock,
  ShieldCheck,
  Search,
  Smartphone,
} from 'lucide-react';
import { Item, Category, Valuation } from '../types/inventory';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getConditionBadgeColor,
  getConfidenceBadgeColor,
} from '../utils/formatters';
import { generateQrDataUrl } from '../utils/qr';

interface ItemDetailProps {
  item: Item;
  categories: Category[];
  currency?: string;
  onBack: () => void;
  onEdit: (item: Item) => void;
  onDuplicate: (item: Item) => void;
  onSplit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onRequestValuation: (item: Item) => void;
  onAddManualValuation: (item: Item, value: number, confidence: string, notes?: string) => void;
  onAddAttachment: (item: Item, fileData: { name: string; file_url: string; file_type?: string }) => void;
  onDeleteAttachment: (item: Item, attachmentId: string) => void;
  onPrintLabel: (item: Item) => void;
  onAutoFindPhoto?: (item: Item) => Promise<void>;
  isValuing?: boolean;
}

export const ItemDetail: React.FC<ItemDetailProps> = ({
  item,
  categories,
  currency = 'GBP',
  onBack,
  onEdit,
  onDuplicate,
  onSplit,
  onDelete,
  onRequestValuation,
  onAddManualValuation,
  onAddAttachment,
  onDeleteAttachment,
  onPrintLabel,
  onAutoFindPhoto,
  isValuing = false,
}) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [isFindingPhoto, setIsFindingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showManualValModal, setShowManualValModal] = useState(false);
  const [manualValAmount, setManualValAmount] = useState('');
  const [manualConfidence, setManualConfidence] = useState('Medium');
  const [manualValNotes, setManualValNotes] = useState('');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [liveQrData, setLiveQrData] = useState<string>('');

  const liveUrl = `${window.location.origin}/item/${item.inventory_id}`;

  useEffect(() => {
    if (item && liveUrl) {
      generateQrDataUrl(liveUrl).then((url) => {
        setLiveQrData(url || item.qr_code_data || '');
      });
    }
  }, [item, liveUrl]);

  // Categories helper
  const cat = categories.find((c) => c.id === item.category_id);
  const subCat = item.subcategory_id ? categories.find((c) => c.id === item.subcategory_id) : null;
  const conditionBadge = getConditionBadgeColor(item.condition);

  // Latest valuation record
  const latestValuation = item.valuations?.[0];

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(manualValAmount);
    if (isNaN(val) || val < 0) return;
    onAddManualValuation(item, val, manualConfidence, manualValNotes);
    setShowManualValModal(false);
    setManualValAmount('');
    setManualValNotes('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAttachment(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onAddAttachment(item, {
        name: file.name,
        file_url: dataUrl,
        file_type: file.type,
      });
      setIsUploadingAttachment(false);
    };
    reader.onerror = () => setIsUploadingAttachment(false);
    reader.readAsDataURL(file);
  };

  const handleDownloadQr = () => {
    const dataToDownload = liveQrData || item.qr_code_data;
    if (!dataToDownload) return;
    const a = document.createElement('a');
    a.href = dataToDownload;
    a.download = `QR_${item.inventory_id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Inventory</span>
        </button>

        {/* Item Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => onDuplicate(item)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            title="Duplicate item"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>

          {item.quantity > 1 && (
            <button
              onClick={() => onSplit(item)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-all cursor-pointer"
              title="Split into individual items with separate QR codes"
            >
              <Split className="w-3.5 h-3.5" />
              <span>Split ({item.quantity})</span>
            </button>
          )}

          {onAutoFindPhoto && (
            <button
              onClick={async () => {
                setIsFindingPhoto(true);
                setPhotoError(false);
                await onAutoFindPhoto(item);
                setIsFindingPhoto(false);
              }}
              disabled={isFindingPhoto}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-all cursor-pointer"
              title="Search Google for authentic product photograph"
            >
              <Sparkles className={`w-3.5 h-3.5 text-blue-600 ${isFindingPhoto ? 'animate-spin' : ''}`} />
              <span>{isFindingPhoto ? 'Searching Google...' : 'Match Photo with Google'}</span>
            </button>
          )}

          <button
            onClick={() => onPrintLabel(item)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>Print Label</span>
          </button>

          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                onDelete(item);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Item Card: Photo + Core Details */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Photograph Column */}
          <div className="md:col-span-5 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200/80 p-6 flex flex-col items-center justify-center relative min-h-[300px]">
            {item.photograph ? (
              <div className="relative w-full flex flex-col items-center">
                <div className="relative w-full rounded-2xl overflow-hidden bg-white/70 border border-slate-200/60 p-2 shadow-xs flex items-center justify-center">
                  <img
                    src={photoError ? `/api/image-proxy?url=${encodeURIComponent(item.photograph)}` : item.photograph}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    onError={() => {
                      if (!photoError) setPhotoError(true);
                    }}
                    className="w-full h-auto max-h-[380px] object-contain rounded-xl"
                  />
                </div>
                {onAutoFindPhoto && (
                  <button
                    onClick={async () => {
                      setIsFindingPhoto(true);
                      setPhotoError(false);
                      await onAutoFindPhoto(item);
                      setIsFindingPhoto(false);
                    }}
                    disabled={isFindingPhoto}
                    className="mt-3 w-full py-2 px-3 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-xl shadow-xs border border-slate-200 hover:border-blue-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Search Google to find a matching product photo"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-blue-600 ${isFindingPhoto ? 'animate-spin' : ''}`} />
                    <span>{isFindingPhoto ? 'Searching Google...' : 'Search Google for Photo Match'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8 px-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-200/60 mx-auto flex items-center justify-center mb-3">
                  <Tag className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700">No photograph attached</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                  Search Google to automatically find and fill an authentic product photo.
                </p>
                <button
                  onClick={async () => {
                    if (onAutoFindPhoto) {
                      setIsFindingPhoto(true);
                      setPhotoError(false);
                      await onAutoFindPhoto(item);
                      setIsFindingPhoto(false);
                    }
                  }}
                  disabled={isFindingPhoto}
                  className="mt-3.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isFindingPhoto ? 'animate-spin' : ''}`} />
                  <span>{isFindingPhoto ? 'Searching Google...' : 'Find Product Photo with Google'}</span>
                </button>
              </div>
            )}

            {/* QR Code Quick Badge */}
            <div className="mt-4 flex flex-col gap-2 w-full bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-xs">
              <div className="flex items-center gap-3">
                {(liveQrData || item.qr_code_data) && (
                  <img
                    src={liveQrData || item.qr_code_data}
                    alt={`QR ${item.inventory_id}`}
                    className="w-14 h-14 rounded-lg border border-slate-100 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setShowQrModal(true)}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Asset Identifier
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-1">
                      <Smartphone className="w-2.5 h-2.5" />
                      Phone Scannable
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 text-sm block">{item.inventory_id}</span>
                  <span className="text-[11px] text-slate-500 truncate block">
                    Opens this exact page on your phone
                  </span>
                </div>
                <button
                  onClick={() => setShowQrModal(true)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="View QR Code & Mobile URL"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>

              {/* Direct Link Quick Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]" title={liveUrl}>
                  {liveUrl}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(liveUrl);
                    setCopiedUrl(true);
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                >
                  {copiedUrl ? (
                    <span className="text-emerald-600 font-bold">✓ Copied!</span>
                  ) : (
                    <span>Copy URL</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Core Info Column */}
          <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Category Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                <span className="hover:text-blue-600">{cat?.name || 'General'}</span>
                {subCat && (
                  <>
                    <span>›</span>
                    <span className="text-blue-600">{subCat.name}</span>
                  </>
                )}
                {item.quantity > 1 && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                    Quantity: {item.quantity}
                  </span>
                )}
              </div>

              {/* Title & Brand/Model */}
              {(item.brand || item.model) && (
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {[item.brand, item.model].filter(Boolean).join(' • ')}
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {item.name}
              </h1>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${conditionBadge.bg} ${conditionBadge.text} ${conditionBadge.border}`}
                >
                  Condition: {item.condition}
                </span>

                {item.location && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {item.location}
                  </span>
                )}

                {item.serial_number && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg">
                    SN: {item.serial_number}
                  </span>
                )}
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {item.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* AI Valuation Hero Banner */}
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/60 p-5 rounded-2xl border border-blue-100 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Current Resale Valuation
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {item.resale_value ? formatCurrency(item.resale_value, currency) : 'Not Valued'}
                    </span>
                    {latestValuation && (
                      <span className="text-xs font-semibold text-slate-500">
                        ({latestValuation.valuation_type === 'AI' ? 'AI Estimated' : 'Manual'})
                      </span>
                    )}
                  </div>
                  {latestValuation && (
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(latestValuation.valuation_date)}
                      </span>
                      <span>•</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                          getConfidenceBadgeColor(latestValuation.confidence).bg
                        } ${getConfidenceBadgeColor(latestValuation.confidence).text} ${
                          getConfidenceBadgeColor(latestValuation.confidence).border
                        }`}
                      >
                        Confidence: {latestValuation.confidence}
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Valuation Trigger Button */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => onRequestValuation(item)}
                    disabled={isValuing}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isValuing ? 'animate-spin' : ''}`} />
                    <span>{isValuing ? 'Researching Market...' : 'AI Estimate Resale Value'}</span>
                  </button>

                  <button
                    onClick={() => setShowManualValModal(true)}
                    className="text-[11px] font-semibold text-slate-600 hover:text-blue-600 text-center transition-colors cursor-pointer"
                  >
                    Override with manual value
                  </button>
                </div>
              </div>

              {latestValuation?.market_summary && (
                <div className="mt-3 pt-3 border-t border-blue-200/50 text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800">Market Insight: </span>
                  {latestValuation.market_summary}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Breakdown Grid (Section 8 & 12: Incomplete information, distinguishing confirmed vs estimated) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Financial & Acquisition Details
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Confirmed Purchase Price */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Original Purchase Price
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              {item.purchase_price !== null && item.purchase_price !== undefined ? (
                <>
                  <span className="text-xl font-bold text-slate-900">
                    {formatCurrency(item.purchase_price, currency)}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Confirmed
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-slate-400 italic">Unknown</span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {item.purchase_date ? `Purchased: ${formatDate(item.purchase_date)}` : 'Date unrecorded'}
            </div>
          </div>

          {/* Estimated Purchase Price */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Est. Original Purchase
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              {item.estimated_purchase_price ? (
                <>
                  <span className="text-xl font-bold text-slate-900">
                    {formatCurrency(item.estimated_purchase_price, currency)}
                  </span>
                  <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Estimated
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-slate-400 italic">Unknown</span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Approximate historical cost</div>
          </div>

          {/* Resale Value */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Current Resale Value
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              {item.resale_value ? (
                <>
                  <span className="text-xl font-bold text-slate-900 text-blue-700">
                    {formatCurrency(item.resale_value, currency)}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-[10px] text-slate-500">
                      (Total: {formatCurrency(item.resale_value * item.quantity, currency)})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm font-medium text-slate-400 italic">Not valued</span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {latestValuation ? `Source: ${latestValuation.valuation_type}` : 'Pending appraisal'}
            </div>
          </div>

          {/* Replacement Value */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Replacement Value
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              {item.replacement_value ? (
                <span className="text-xl font-bold text-slate-900">
                  {formatCurrency(item.replacement_value, currency)}
                </span>
              ) : (
                <span className="text-sm font-medium text-slate-400 italic">Unknown</span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Estimated cost to buy new today</div>
          </div>
        </div>
      </div>

      {/* Valuation History Section (Section 10 & 11) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Valuation History
            </h2>
            <p className="text-xs text-slate-500">
              Chronological log of AI-assisted market appraisals and manual updates
            </p>
          </div>
          <button
            onClick={() => setShowManualValModal(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            + Add Manual Record
          </button>
        </div>

        {(!item.valuations || item.valuations.length === 0) ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500 font-medium">No valuation history recorded yet.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Click &quot;AI Estimate Resale Value&quot; to research real comparable market listings and record the initial appraisal.
            </p>
            <button
              onClick={() => onRequestValuation(item)}
              disabled={isValuing}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
            >
              Run AI Appraisal
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {item.valuations.map((val) => {
              const confBadge = getConfidenceBadgeColor(val.confidence);
              return (
                <div
                  key={val.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-slate-900">
                        {val.suggested_price ? formatCurrency(val.suggested_price, currency) : 'Insufficient Data'}
                      </span>
                      {val.value_low && val.value_high && val.value_low !== val.value_high && (
                        <span className="text-xs text-slate-500 font-medium">
                          (Range: {formatCurrency(val.value_low, currency)} – {formatCurrency(val.value_high, currency)})
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${confBadge.bg} ${confBadge.text} ${confBadge.border}`}
                      >
                        {val.confidence} Confidence
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          val.valuation_type === 'AI'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {val.valuation_type === 'AI' ? 'AI Valuation' : 'Manual Valuation'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      {formatDate(val.valuation_date)}
                    </div>
                  </div>

                  {val.source_information && (
                    <p className="text-xs text-slate-600 mt-2 font-medium">
                      {val.source_information}
                    </p>
                  )}

                  {val.market_summary && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {val.market_summary}
                    </p>
                  )}

                  {/* Comparable Listings Found */}
                  {val.comparable_listings && val.comparable_listings.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Comparable Listings Analysed ({val.comparable_listings.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {val.comparable_listings.map((comp, cIdx) => (
                          <div
                            key={cIdx}
                            className="p-2.5 rounded-xl bg-white border border-slate-200/70 text-xs flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 truncate block">
                                {comp.title}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {comp.platform || 'Marketplace'} • {comp.condition || 'Used'}
                              </span>
                            </div>
                            <span className="font-bold text-slate-900 shrink-0">
                              {typeof comp.price === 'number' ? formatCurrency(comp.price, currency) : comp.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Column Section: Notes & Attachments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notes */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-blue-600" />
            Possession Notes
          </h2>
          <div className="flex-1 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed min-h-[120px]">
            {item.notes ? (
              <p className="whitespace-pre-wrap">{item.notes}</p>
            ) : (
              <p className="text-slate-400 italic">No notes recorded for this item.</p>
            )}
          </div>
        </div>

        {/* Attachments / Receipts / Manuals */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-blue-600" />
              Attachments & Receipts
            </h2>
            <label className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Document</span>
              <input
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                disabled={isUploadingAttachment}
              />
            </label>
          </div>

          <div className="flex-1 divide-y divide-slate-100 bg-slate-50/50 p-2 rounded-2xl border border-slate-100 min-h-[120px]">
            {(!item.attachments || item.attachments.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6 text-slate-400">
                <Paperclip className="w-6 h-6 stroke-1 mb-1 text-slate-300" />
                <p className="text-xs">No receipts, warranties, or documents attached yet.</p>
              </div>
            ) : (
              item.attachments.map((att) => (
                <div key={att.id} className="py-2.5 px-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-slate-800 truncate block">
                        {att.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(att.uploaded_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {att.file_url && att.file_url !== '#' && (
                      <a
                        href={att.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors"
                        title="View"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => onDeleteAttachment(item, att.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal Preview */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">QR Code</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center">
              {(liveQrData || item.qr_code_data) ? (
                <img
                  src={liveQrData || item.qr_code_data}
                  alt={item.inventory_id}
                  className="w-48 h-48 rounded-xl shadow-xs"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-200 rounded-xl" />
              )}
              <div className="mt-3 font-mono font-bold text-slate-900 text-sm">
                {item.inventory_id}
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">{item.name}</div>

              {/* Direct Web Destination */}
              <div className="mt-3 w-full bg-white p-2.5 rounded-xl border border-slate-200 text-left">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Phone Destination URL</span>
                  <span className="text-emerald-600 font-semibold lowercase flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    scannable by phone camera
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-700 break-all select-all">
                  {liveUrl}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(liveUrl);
                    alert(`Copied link to clipboard:\n${liveUrl}`);
                  }}
                  className="mt-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer block"
                >
                  Copy Link to Clipboard
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                Scanning this QR code with your phone camera directly opens this possession&apos;s record on your mobile browser.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadQr}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
              <button
                onClick={() => {
                  setShowQrModal(false);
                  onPrintLabel(item);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Valuation Override Modal */}
      {showManualValModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Manual Valuation Override</h3>
              <button
                onClick={() => setShowManualValModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valuation Amount ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 450"
                  value={manualValAmount}
                  onChange={(e) => setManualValAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confidence Rating</label>
                <select
                  value={manualConfidence}
                  onChange={(e) => setManualConfidence(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="High">High (Recent receipt / quote / exact match)</option>
                  <option value="Medium">Medium (General market knowledge)</option>
                  <option value="Low">Low (Rough estimate)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Source / Appraisal Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Quoted by local dealer or confirmed offer..."
                  value={manualValNotes}
                  onChange={(e) => setManualValNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualValModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Manual Valuation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
