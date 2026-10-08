/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { InventoryList } from './components/InventoryList';
import { ItemDetail } from './components/ItemDetail';
import { ItemFormModal } from './components/ItemFormModal';
import { CategoryManager } from './components/CategoryManager';
import { ValuationsView } from './components/ValuationsView';
import { QRScannerModal } from './components/QRScannerModal';
import { PrintLabelModal } from './components/PrintLabelModal';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { api } from './services/api';
import { Item, Category, User, InventoryStats } from './types/inventory';
import { Sparkles, CheckCircle2, AlertCircle, QrCode } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<{ id_prefix: string; currency: string }>({
    id_prefix: 'SOLK',
    currency: 'GBP',
  });

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [printLabelItem, setPrintLabelItem] = useState<Item | null>(null);
  const [isValuingId, setIsValuingId] = useState<string | null>(null);
  const [routeLoadingId, setRouteLoadingId] = useState<string | null>(null);
  const [inventoryInitialFilter, setInventoryInitialFilter] = useState<any>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load initial data
  const refreshData = useCallback(async () => {
    try {
      const [u, itms, cats, locs, st, sett] = await Promise.all([
        api.getCurrentUser(),
        api.getItems(),
        api.getCategories(),
        api.getLocations(),
        api.getStats(),
        api.getSettings(),
      ]);
      setCurrentUser(u);
      setItems(itms);
      setCategories(cats);
      setLocations(locs);
      setStats(st);
      if (sett) setSettings(sett);
    } catch (err) {
      console.error('Failed to load data from server:', err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // URL listener for mobile QR scanning & direct navigation
  const extractItemIdFromLocation = useCallback((): string | null => {
    // 1. Pathname: e.g. /item/SOLK-000001 or /i/SOLK-000001
    const path = window.location.pathname;
    const pathMatch = path.match(/\/(?:item|i)\/([A-Za-z0-9_-]+)/i);
    if (pathMatch && pathMatch[1]) return decodeURIComponent(pathMatch[1]);

    // 2. Hash: e.g. #item=SOLK-000001 or #/item/SOLK-000001
    const hash = window.location.hash;
    if (hash.startsWith('#item=')) {
      return decodeURIComponent(hash.replace('#item=', '').trim());
    }
    const hashMatch = hash.match(/#\/?(?:item|i)\/([A-Za-z0-9_-]+)/i);
    if (hashMatch && hashMatch[1]) return decodeURIComponent(hashMatch[1]);

    // 3. Search query: e.g. ?item=SOLK-000001
    const params = new URLSearchParams(window.location.search);
    const qItem = params.get('item');
    if (qItem) return decodeURIComponent(qItem.trim());

    return null;
  }, []);

  useEffect(() => {
    const handleNavigationRoute = async () => {
      const targetId = extractItemIdFromLocation();
      if (!targetId) {
        setRouteLoadingId(null);
        return;
      }

      setRouteLoadingId(targetId);

      // Check loaded items first
      const found = items.find(
        (i) => i.inventory_id.toUpperCase() === targetId.toUpperCase() || i.id === targetId
      );
      if (found) {
        setSelectedItem(found);
        setRouteLoadingId(null);
        return;
      }

      // Fetch immediately from API so mobile QR scan opens instant item view
      try {
        const fetched = await api.getItem(targetId);
        if (fetched) {
          setSelectedItem(fetched);
          showToast(`Scanned QR: Opened ${fetched.name} (${fetched.inventory_id})`);
        }
      } catch (err) {
        console.warn('Item not found for route:', targetId);
      } finally {
        setRouteLoadingId(null);
      }
    };

    handleNavigationRoute();
    window.addEventListener('hashchange', handleNavigationRoute);
    window.addEventListener('popstate', handleNavigationRoute);
    return () => {
      window.removeEventListener('hashchange', handleNavigationRoute);
      window.removeEventListener('popstate', handleNavigationRoute);
    };
  }, [items, extractItemIdFromLocation]);

  // Handle Item Selection & URL updating
  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    window.history.pushState(null, '', `/item/${item.inventory_id}`);
  };

  const handleCloseItemDetail = () => {
    setSelectedItem(null);
    window.history.pushState(null, '', '/');
    if (window.location.hash) {
      window.location.hash = '';
    }
  };

  // Create / Update Item
  const handleSaveItem = async (itemData: Partial<Item>) => {
    try {
      if (itemToEdit) {
        const updated = await api.updateItem(itemToEdit.id, itemData);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        if (selectedItem?.id === updated.id) setSelectedItem(updated);
        showToast(`Saved changes to ${updated.name}`);
      } else {
        const created = await api.createItem(itemData);
        setItems((prev) => [created, ...prev]);
        setSelectedItem(created);
        showToast(`Added ${created.name} (${created.inventory_id})`);
      }
      setItemToEdit(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save item', 'error');
    }
  };

  // Delete Item
  const handleDeleteItem = async (item: Item) => {
    try {
      await api.deleteItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (selectedItem?.id === item.id) {
        handleCloseItemDetail();
      }
      showToast(`Deleted ${item.name}`);
      refreshData();
    } catch (err: any) {
      showToast('Failed to delete item', 'error');
    }
  };

  // Duplicate Item
  const handleDuplicateItem = async (item: Item) => {
    try {
      const duplicated = await api.duplicateItem(item.id);
      setItems((prev) => [duplicated, ...prev]);
      setSelectedItem(duplicated);
      showToast(`Duplicated ${item.name} as ${duplicated.inventory_id}`);
      refreshData();
    } catch (err: any) {
      showToast('Failed to duplicate item', 'error');
    }
  };

  // Split multi-quantity Item into individual items
  const handleSplitItem = async (item: Item) => {
    try {
      const res = await api.splitItem(item.id);
      showToast(`Split into ${res.newItems.length + 1} individual items with unique QR codes`);
      await refreshData();
      if (res.original) setSelectedItem(res.original);
    } catch (err: any) {
      showToast(err.message || 'Failed to split item', 'error');
    }
  };

  // AI Resale Valuation Trigger
  const handleRequestValuation = async (item: Item) => {
    setIsValuingId(item.id);
    try {
      const res = await api.requestAiValuation(item.id);
      if (res.valuation) {
        // Update local item
        const updatedItem = {
          ...item,
          resale_value: res.valuation.suggested_price || item.resale_value,
          last_valued_at: res.valuation.valuation_date,
          valuations: [res.valuation, ...(item.valuations || [])],
        };
        setItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
        if (selectedItem?.id === item.id) {
          setSelectedItem(updatedItem);
        }
        showToast(
          res.valuation.suggested_price
            ? `Estimated resale value: £${res.valuation.suggested_price} (${res.valuation.confidence} Confidence)`
            : 'Market appraisal completed.'
        );
      }
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Valuation research failed', 'error');
    } finally {
      setIsValuingId(null);
    }
  };

  // Manual Valuation Override
  const handleAddManualValuation = async (item: Item, value: number, confidence: string, notes?: string) => {
    try {
      const res = await api.addManualValuation(item.id, value, confidence, notes);
      if (res.item) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? res.item : i)));
        if (selectedItem?.id === item.id) setSelectedItem(res.item);
        showToast(`Saved manual valuation of £${value}`);
      }
      await refreshData();
    } catch (err: any) {
      showToast('Failed to save manual valuation', 'error');
    }
  };

  // Attachments
  const handleAddAttachment = async (item: Item, fileData: { name: string; file_url: string; file_type?: string }) => {
    try {
      const res = await api.addAttachment(item.id, fileData);
      if (res.item) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? res.item : i)));
        if (selectedItem?.id === item.id) setSelectedItem(res.item);
        showToast(`Attached ${fileData.name}`);
      }
    } catch (err: any) {
      showToast('Failed to upload document', 'error');
    }
  };

  const handleDeleteAttachment = async (item: Item, attachmentId: string) => {
    try {
      const res = await api.deleteAttachment(item.id, attachmentId);
      if (res.item) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? res.item : i)));
        if (selectedItem?.id === item.id) setSelectedItem(res.item);
        showToast('Document removed');
      }
    } catch (err: any) {
      showToast('Failed to delete document', 'error');
    }
  };

  // Auto-find product photo via Google
  const handleAutoFindPhoto = async (item: Item) => {
    try {
      const res = await api.autoAssignItemPhoto(item.id);
      if (res.item) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? res.item : i)));
        if (selectedItem?.id === item.id) setSelectedItem(res.item);
        showToast(`Found and assigned product photo for ${item.name}`);
      }
    } catch (err: any) {
      showToast('Could not find product photo on Google', 'error');
    }
  };

  // Categories CRUD
  const handleCreateCategory = async (catData: Partial<Category>) => {
    try {
      const created = await api.createCategory(catData);
      setCategories((prev) => [...prev, created]);
      showToast(`Created category "${created.name}"`);
    } catch (err: any) {
      showToast('Failed to create category', 'error');
    }
  };

  const handleUpdateCategory = async (id: string, catData: Partial<Category>) => {
    try {
      const updated = await api.updateCategory(id, catData);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast(`Updated category`);
    } catch (err: any) {
      showToast('Failed to update category', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id && c.parent_category_id !== id));
      showToast(`Category deleted`);
      refreshData();
    } catch (err: any) {
      showToast('Failed to delete category', 'error');
    }
  };

  // QR Scan callback
  const handleQRFound = async (inventoryId: string) => {
    const found = items.find(
      (i) => i.inventory_id.toUpperCase() === inventoryId.toUpperCase() || i.id === inventoryId
    );
    if (found) {
      handleSelectItem(found);
      showToast(`Scanned QR: Opened ${found.name} (${found.inventory_id})`);
      return;
    }

    try {
      const fetched = await api.getItem(inventoryId);
      if (fetched) {
        handleSelectItem(fetched);
        showToast(`Scanned QR: Opened ${fetched.name} (${fetched.inventory_id})`);
        return;
      }
    } catch {
      // Not found
    }
    showToast(`No item matching ID "${inventoryId}" found in inventory`, 'error');
  };

  // Settings update
  const handleUpdateSettings = async (newSettings: { id_prefix?: string; currency?: string }) => {
    try {
      const updated = await api.updateSettings(newSettings);
      setSettings(updated);
      showToast('Preferences updated');
      refreshData();
    } catch (err: any) {
      showToast('Failed to update settings', 'error');
    }
  };

  const handleResetSeed = async () => {
    try {
      await api.resetSeedData();
      showToast('Reset sample inventory');
      await refreshData();
    } catch (err: any) {
      showToast('Failed to reset data', 'error');
    }
  };

  const handleLogin = async (email: string, name?: string) => {
    try {
      const user = await api.login(email, name);
      setCurrentUser(user);
      showToast(`Signed in as ${user.name}`);
      refreshData();
    } catch (err: any) {
      showToast('Authentication failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedItem(null);
          setCurrentTab(tab);
          window.location.hash = '';
        }}
        onOpenAddItem={() => {
          setItemToEdit(null);
          setIsAddItemOpen(true);
        }}
        onOpenScanner={() => setIsScannerOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full pb-24 lg:pb-8">
        {routeLoadingId && !selectedItem ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 max-w-md mx-auto animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 mb-4 shadow-sm animate-pulse">
              <QrCode className="w-8 h-8 stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 mb-2">
              Smartphone Scan Detected
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Opening Asset {routeLoadingId}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Navigating directly to your possession record and loading latest valuation appraisal...
            </p>
          </div>
        ) : selectedItem ? (
          <ItemDetail
            item={selectedItem}
            categories={categories}
            currency={settings.currency}
            onBack={handleCloseItemDetail}
            onEdit={(itm) => {
              setItemToEdit(itm);
              setIsAddItemOpen(true);
            }}
            onDuplicate={handleDuplicateItem}
            onSplit={handleSplitItem}
            onDelete={handleDeleteItem}
            onRequestValuation={handleRequestValuation}
            onAddManualValuation={handleAddManualValuation}
            onAddAttachment={handleAddAttachment}
            onDeleteAttachment={handleDeleteAttachment}
            onPrintLabel={(itm) => setPrintLabelItem(itm)}
            onAutoFindPhoto={handleAutoFindPhoto}
            isValuing={isValuingId === selectedItem.id}
          />
        ) : currentTab === 'dashboard' ? (
          <Dashboard
            stats={stats}
            onSelectItem={handleSelectItem}
            onOpenAddItem={() => {
              setItemToEdit(null);
              setIsAddItemOpen(true);
            }}
            onOpenScanner={() => setIsScannerOpen(true)}
            onGoToValuations={() => setCurrentTab('valuations')}
            onGoToInventory={(sortFilter) => {
              if (sortFilter) setInventoryInitialFilter({ sortBy: sortFilter });
              setCurrentTab('inventory');
            }}
            onOpenCategory={(catId) => {
              setInventoryInitialFilter({ categoryId: catId });
              setCurrentTab('inventory');
            }}
          />
        ) : currentTab === 'inventory' ? (
          <InventoryList
            items={items}
            categories={categories}
            locations={locations}
            currency={settings.currency}
            onSelectItem={handleSelectItem}
            onOpenAddItem={() => {
              setItemToEdit(null);
              setIsAddItemOpen(true);
            }}
            onOpenScanner={() => setIsScannerOpen(true)}
            initialFilter={inventoryInitialFilter}
          />
        ) : currentTab === 'categories' ? (
          <CategoryManager
            categories={categories}
            items={items}
            currency={settings.currency}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onSelectCategory={(catId) => {
              setInventoryInitialFilter({ categoryId: catId });
              setCurrentTab('inventory');
            }}
          />
        ) : currentTab === 'valuations' ? (
          <ValuationsView
            items={items}
            categories={categories}
            currency={settings.currency}
            onSelectItem={handleSelectItem}
            onRequestValuation={handleRequestValuation}
            isValuingId={isValuingId}
          />
        ) : currentTab === 'settings' ? (
          <SettingsView
            currentUser={currentUser}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetSeed={handleResetSeed}
            onOpenAuth={() => setIsAuthOpen(true)}
            onRefreshData={refreshData}
          />
        ) : null}
      </main>

      {/* Modals */}
      <ItemFormModal
        isOpen={isAddItemOpen}
        onClose={() => {
          setIsAddItemOpen(false);
          setItemToEdit(null);
        }}
        onSubmit={handleSaveItem}
        itemToEdit={itemToEdit}
        categories={categories}
        locations={locations}
        currency={settings.currency}
      />

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onItemFound={handleQRFound}
      />

      <PrintLabelModal
        item={printLabelItem}
        isOpen={!!printLabelItem}
        onClose={() => setPrintLabelItem(null)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
      />
    </div>
  );
}
