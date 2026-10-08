import React from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  PlusCircle,
  TrendingUp,
  Settings,
  QrCode,
  Sparkles,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { User } from '../types/inventory';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddItem: () => void;
  onOpenScanner: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddItem,
  onOpenScanner,
  currentUser,
  onOpenAuth,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'valuations', label: 'Valuations', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Package className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 tracking-tight text-base leading-none">
                SOLK Asset
              </h1>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Personal Inventory
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Add Item */}
        <div className="p-4 space-y-2">
          <button
            onClick={onOpenAddItem}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/30 transition-all cursor-pointer group"
          >
            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Add Item</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-all cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span>Scan QR Code</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
                {item.id === 'valuations' && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] bg-blue-100/80 text-blue-700 font-semibold px-1.5 py-0.5 rounded-md">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Account / Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onOpenAuth}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100/80 transition-all text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-semibold text-xs shadow-inner">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1">
                {currentUser?.name || 'Charlie Solk'}
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {currentUser?.email || 'charliesolk28@gmail.com'}
              </div>
            </div>
            <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5" onClick={() => onSelectTab('dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">SOLK Asset</span>
            <span className="text-[10px] block text-slate-500 font-medium">Personal Inventory</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            aria-label="Scan QR Code"
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          >
            <QrCode className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenAddItem}
            aria-label="Add Item"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
          <button
            onClick={onOpenAuth}
            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xs font-medium cursor-pointer"
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
