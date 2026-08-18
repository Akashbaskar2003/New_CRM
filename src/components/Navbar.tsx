import React, { useState } from 'react';
import { useCRMStore } from '../store/crmStore';
import { Bell, Check, Trash, Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const {
    activeTab,
    currentUser,
    notifications,
    markNotificationAsRead,
    clearNotifications,
    isSyncing
  } = useCRMStore();

  const [showNotifications, setShowNotifications] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Page title driven by the active sidebar tab
  const getPageTitle = () => {
    switch (activeTab) {
      case 'DIRECT_PLACEMENT':
        return 'Direct Placement';
      case 'REPORTS':
        return 'Reports';
      case 'BACKUP':
        return 'Backup';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border-primary bg-bg-card/80 backdrop-blur-md transition-all">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Left Side: Sidebar toggle + Page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            title="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-lg font-bold tracking-tight text-text-primary">
            {getPageTitle()}
          </span>
          {isSyncing && (
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 animate-pulse border border-amber-200 dark:border-amber-900/50">
              Syncing...
            </span>
          )}
        </div>

        {/* Right Side: Quick Actions & Profile */}
        <div className="flex items-center space-x-3">
          

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all relative"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-orange opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-orange"></span>
                </span>
              )}
            </button>

            {/* Notification Menu */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border-primary bg-bg-card p-4 shadow-xl text-text-primary text-left z-50 fade-in">
                <div className="flex items-center justify-between border-b border-border-secondary pb-2 mb-2">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-text-secondary">Notifications</h4>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-[10px] text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Trash className="h-3 w-3" /> Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-xs text-text-muted">No notifications.</div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-lg border text-xs relative transition-all ${
                          notif.is_read
                            ? 'border-border-secondary bg-bg-card/50 opacity-60'
                            : notif.type === 'error'
                            ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
                            : notif.type === 'warning'
                            ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20'
                            : 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20'
                        }`}
                      >
                        <div className="font-semibold pr-4">{notif.title}</div>
                        <div className="text-text-secondary mt-0.5 text-[11px] leading-relaxed">{notif.message}</div>
                        <div className="text-[9px] text-text-muted mt-1">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        
                        {!notif.is_read && (
                          <button
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="absolute top-2 right-2 p-0.5 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile initials display */}
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-secondary border border-border-primary text-xs font-bold text-text-primary"
            title={`${currentUser.full_name} (${currentUser.role})`}
          >
            {getInitials(currentUser.full_name)}
          </div>

        </div>
      </div>
    </header>
  );
};
