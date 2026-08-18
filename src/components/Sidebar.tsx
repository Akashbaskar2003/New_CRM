import React from 'react';
import { useCRMStore } from '../store/crmStore';
import {
  LayoutDashboard,
  UserCheck,
  BarChart3,
  DatabaseBackup,
  X,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { key: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'DIRECT_PLACEMENT', label: 'Direct Placement', icon: UserCheck },
  { key: 'REPORTS', label: 'Reports', icon: BarChart3 },
  { key: 'BACKUP', label: 'Backup', icon: DatabaseBackup },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, currentTheme, setTheme, currentUser, setUserRole } = useCRMStore();

  const handleNavClick = (tab: typeof NAV_ITEMS[number]['key']) => {
    setActiveTab(tab);
    // Auto-close on small screens after picking a page, keep it open on desktop
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // No backend auth exists in this demo — "logout" resets back to the
  // default Super Admin presenter identity, same as a fresh page load.
  const handleLogout = () => {
    const confirmed = window.confirm('Log out and return to the default demo identity?');
    if (confirmed) {
      setUserRole('SUPER_ADMIN', null);
      setActiveTab('DASHBOARD');
    }
  };

  return (
    <>
      {/* Mobile-only backdrop so tapping outside closes the drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-bg-card text-text-primary border-r border-border-primary transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-2 border-b border-border-primary px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent-orange animate-pulse" />
            <div className="leading-tight">
              <p className="font-mono text-sm font-bold uppercase tracking-wider text-text-primary">
                PyCRM
              </p>
              <p className="text-[10px] text-text-muted">Placement Payment System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            title="Hide sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => handleNavClick(key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent-orange text-white shadow-sm'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {label}
              </button>
            );
          })}

          <div className="my-3 border-t border-border-primary" />


          <button
            onClick={() => setTheme(currentTheme === 'sunny' ? 'command' : 'sunny')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-all hover:bg-bg-hover hover:text-text-primary"
          >
            {currentTheme === 'sunny' ? (
              <Moon className="h-4.5 w-4.5 shrink-0" />
            ) : (
              <Sun className="h-4.5 w-4.5 shrink-0" />
            )}
            {currentTheme === 'sunny' ? 'Dark Theme' : 'Light Theme'}
          </button>
        </nav>

        {/* Footer: current user + logout */}
        <div className="border-t border-border-primary px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-secondary border border-border-primary text-xs font-bold text-text-primary"
              title={currentUser.role}
            >
              {getInitials(currentUser.full_name)}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-text-primary">
                {currentUser.full_name}
              </p>
              <p className="truncate text-[10px] uppercase tracking-wide text-text-muted">
                {currentUser.role.replace('_', ' ')}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-all hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            Logout
          </button>

          <p className="mt-2 px-2 text-[10px] text-text-muted">
            © 2026 UNIQ Placement Payment System
          </p>
        </div>
      </aside>
    </>
  );
};
