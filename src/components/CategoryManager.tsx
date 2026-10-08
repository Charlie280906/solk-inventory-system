import React, { useState, useMemo } from 'react';
import {
  FolderTree,
  FolderPlus,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Layers,
  Tag,
  Package,
  TrendingUp,
  X,
  Check,
} from 'lucide-react';
import { Category, Item } from '../types/inventory';
import { formatCurrency } from '../utils/formatters';

interface CategoryManagerProps {
  categories: Category[];
  items: Item[];
  currency?: string;
  onCreateCategory: (data: Partial<Category>) => Promise<void>;
  onUpdateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  items,
  currency = 'GBP',
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onSelectCategory,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    cat_tech: true,
    cat_clothing: true,
    cat_outdoor: true,
    cat_home: true,
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Item counts and resale value maps
  const statsMap = useMemo(() => {
    const counts: Record<string, number> = {};
    const values: Record<string, number> = {};

    categories.forEach((c) => {
      counts[c.id] = 0;
      values[c.id] = 0;
    });

    items.forEach((item) => {
      const qty = item.quantity || 1;
      const resale = item.resale_value ? Number(item.resale_value) * qty : 0;

      if (item.category_id && counts[item.category_id] !== undefined) {
        counts[item.category_id] += qty;
        values[item.category_id] += resale;
      }
      if (item.subcategory_id && counts[item.subcategory_id] !== undefined) {
        counts[item.subcategory_id] += qty;
        values[item.subcategory_id] += resale;
      }
    });

    return { counts, values };
  }, [categories, items]);

  const toggleExpand = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Build recursive category tree
  const buildTree = (parentId: string | null = null): Category[] => {
    return categories
      .filter((c) => (c.parent_category_id || null) === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const handleStartAdd = (parentId: string | null = null) => {
    setSelectedParentId(parentId);
    setNewCategoryName('');
    setIsAddingCategory(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await onCreateCategory({
      name: newCategoryName.trim(),
      parent_category_id: selectedParentId,
    });
    setIsAddingCategory(false);
    setNewCategoryName('');
    if (selectedParentId) {
      setExpandedCategories((prev) => ({ ...prev, [selectedParentId]: true }));
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setEditName(cat.name);
  };

  const handleEditSubmit = async (catId: string) => {
    if (!editName.trim()) return;
    await onUpdateCategory(catId, { name: editName.trim() });
    setEditingCategoryId(null);
  };

  // Render tree node recursively
  const renderCategoryNode = (cat: Category, level: number = 0) => {
    const children = buildTree(cat.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories[cat.id] ?? true;
    const isEditing = editingCategoryId === cat.id;
    const itemCount = statsMap.counts[cat.id] || 0;
    const itemValue = statsMap.values[cat.id] || 0;

    return (
      <div key={cat.id} className="select-none">
        <div
          className={`flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors group ${
            level > 0 ? 'ml-6 border-l border-slate-100 pl-4' : 'border border-slate-200/80 mb-1.5 bg-white'
          }`}
        >
          {/* Left: Expand Icon + Name */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(cat.id)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-6 flex items-center justify-center text-slate-300">
                <Tag className="w-3.5 h-3.5" />
              </span>
            )}

            {isEditing ? (
              <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-blue-500 focus:outline-none flex-1 bg-white"
                  autoFocus
                />
                <button
                  onClick={() => handleEditSubmit(cat.id)}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditingCategoryId(null)}
                  className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span
                onClick={() => onSelectCategory(cat.id)}
                className={`font-semibold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer truncate ${
                  level === 0 ? 'text-sm' : 'text-xs'
                }`}
              >
                {cat.name}
              </span>
            )}
          </div>

          {/* Right: Item Count, Valuation & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {itemCount > 0 ? (
              <div className="text-right text-xs">
                <span className="font-bold text-slate-900 block">
                  {formatCurrency(itemValue, currency)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-300">0 items</span>
            )}

            {/* Actions (visible on hover) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleStartAdd(cat.id)}
                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Add subcategory"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleStartEdit(cat)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                title="Rename category"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete category "${cat.name}"? Subcategories and item tags will be unlinked.`)) {
                    onDeleteCategory(cat.id);
                  }
                }}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                title="Delete category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Children Subcategories */}
        {hasChildren && isExpanded && (
          <div className="space-y-1 mt-1">
            {children.map((child) => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootNodes = buildTree(null);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Category Hierarchy
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Organise personal items into custom categories and unlimited subcategories
          </p>
        </div>

        <button
          onClick={() => handleStartAdd(null)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/25 transition-all cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Top Category</span>
        </button>
      </div>

      {/* Main Hierarchy Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>Categories & Sub-Tiers</span>
          <span>Holdings & Total Value</span>
        </div>

        {rootNodes.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FolderTree className="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-1" />
            <p className="text-sm font-semibold text-slate-600">No categories found</p>
            <p className="text-xs text-slate-400 mt-1">Create your first category to organise items.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rootNodes.map((root) => renderCategoryNode(root, 0))}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">
                {selectedParentId
                  ? `Add Subcategory under "${categories.find((c) => c.id === selectedParentId)?.name}"`
                  : 'Create Top-Level Category'}
              </h3>
              <button
                onClick={() => setIsAddingCategory(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skiing, Audio, Trainers..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
