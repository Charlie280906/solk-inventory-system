import { Item, Category, User, Valuation, InventoryStats } from '../types/inventory';

const BASE_URL = '/api';

export const api = {
  // Auth
  async getCurrentUser(): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/me`);
    if (!res.ok) throw new Error('Failed to fetch user');
    const data = await res.json();
    return data.user;
  },

  async login(email: string, name?: string): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    if (!res.ok) throw new Error('Failed to login');
    const data = await res.json();
    return data.user;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${BASE_URL}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    const data = await res.json();
    return data.categories;
  },

  async createCategory(categoryData: Partial<Category>): Promise<Category> {
    const res = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });
    if (!res.ok) throw new Error('Failed to create category');
    const data = await res.json();
    return data.category;
  },

  async updateCategory(id: string, categoryData: Partial<Category>): Promise<Category> {
    const res = await fetch(`${BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });
    if (!res.ok) throw new Error('Failed to update category');
    const data = await res.json();
    return data.category;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete category');
    const data = await res.json();
    return data.success;
  },

  // Items
  async getItems(): Promise<Item[]> {
    const res = await fetch(`${BASE_URL}/items`);
    if (!res.ok) throw new Error('Failed to fetch items');
    const data = await res.json();
    return data.items;
  },

  async getItem(idOrInventoryId: string): Promise<Item> {
    const res = await fetch(`${BASE_URL}/items/${encodeURIComponent(idOrInventoryId)}`);
    if (!res.ok) throw new Error('Item not found');
    const data = await res.json();
    return data.item;
  },

  async createItem(itemData: Partial<Item>): Promise<Item> {
    const res = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (!res.ok) throw new Error('Failed to create item');
    const data = await res.json();
    return data.item;
  },

  async updateItem(id: string, itemData: Partial<Item>): Promise<Item> {
    const res = await fetch(`${BASE_URL}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (!res.ok) throw new Error('Failed to update item');
    const data = await res.json();
    return data.item;
  },

  async deleteItem(id: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/items/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete item');
    const data = await res.json();
    return data.success;
  },

  async duplicateItem(id: string): Promise<Item> {
    const res = await fetch(`${BASE_URL}/items/${id}/duplicate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to duplicate item');
    const data = await res.json();
    return data.item;
  },

  async splitItem(id: string): Promise<{ original: Item; newItems: Item[] }> {
    const res = await fetch(`${BASE_URL}/items/${id}/split`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to split item');
    return await res.json();
  },

  // Locations
  async getLocations(): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/locations`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.locations || [];
  },

  // Product Photo Auto-Search
  async findProductPhoto(query: { name: string; brand?: string; model?: string; category?: string }): Promise<string> {
    const res = await fetch(`${BASE_URL}/items/find-photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });
    if (!res.ok) throw new Error('Failed to find product photo');
    const data = await res.json();
    return data.photo_url;
  },

  async autoAssignItemPhoto(itemId: string): Promise<{ photo_url: string; item: Item }> {
    const res = await fetch(`${BASE_URL}/items/${itemId}/auto-photo`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to auto-assign photo');
    return await res.json();
  },

  // Attachments
  async addAttachment(itemId: string, attachment: { name: string; file_url: string; file_type?: string; size_bytes?: number }): Promise<any> {
    const res = await fetch(`${BASE_URL}/items/${itemId}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attachment),
    });
    if (!res.ok) throw new Error('Failed to add attachment');
    return await res.json();
  },

  async deleteAttachment(itemId: string, attachmentId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/items/${itemId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete attachment');
    return await res.json();
  },

  // Valuations
  async requestAiValuation(itemId?: string, itemDetails?: Partial<Item>): Promise<{ valuation: Valuation; item: Item }> {
    const res = await fetch(`${BASE_URL}/valuation/ai-estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, itemDetails }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to estimate resale value');
    }
    return await res.json();
  },

  async addManualValuation(itemId: string, value: number, confidence: string, notes?: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/items/${itemId}/manual-valuation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, confidence, notes }),
    });
    if (!res.ok) throw new Error('Failed to add manual valuation');
    return await res.json();
  },

  // Stats
  async getStats(): Promise<InventoryStats & { recentlyAdded: Item[]; recentlyValued: Item[]; currency: string }> {
    const res = await fetch(`${BASE_URL}/stats`);
    if (!res.ok) throw new Error('Failed to load stats');
    return await res.json();
  },

  // Settings & DB Reset
  async getSettings(): Promise<any> {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) return { id_prefix: 'SOLK', currency: 'GBP' };
    const data = await res.json();
    return data.settings;
  },

  async updateSettings(settings: { id_prefix?: string; currency?: string; app_url?: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return await res.json();
  },

  async regenerateQrCodes(baseUrl?: string): Promise<{ success: boolean; base_url: string; count: number }> {
    const res = await fetch(`${BASE_URL}/settings/regenerate-qr-codes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base_url: baseUrl }),
    });
    return await res.json();
  },

  async resetSeedData(): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/reset-seed`, { method: 'POST' });
    return res.ok;
  },
};
