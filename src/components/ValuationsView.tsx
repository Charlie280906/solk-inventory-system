import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Package,
  ArrowRight,
  ExternalLink,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import { Item, Category } from '../types/inventory';
import { formatCurrency, formatRelativeTime, getConfidenceBadgeColor } from '../utils/formatters';

interface ValuationsViewProps {
  items: Item[];
  categories: Category[];
  currency?: string;
  onSelectItem: (item: Item) => void;
  onRequestValuation: (item: Item) => void;
  isValuingId?: string | null;
}

export const ValuationsView: React.FC<ValuationsViewProps> = ({
  items,
  categories,
  currency = 'GBP',
  onSelectItem,
  onRequestValuation,
  isValuingId,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'needs_valuation' | 'valued'>('all');

  // Categorize items
  const valuedItems = items.filter((i) => i.resale_value !== null && i.resale_value !== undefined);
  const unvaluedItems = items.filter((i) => i.resale_value === null || i.resale_value === undefined);

  // Compute metrics
  const totalResale = valuedItems.reduce((acc, i) => acc + (Number(i.resale_value) * (i.quantity || 1)), 0);
  const totalPurchase = valuedItems.reduce((acc, i) => acc + (i.purchase_price ? Number(i.purchase_price) * (i.quantity || 1) : 0), 0);

  const displayedItems =
    activeTab === 'needs_valuation'
      ? unvaluedItems
      : activeTab === 'valued'
      ? valuedItems
      : items;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Secondary Market Appraisal Engine
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Portfolio Valuations
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Real-time secondary market intelligence powered by Google Search marketplace grounding
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Resale Portfolio
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(totalResale, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{valuedItems.length} items valued</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Valuation Coverage
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {items.length > 0 ? Math.round((valuedItems.length / items.length) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-400">
              ({valuedItems.length} of {items.length})
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {unvaluedItems.length > 0 ? (
              <span className="text-amber-600 font-medium inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {unvaluedItems.length} items need appraisal
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">100% catalog appraised</span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Purchase Value Retention
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalPurchase > 0 ? `${Math.round((totalResale / totalPurchase) * 100)}%` : '—'}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Across items with known purchase costs
          </div>
        </div>
      </div>

      {/* Unvalued Items Alert Banner (if any) */}
      {unvaluedItems.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              {unvaluedItems.length} {unvaluedItems.length === 1 ? 'item requires' : 'items require'} resale valuation
            </h3>
            <p className="text-xs text-blue-100 max-w-xl">
              Research real comparable listings on secondary marketplaces like eBay UK, Back Market, and Vinted to calculate estimated resale value.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('needs_valuation')}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-blue-700 rounded-xl text-xs font-bold shrink-0 shadow-xs cursor-pointer transition-colors"
          >
            Review Valuation Queue
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Items ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('needs_valuation')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'needs_valuation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Needs Valuation ({unvaluedItems.length})
        </button>
        <button
          onClick={() => setActiveTab('valued')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'valued'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Valued ({valuedItems.length})
        </button>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden divide-y divide-slate-100">
        {displayedItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
            <p className="text-sm font-semibold text-slate-600">No items in this category</p>
          </div>
        ) : (
          displayedItems.map((item) => {
            const latestVal = item.valuations?.[0];
            const isCurrentlyValuing = isValuingId === item.id;

            return (
              <div
                key={item.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors group"
              >
                {/* Left: Thumbnail + Item Details */}
                <div
                  onClick={() => onSelectItem(item)}
                  className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.photograph ? (
                      <img src={item.photograph} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {item.name}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                          ×{item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {[item.brand, item.model].filter(Boolean).join(' • ') || item.inventory_id}
                    </div>

                    {latestVal?.market_summary && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                        &quot;{latestVal.market_summary}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Valuation Stats & Action Button */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    {item.resale_value ? (
                      <>
                        <div className="font-extrabold text-base text-slate-900">
                          {formatCurrency(item.resale_value, currency)}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(item.last_valued_at)}</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Pending Appraisal
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onRequestValuation(item)}
                    disabled={isCurrentlyValuing}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isCurrentlyValuing ? 'animate-spin' : ''}`} />
                    <span>{isCurrentlyValuing ? 'Appraising...' : item.resale_value ? 'Re-Value' : 'Estimate with AI'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
