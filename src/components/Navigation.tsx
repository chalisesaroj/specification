import React from 'react';
import { 
  Car, 
  FileText, 
  History, 
  PlusCircle, 
  Settings, 
  Database,
  CloudCheck,
  HardDrive
} from 'lucide-react';

export type NavTab = 'dashboard' | 'standards' | 'work-records' | 'new-spec' | 'settings';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isSupabaseConnected: boolean;
  workRecordsCount: number;
  standardsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  isSupabaseConnected,
  workRecordsCount,
  standardsCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div 
            onClick={() => onTabChange('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:bg-blue-500 transition-colors">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">AutoSpec</span>
                <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Automobile Technical Specification Generator</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                currentTab === 'dashboard'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange('standards')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                currentTab === 'standards'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Standard Specifications</span>
              <span className="ml-1 text-xs px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300">
                {standardsCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange('work-records')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                currentTab === 'work-records'
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <History className="w-4 h-4 text-emerald-400" />
              <span>My Work Records</span>
              <span className="ml-1 text-xs px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300">
                {workRecordsCount}
              </span>
            </button>

            <button
              onClick={() => onTabChange('new-spec')}
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-all flex items-center space-x-1.5 ${
                currentTab === 'new-spec'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-700/80 hover:bg-blue-600 text-blue-100 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Specification</span>
            </button>

            <button
              onClick={() => onTabChange('settings')}
              title="Database & Storage Settings"
              className={`p-2 rounded-md transition-colors ${
                currentTab === 'settings'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </nav>

          {/* Database connection badge */}
          <div className="flex items-center">
            <button 
              type="button"
              onClick={() => onTabChange('settings')}
              className={`cursor-pointer px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 border transition-all shadow-xs ${
                isSupabaseConnected 
                  ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 hover:bg-emerald-900' 
                  : 'bg-amber-950/80 border-amber-500/70 text-amber-300 hover:bg-amber-900 animate-pulse'
              }`}
              title={isSupabaseConnected ? 'Connected to Supabase PostgreSQL (Click to manage)' : 'Supabase Not Connected - Click to configure'}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSupabaseConnected ? 'Supabase Connected' : 'Connect Supabase'}</span>
              <span className="sm:hidden">{isSupabaseConnected ? 'DB Active' : 'No DB'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
