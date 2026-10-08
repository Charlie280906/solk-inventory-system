import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Plus,
  Tag,
  DollarSign,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
} from 'lucide-react';
import { Item, Category, ConditionType } from '../types/inventory';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: Partial<Item>) => Promise<void>;
  itemToEdit?: Item | null;
  categories: Category[];
  locations: string[];
  currency?: string;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  itemToEdit,
  categories,
  locations,
  currency = 'GBP',
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<ConditionType>('Good');
  const [location, setLocation] = useState('');
  const [newLocationInput, setNewLocationInput] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [estimatedPurchasePrice, setEstimatedPurchasePrice] = useState('');
  const [resaleValue, setResaleValue] = useState('');
  const [replacementValue, setReplacementValue] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [photograph, setPhotograph] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingPhoto, setIsSearchingPhoto] = useState(false);
  const [searchPhotoMessage, setSearchPhotoMessage] = useState<string | null>(null);
  const [photoPreviewError, setPhotoPreviewError] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Filter root categories vs subcategories
  const rootCategories = categories.filter((c) => !c.parent_category_id);
  const availableSubcategories = categories.filter((c) => c.parent_category_id === categoryId);

  const handleAutoFindPhoto = async () => {
    if (!name.trim()) {
      setSearchPhotoMessage('Please enter an Item Name first to search for a product photo');
      return;
    }
    setIsSearchingPhoto(true);
    setSearchPhotoMessage(null);
    setPhotoPreviewError(false);
    try {
      const selectedCat = categories.find((c) => c.id === categoryId);
      const photo = await import('../services/api').then((m) =>
        m.api.findProductPhoto({
          name: name.trim(),
          brand: brand.trim(),
          model: model.trim(),
          category: selectedCat?.name,
        })
      );
      if (photo) {
        setPhotograph(photo);
        setSearchPhotoMessage('Found matching product photo from Google!');
      } else {
        setSearchPhotoMessage('No exact photo found. A category photo will be assigned when saving.');
      }
    } catch {
      setSearchPhotoMessage('Search completed. Image will be auto-assigned when saving.');
    } finally {
      setIsSearchingPhoto(false);
    }
  };

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setCategoryId(itemToEdit.category_id || (rootCategories[0]?.id || ''));
      setSubcategoryId(itemToEdit.subcategory_id || '');
      setBrand(itemToEdit.brand || '');
      setModel(itemToEdit.model || '');
      setQuantity(itemToEdit.quantity || 1);
      setCondition(itemToEdit.condition || 'Good');
      setLocation(itemToEdit.location || '');
      setPurchaseDate(itemToEdit.purchase_date || '');
      setPurchasePrice(itemToEdit.purchase_price !== null && itemToEdit.purchase_price !== undefined ? String(itemToEdit.purchase_price) : '');
      setEstimatedPurchasePrice(itemToEdit.estimated_purchase_price !== null && itemToEdit.estimated_purchase_price !== undefined ? String(itemToEdit.estimated_purchase_price) : '');
      setResaleValue(itemToEdit.resale_value !== null && itemToEdit.resale_value !== undefined ? String(itemToEdit.resale_value) : '');
      setReplacementValue(itemToEdit.replacement_value !== null && itemToEdit.replacement_value !== undefined ? String(itemToEdit.replacement_value) : '');
      setSerialNumber(itemToEdit.serial_number || '');
      setNotes(itemToEdit.notes || '');
      setTagsInput((itemToEdit.tags || []).join(', '));
      setPhotograph(itemToEdit.photograph || null);
      setShowAdvanced(true);
    } else {
      setName('');
      setCategoryId(rootCategories[0]?.id || '');
      setSubcategoryId('');
      setBrand('');
      setModel('');
      setQuantity(1);
      setCondition('Good');
      setLocation('');
      setPurchaseDate('');
      setPurchasePrice('');
      setEstimatedPurchasePrice('');
      setResaleValue('');
      setReplacementValue('');
      setSerialNumber('');
      setNotes('');
      setTagsInput('');
      setPhotograph(null);
      setShowAdvanced(false);
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotograph(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const effectiveLocation = newLocationInput.trim() ? newLocationInput.trim() : location;

      await onSubmit({
        name: name.trim(),
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        quantity: Math.max(1, Number(quantity) || 1),
        condition,
        location: effectiveLocation || undefined,
        purchase_date: purchaseDate || undefined,
        purchase_price: purchasePrice !== '' ? Number(purchasePrice) : null,
        estimated_purchase_price: estimatedPurchasePrice !== '' ? Number(estimatedPurchasePrice) : null,
        resale_value: resaleValue !== '' ? Number(resaleValue) : null,
        replacement_value: replacementValue !== '' ? Number(replacementValue) : null,
        serial_number: serialNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        tags,
        photograph: photograph || undefined,
      });

      onClose();
    } catch (err) {
      console.error('Error saving item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {itemToEdit ? 'Edit Possession' : 'Add New Item to Inventory'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unique QR Code & ID will be generated automatically upon saving
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          {/* Quick Notice about Unknown info */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Only Name & Category are required. Incomplete details (price, serial, receipt) can be left blank anytime.</span>
          </div>

          {/* Photograph Upload Area */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70">
            <div className="relative w-24 h-24 rounded-2xl bg-slate-200/80 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
              {photograph ? (
                <img
                  src={photoPreviewError ? `/api/image-proxy?url=${encodeURIComponent(photograph)}` : photograph}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    if (!photoPreviewError) setPhotoPreviewError(true);
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center text-slate-400">
                  <Camera className="w-7 h-7 mb-1" />
                  <span className="text-[10px] font-semibold text-slate-400">Blank Space</span>
                </div>
              )}
              {photograph && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotograph(null);
                    setPhotoPreviewError(false);
                    setSearchPhotoMessage(null);
                  }}
                  className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 text-white rounded-full hover:bg-rose-600 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 block">
                  Item Photograph
                </label>
                {!photograph && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Google Auto-Fill Active
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-700 shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Choose Custom Image</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleAutoFindPhoto}
                  disabled={isSearchingPhoto || !name.trim()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Search Google for authentic product photo"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isSearchingPhoto ? 'animate-spin' : ''}`} />
                  <span>{isSearchingPhoto ? 'Searching Google...' : 'Search Google for Photo'}</span>
                </button>
              </div>

              {searchPhotoMessage && (
                <div className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 font-medium flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>{searchPhotoMessage}</span>
                </div>
              )}

              <div className="text-[11px] text-slate-500 leading-snug">
                {photograph ? (
                  <span className="text-emerald-700 font-medium">
                    ✓ Photo ready. You can change it or remove it at any time.
                  </span>
                ) : (
                  <span>
                    <strong className="text-slate-700 font-semibold">Blank image space:</strong> If you don&apos;t supply an image, the app will search Google and find the product and an authentic product photo to fill in the blank image space.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row 1: Item Name & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MacBook Pro 14, Arc'teryx Beta Jacket..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-center"
              />
            </div>
          </div>

          {/* Row 2: Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              >
                {rootCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subcategory</label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                disabled={availableSubcategories.length === 0}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white disabled:opacity-50"
              >
                <option value="">None / General</option>
                {availableSubcategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand / Maker</label>
              <input
                type="text"
                placeholder="e.g. Apple, Sony, Nike, Patagonia..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Model / Variant</label>
              <input
                type="text"
                placeholder="e.g. M3 Pro 512GB, Lost & Found..."
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              />
            </div>
          </div>

          {/* Row 4: Condition & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ConditionType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="Brand New">Brand New (Sealed in box)</option>
                <option value="Like New">Like New (Mint, barely used)</option>
                <option value="Excellent">Excellent (Minor signs of use)</option>
                <option value="Good">Good (Normal wear, fully functional)</option>
                <option value="Fair">Fair (Noticeable wear/blemishes)</option>
                <option value="Poor">Poor (Heavily worn or damaged)</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Physical Location</label>
              <div className="space-y-1.5">
                <select
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (e.target.value !== '__custom__') setNewLocationInput('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="">Unspecified</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                  <option value="__custom__">+ Enter new location...</option>
                </select>

                {(location === '__custom__' || !locations.includes(location) && location) && (
                  <input
                    type="text"
                    placeholder="e.g. Ski locker, Storage Box 3..."
                    value={newLocationInput || location}
                    onChange={(e) => setNewLocationInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Toggle Advanced / Financial Details */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showAdvanced ? 'Hide financial & extra fields' : 'Show financial, serial number & extra fields'}</span>
            </button>
          </div>

          {/* Collapsible Advanced Section */}
          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              {/* Financial Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Confirmed Purchase ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1200"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                  <span className="text-[10px] text-slate-400">Leave blank if unknown</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Est. Original Cost ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1100"
                    value={estimatedPurchasePrice}
                    onChange={(e) => setEstimatedPurchasePrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                  <span className="text-[10px] text-slate-400">Rough historical estimate</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Current Resale ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 750"
                    value={resaleValue}
                    onChange={(e) => setResaleValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                  <span className="text-[10px] text-slate-400">Can also value with AI later</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Replacement Cost ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1350"
                    value={replacementValue}
                    onChange={(e) => setReplacementValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                  <span className="text-[10px] text-slate-400">For insurance purposes</span>
                </div>
              </div>

              {/* Purchase Date & Serial Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Serial Number / IMEI</label>
                  <input
                    type="text"
                    placeholder="e.g. C02G9012MD6R"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apple, Audio, Work, Waterproof"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Specifications</label>
                <textarea
                  rows={3}
                  placeholder="Additional specifications, warranty dates, cosmetic notes, accessories included..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
            >
              {isSubmitting
                ? (!photograph ? 'Searching Google & Saving...' : 'Saving Item...')
                : itemToEdit
                ? 'Save Changes'
                : 'Create Inventory Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
