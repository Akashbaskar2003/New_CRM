import React, { useState, useEffect } from 'react';
import { useCRMStore } from './store/crmStore';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DevControlPanel } from './components/DevControlPanel';

import { Dashboard } from './components/Dashboard';
import { DirectPlacement } from './components/DirectPlacement';
import { Reports } from './components/Reports';
import { BackupCenter } from './components/BackupCenter';
import { PublicForms } from './components/PublicForms';
import { Eye, Shield, Globe } from 'lucide-react';

const App: React.FC = () => {
  const { activeTab, currentTheme } = useCRMStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'ADMIN' | 'PUBLIC'>('ADMIN');

  // Initialize theme classes on load
  useEffect(() => {
    // Set theme on html tag
    const htmlElement = document.documentElement;
    if (currentTheme === 'command') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, [currentTheme]);

  const renderActiveView = () => {
    if (viewMode === 'PUBLIC') {
      return <PublicForms />;
    }

    switch (activeTab) {
      case 'DASHBOARD':
        return <Dashboard />;
      case 'DIRECT_PLACEMENT':
        return <DirectPlacement />;
      case 'REPORTS':
        return <Reports />;
      case 'BACKUP':
        return <BackupCenter />;
      default:
        return <Dashboard />;
    }
  };

  const sidebarShown = viewMode === 'ADMIN' && isSidebarOpen;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-all">

      {/* Left Sidebar Navigation (Admin only) */}
      {viewMode === 'ADMIN' && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Right Column: Banner + Topbar + Content — shifts right on desktop when sidebar is open */}
      <div
        className={`flex min-h-screen min-w-0 flex-col pb-24 transition-[margin] duration-300 ease-in-out ${
          sidebarShown ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >

        {/* 1. Presentation Mode Quick Switcher Header Banner */}
        <div className="w-full bg-accent-navy text-white py-2 px-6 flex flex-col sm:flex-row justify-between items-center text-xs font-semibold gap-2 border-b border-white/10 shadow">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-accent-orange animate-pulse" />
            <span>Presentation Mode:</span>
            <span className="text-white/70">Toggle interfaces below to simulate full CRM lifecycles.</span>
          </div>

          <div className="flex bg-white/10 p-0.5 rounded-lg border border-white/20">
            <button
              onClick={() => setViewMode('ADMIN')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all uppercase tracking-wider text-[10px] font-bold ${
                viewMode === 'ADMIN'
                  ? 'bg-accent-orange text-white'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="h-3 w-3" />
              CRM Admin Interface
            </button>

            <button
              onClick={() => setViewMode('PUBLIC')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all uppercase tracking-wider text-[10px] font-bold ${
                viewMode === 'PUBLIC'
                  ? 'bg-accent-orange text-white'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="h-3 w-3" />
              Public Portals (Student)
            </button>
          </div>
        </div>

        {/* 2. Admin Topbar */}
        {viewMode === 'ADMIN' && (
          <Navbar
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        )}

        {/* 3. Main Interface Viewport */}
        <main className="w-full max-w-7xl mx-auto py-2 px-2 sm:px-4">
          {renderActiveView()}
        </main>
      </div>



      {/* 5. Floating Dev Toggle Settings Widget */}
      <DevControlPanel />

    </div>
  );
};

export default App;
