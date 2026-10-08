import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  PlusCircle,
  Package,
  QrCode,
  Tag,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  X,
  ExternalLink,
} from 'lucide-react';
import { Item, Category, InventoryFilterOptions } from '../types/inventory';
import { formatCurrency, formatRelativeTime, getConditionBadgeColor } from '../utils/formatters';

interface InventoryListProps {
  items: Item[];
  categories: Category[];
  locations: string[];
  currency?: string;
  onSelectItem: (item: Item) => void;
  onOpenAddItem: () => void;
  onOpenScanner: () => void;
  initialFilter?: Partial<InventoryFilterOptions>;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  items,
  categories,
  locations,
  currency = 'GBP',
  onSelectItem,
  onOpenAddItem,
  onOpenScanner,
  initialFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialFilter?.searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilter?.categoryId || 'all');
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialFilter?.subcategoryId || 'all');
  const [selectedCondition, setSelectedCondition] = useState(initialFilter?.condition || 'all');
  const [selectedLocation, setSelectedLocation] = useState(initialFilter?.location || 'all');
  const [valuationStatus, setValuationStatus] = useState<'all' | 'has_valuation' | 'no_valuation'>(
    initialFilter?.valuationStatus || 'all'
  );
  const [photoStatus, setPhotoStatus] = useState<'all' | 'has_photo' | 'no_photo'>(
    initialFilter?.photoStatus || 'all'
  );
  const [sortBy, setSortBy] = useState<string>(initialFilter?.sortBy || 'recently_added');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Subcategories available for selected category
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'all') return [];
    return categories.filter((c) => c.parent_category_id === selectedCategory);
  }, [categories, selectedCategory]);

  // Root categories
  const rootCategories = useMemo(() => {
    return categories.filter((c) => !c.parent_category_id);
  }, [categories]);

  // Category name map
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // Filter & Search logic
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      // Search matching across: Item name, Brand, Model, Category, Subcategory, Tags, Unique ID, Serial number, Notes
      if (q) {
        const catName = categoryMap.get(item.category_id) || '';
        const subCatName = item.subcategory_id ? categoryMap.get(item.subcategory_id) || '' : '';
        const tagsStr = (item.tags || []).join(' ');

        const match =
          (item.name || '').toLowerCase().includes(q) ||
          (item.brand || '').toLowerCase().includes(q) ||
          (item.model || '').toLowerCase().includes(q) ||
          (item.inventory_id || '').toLowerCase().includes(q) ||
          (item.serial_number || '').toLowerCase().includes(q) ||
          (item.notes || '').toLowerCase().includes(q) ||
          (item.location || '').toLowerCase().includes(q) ||
          catName.toLowerCase().includes(q) ||
          subCatName.toLowerCase().includes(q) ||
          tagsStr.toLowerCase().includes(q);

        if (!match) return false;
      }

      // Filter: Category
      if (selectedCategory !== 'all') {
        const isDirect = item.category_id === selectedCategory;
        // Check if item's category is a subcategory of selectedCategory
        const itemCat = categories.find((c) => c.id === item.category_id);
        const isChild = itemCat && itemCat.parent_category_id === selectedCategory;
        if (!isDirect && !isChild) return false;
      }

      // Filter: Subcategory
      if (selectedSubcategory !== 'all') {
        if (item.subcategory_id !== selectedSubcategory && item.category_id !== selectedSubcategory) {
          return false;
        }
      }

      // Filter: Condition
      if (selectedCondition !== 'all') {
        if (item.condition !== selectedCondition) return false;
      }

      // Filter: Location
      if (selectedLocation !== 'all') {
        if ((item.location || '').toLowerCase() !== selectedLocation.toLowerCase()) return false;
      }

      // Filter: Valuation Status
      if (valuationStatus === 'has_valuation') {
        if (item.resale_value === null || item.resale_value === undefined) return false;
      } else if (valuationStatus === 'no_valuation') {
        if (item.resale_value !== null && item.resale_value !== undefined) return false;
      }

      // Filter: Photograph Status
      if (photoStatus === 'has_photo') {
        if (!item.photograph) return false;
      } else if (photoStatus === 'no_photo') {
        if (item.photograph) return false;
      }

      return true;
    });
  }, [
    items,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    selectedCondition,
    selectedLocation,
    valuationStatus,
    photoStatus,
    categories,
    categoryMap,
  ]);

  // Sort logic
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    switch (sortBy) {
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'resale_high':
        return list.sort((a, b) => (b.resale_value || 0) - (a.resale_value || 0));
      case 'resale_low':
        return list.sort((a, b) => (a.resale_value || 0) - (b.resale_value || 0));
      case 'purchase_price':
        return list.sort((a, b) => (b.purchase_price || 0) - (a.purchase_price || 0));
      case 'category':
        return list.sort((a, b) => {
          const catA = categoryMap.get(a.category_id) || '';
          const catB = categoryMap.get(b.category_id) || '';
          return catA.localeCompare(catB);
        });
      case 'last_valued':
        return list.sort((a, b) => {
          const timeA = a.last_valued_at ? new Date(a.last_valued_at).getTime() : 0;
          const timeB = b.last_valued_at ? new Date(b.last_valued_at).getTime() : 0;
          return timeB - timeA;
        });
      case 'recently_added':
      default:
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [filteredItems, sortBy, categoryMap]);

  const activeFiltersCount = [
    selectedCategory !== 'all',
    selectedSubcategory !== 'all',
    selectedCondition !== 'all',
    selectedLocation !== 'all',
    valuationStatus !== 'all',
    photoStatus !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedCondition('all');
    setSelectedLocation('all');
    setValuationStatus('all');
    setPhotoStatus('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inventory Catalog
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Showing {sortedItems.length} of {items.length} possessions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Scan QR</span>
          </button>
          <button
            onClick={onOpenAddItem}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/25 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Search, Filter Bar & View Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, brand, model, ID (e.g. SOLK-000001), tag, serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm placeholder:text-slate-400 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters / Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
            >
              <option value="recently_added">Recently Added</option>
              <option value="name">Name (A–Z)</option>
              <option value="resale_high">Resale Value: High to Low</option>
              <option value="resale_low">Resale Value: Low to High</option>
              <option value="purchase_price">Purchase Price</option>
              <option value="category">Category</option>
              <option value="last_valued">Last Valued</option>
            </select>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFiltersModal(!showFiltersModal)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activeFiltersCount > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                aria-label="List view"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Filters Drawer / Panel */}
        {showFiltersModal && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory('all');
                }}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-slate-50/50"
              >
                <option value="all">All Categories</option>
                {rootCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Subcategory</label>
              <select
                value={selectedSubcategory}
                disabled={availableSubcategories.length === 0}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-slate-50/50 disabled:opacity-50"
              >
                <option value="all">All Subcategories</option>
                {availableSubcategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Condition</label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-slate-50/50"
              >
                <option value="all">All Conditions</option>
                <option value="Brand New">Brand New</option>
                <option value="Like New">Like New</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-slate-50/50"
              >
                <option value="all">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Valuation Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Valuation</label>
              <select
                value={valuationStatus}
                onChange={(e) => setValuationStatus(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-slate-50/50"
              >
                <option value="all">All Items</option>
                <option value="has_valuation">Has Valuation</option>
                <option value="no_valuation">Needs Valuation</option>
              </select>
            </div>

            {/* Photo Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Photograph</label>
              <select
                value={photoStatus}
                onChange={(e) => setPhotoStatus(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-slate-50/50"
              >
                <option value="all">All</option>
                <option value="has_photo">Has Photo</option>
                <option value="no_photo">No Photo</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filter Badges */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-slate-400">Filters:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200 font-medium">
                Category: {categoryMap.get(selectedCategory)}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('all')} />
              </span>
            )}
            {selectedSubcategory !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200 font-medium">
                Subcategory: {categoryMap.get(selectedSubcategory)}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSubcategory('all')} />
              </span>
            )}
            {selectedCondition !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-medium">
                {selectedCondition}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCondition('all')} />
              </span>
            )}
            {selectedLocation !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-medium">
                Location: {selectedLocation}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedLocation('all')} />
              </span>
            )}
            {valuationStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-medium">
                {valuationStatus === 'has_valuation' ? 'Has Valuation' : 'Needs Valuation'}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setValuationStatus('all')} />
              </span>
            )}
            {photoStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-medium">
                {photoStatus === 'has_photo' ? 'With Photo' : 'Without Photo'}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setPhotoStatus('all')} />
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-xs text-blue-600 hover:underline font-semibold ml-auto"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Item Display: Grid vs List */}
      {sortedItems.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">No matching possessions</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">
              Try adjusting your search keywords or resetting the active filters.
            </p>
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {sortedItems.map((item) => {
            const condBadge = getConditionBadgeColor(item.condition);
            const categoryName = categoryMap.get(item.category_id) || 'Item';
            const subCategoryName = item.subcategory_id ? categoryMap.get(item.subcategory_id) : null;

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col overflow-hidden"
              >
                {/* Photo & Top Overlay */}
                <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                  {item.photograph ? (
                    <img
                      src={item.photograph}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                      <Camera className="w-8 h-8 stroke-1" />
                      <span className="text-[11px] text-slate-400 mt-1">No photograph</span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-slate-700 shadow-xs border border-slate-200/60">
                      {item.inventory_id}
                    </span>

                    {item.quantity > 1 && (
                      <span className="text-[10px] font-bold bg-slate-900/90 text-white px-2 py-0.5 rounded-md shadow-xs">
                        Qty: {item.quantity}
                      </span>
                    )}
                  </div>

                  {/* Condition Badge Bottom Left */}
                  <div className="absolute bottom-2 left-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border backdrop-blur-sm shadow-xs ${condBadge.bg} ${condBadge.text} ${condBadge.border}`}
                    >
                      {item.condition}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Brand / Model */}
                    {(item.brand || item.model) && (
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate mb-0.5">
                        {[item.brand, item.model].filter(Boolean).join(' • ')}
                      </p>
                    )}

                    {/* Name */}
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </h3>

                    {/* Category */}
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {categoryName} {subCategoryName ? `› ${subCategoryName}` : ''}
                    </p>
                  </div>

                  {/* Bottom Financial / Location Row */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Est. Resale
                      </span>
                      {item.resale_value ? (
                        <span className="font-extrabold text-base text-slate-900">
                          {formatCurrency(item.resale_value, currency)}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Not valued
                        </span>
                      )}
                    </div>

                    {item.location && (
                      <span
                        className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md max-w-[110px] truncate"
                        title={item.location}
                      >
                        {item.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Purchase</th>
                  <th className="py-3 px-4 text-right">Est. Resale</th>
                  <th className="py-3 px-4 text-center">ID / QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedItems.map((item) => {
                  const condBadge = getConditionBadgeColor(item.condition);
                  const catName = categoryMap.get(item.category_id) || 'Item';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Item & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.photograph ? (
                              <img src={item.photograph} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:text-blue-600 block line-clamp-1">
                              {item.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {[item.brand, item.model].filter(Boolean).join(' • ') || '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {catName}
                      </td>

                      {/* Condition */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded border ${condBadge.bg} ${condBadge.text} ${condBadge.border}`}
                        >
                          {item.condition}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {item.location || '—'}
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 text-center font-bold text-xs text-slate-700">
                        {item.quantity}
                      </td>

                      {/* Purchase */}
                      <td className="py-3 px-4 text-right text-xs text-slate-600">
                        {item.purchase_price ? (
                          formatCurrency(item.purchase_price, currency)
                        ) : item.estimated_purchase_price ? (
                          <span className="text-slate-400">~{formatCurrency(item.estimated_purchase_price, currency)}</span>
                        ) : (
                          <span className="text-slate-300">Unknown</span>
                        )}
                      </td>

                      {/* Resale */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {item.resale_value ? (
                          <span className="text-slate-900">{formatCurrency(item.resale_value, currency)}</span>
                        ) : (
                          <span className="text-xs font-normal text-amber-600">Not valued</span>
                        )}
                      </td>

                      {/* Inventory ID */}
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                          {item.inventory_id}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
