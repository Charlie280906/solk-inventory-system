export type ConditionType = 
  | 'Brand New'
  | 'Like New'
  | 'Excellent'
  | 'Good'
  | 'Fair'
  | 'Poor'
  | 'Unknown';

export type ConfidenceType = 'High' | 'Medium' | 'Low' | 'Insufficient Data';

export type ValuationType = 'AI' | 'Manual';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  item_id: string;
  file_url: string;
  file_type: string;
  name: string;
  uploaded_at: string;
  size_bytes?: number;
}

export interface ComparableListing {
  title: string;
  price: string | number;
  platform?: string;
  condition?: string;
  url?: string;
  notes?: string;
}

export interface Valuation {
  id: string;
  item_id: string;
  value_low: number | null;
  value_high: number | null;
  suggested_price: number | null;
  currency: string;
  confidence: ConfidenceType;
  valuation_type: ValuationType;
  valuation_date: string;
  source_information: string;
  comparable_count?: number;
  comparable_listings?: ComparableListing[];
  market_summary?: string;
  web_search_queries?: string[];
  grounding_sources?: Array<{ title: string; url: string }>;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  parent_category_id?: string | null;
  icon?: string;
  color?: string;
  description?: string;
}

export interface Item {
  id: string;
  user_id: string;
  inventory_id: string; // e.g. SOLK-000001
  name: string;
  brand?: string;
  model?: string;
  category_id: string;
  subcategory_id?: string | null;
  quantity: number;
  condition: ConditionType;
  location?: string;
  purchase_date?: string; // YYYY-MM-DD
  purchase_price?: number | null; // confirmed purchase price
  estimated_purchase_price?: number | null;
  resale_value?: number | null; // current resale value (manual or latest valuation)
  replacement_value?: number | null;
  serial_number?: string;
  notes?: string;
  tags?: string[];
  photograph?: string; // base64 or URL
  attachments?: Attachment[];
  valuations?: Valuation[];
  created_at: string;
  updated_at: string;
  last_valued_at?: string | null;
  qr_code_data?: string; // Data URL for QR code
  qr_code_url?: string; // Direct HTTPS URL encoded in the QR code
}

export interface InventoryStats {
  totalItems: number;
  totalUniqueItems: number;
  totalResaleValue: number;
  totalReplacementValue: number;
  totalCategories: number;
  itemsWithValuation: number;
  itemsWithoutValuation: number;
  categoryBreakdown: Array<{
    category_id: string;
    name: string;
    itemCount: number;
    resaleValue: number;
    percentageOfTotal: number;
  }>;
}

export interface InventoryFilterOptions {
  searchQuery: string;
  categoryId: string;
  subcategoryId: string;
  condition: string;
  location: string;
  valuationStatus: 'all' | 'has_valuation' | 'no_valuation';
  photoStatus: 'all' | 'has_photo' | 'no_photo';
  sortBy: 'recently_added' | 'name' | 'resale_high' | 'resale_low' | 'purchase_price' | 'category' | 'last_valued';
  viewMode: 'grid' | 'list';
}
