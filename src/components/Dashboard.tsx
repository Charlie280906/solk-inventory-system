import React from 'react';
import {
  Package,
  TrendingUp,
  ShieldAlert,
  Layers,
  PlusCircle,
  QrCode,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { Item, InventoryStats } from '../types/inventory';
import { formatCurrency, formatRelativeTime, getConditionBadgeColor } from '../utils/formatters';

interface DashboardProps {
  stats: (InventoryStats & { recentlyAdded: Item[]; recentlyValued: Item[]; currency: string }) | null;
  onSelectItem: (item: Item) => void;
  onOpenAddItem: () => void;
  onOpenScanner: () => void;
  onGoToValuations: () => void;
  onGoToInventory: (filter?: string) => void;
  onOpenCategory: (catId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  onSelectItem,
  onOpenAddItem,
  onOpenScanner,
  onGoToValuations,
  onGoToInventory,
  onOpenCategory,
}) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currency = stats.currency || 'GBP';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Welcome Banner & Quick Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            Private Asset Ledger
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inventory Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Live valuation summary and physical asset tracking for your personal possessions.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAddItem}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/25 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Item</span>
          </button>
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-all cursor-pointer shadow-xs"
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span>Scan QR Code</span>
          </button>
          <button
            onClick={onGoToValuations}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Value an Item</span>
          </button>
        </div>
      </div>

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div
          onClick={() => onGoToInventory()}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Items
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.totalItems}
            </span>
            <span className="text-xs text-slate-500">
              ({stats.totalUniqueItems} unique records)
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-blue-600 font-medium group-hover:underline inline-flex items-center gap-0.5">
              Browse inventory <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Total Estimated Resale Value */}
        <div
          onClick={onGoToValuations}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estimated Resale Value
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(stats.totalResaleValue, currency)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Includes {stats.itemsWithValuation} valued items</span>
          </div>
        </div>

        {/* Total Replacement Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Replacement Value
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(stats.totalReplacementValue, currency)}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Insurance benchmark coverage
          </div>
        </div>

        {/* Number of Categories */}
        <div
          onClick={() => onGoToInventory()}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Categories
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 flex items-center justify-center transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.totalCategories}
            </span>
            <span className="text-xs text-slate-500">Main groups</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {stats.itemsWithoutValuation > 0 ? (
              <span className="text-amber-600 font-medium inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {stats.itemsWithoutValuation} items need valuation
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">All items valued</span>
            )}
          </div>
        </div>
      </div>

      {/* Category Overview */}
      <div className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Category Valuation Breakdown
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Distribution of estimated resale values across primary asset categories
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {stats.categoryBreakdown.length} Categories
          </span>
        </div>

        {/* Visual Stacked Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex mb-6">
          {stats.categoryBreakdown.map((cat, idx) => {
            const colors = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-cyan-500'];
            const color = colors[idx % colors.length];
            if (cat.percentageOfTotal <= 0) return null;
            return (
              <div
                key={cat.category_id}
                style={{ width: `${cat.percentageOfTotal}%` }}
                className={`${color} h-full transition-all`}
                title={`${cat.name}: ${cat.percentageOfTotal}%`}
              />
            );
          })}
        </div>

        {/* Category List Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.categoryBreakdown.map((cat, idx) => {
            const dotColors = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-cyan-500'];
            const dotColor = dotColors[idx % dotColors.length];
            return (
              <div
                key={cat.category_id}
                onClick={() => onOpenCategory(cat.category_id)}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></span>
                    <span className="font-semibold text-sm text-slate-800 group-hover:text-blue-600 transition-colors truncate max-w-[140px]">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {cat.percentageOfTotal}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-lg font-extrabold text-slate-900">
                    {formatCurrency(cat.resaleValue, currency)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {cat.itemCount} {cat.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Recently Added & Recently Valued */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recently Added Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Recently Added
              </h2>
              <span className="text-xs text-slate-500">Latest additions to your personal catalog</span>
            </div>
            <button
              onClick={() => onGoToInventory('recently_added')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {stats.recentlyAdded.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No items added yet. Click &quot;Add Item&quot; to begin.
              </div>
            ) : (
              stats.recentlyAdded.map((item) => {
                const condBadge = getConditionBadgeColor(item.condition);
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="py-3.5 flex items-center gap-3.5 hover:bg-slate-50/80 px-2 rounded-xl transition-all cursor-pointer group"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.photograph ? (
                        <img
                          src={item.photograph}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] bg-slate-200/70 text-slate-700 font-bold px-1.5 py-0.5 rounded-sm">
                            ×{item.quantity}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono text-[11px] text-slate-400">{item.inventory_id}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${condBadge.bg} ${condBadge.text} ${condBadge.border}`}>
                          {item.condition}
                        </span>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm text-slate-900">
                        {item.resale_value ? formatCurrency(item.resale_value, currency) : (
                          <span className="text-xs font-normal text-slate-400">Unvalued</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recently Valued Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Recently Valued
              </h2>
              <span className="text-xs text-slate-500">Items updated with market research & AI appraisal</span>
            </div>
            <button
              onClick={onGoToValuations}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Valuation Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {stats.recentlyValued.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No recent valuations yet. Run &quot;AI Estimate Resale Value&quot; on any item.
              </div>
            ) : (
              stats.recentlyValued.map((item) => {
                const latestVal = item.valuations?.[0];
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="py-3.5 flex items-center gap-3.5 hover:bg-slate-50/80 px-2 rounded-xl transition-all cursor-pointer group"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.photograph ? (
                        <img
                          src={item.photograph}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono text-[11px] text-slate-400">{item.inventory_id}</span>
                        <span>•</span>
                        {latestVal ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                            {latestVal.valuation_type === 'AI' ? 'AI Valuation' : 'Manual Valuation'}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm text-slate-900 text-emerald-700">
                        {formatCurrency(item.resale_value, currency)}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(item.last_valued_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
