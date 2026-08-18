import React, { useState } from 'react';
import { useCRMStore } from '../store/crmStore';
import type { Role, TeamCode } from '../store/crmStore';
import { Settings, Shield, User, RefreshCw, Moon, Sun, Trash2 } from 'lucide-react';

export const DevControlPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, setUserRole, currentTheme, setTheme, resetDatabase, triggerSync, isSyncing } = useCRMStore();

  const handleRoleChange = (role: Role, teamId: TeamCode | null) => {
    setUserRole(role, teamId);
  };

  const getRoleBadge = (user = currentUser) => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50';
      case 'TEAM_LEAD':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50';
      case 'FINANCE':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/50';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-orange text-white shadow-lg hover:bg-accent-orangeHover transition-transform hover:scale-105"
        title="Prototype Controller"
      >
        <Settings className={`h-6 w-6 ${isOpen ? 'rotate-90' : ''} transition-transform duration-300`} />
      </button>

      {/* Control Panel Drawer */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 rounded-2xl border border-border-primary bg-bg-card p-5 shadow-2xl transition-all duration-300 text-text-primary fade-in">
          <div className="mb-4 flex items-center justify-between border-b border-border-secondary pb-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent-orange" />
              Demo Settings
            </h3>
            <span className="text-xs font-mono bg-bg-secondary px-2 py-0.5 rounded text-text-secondary border border-border-primary">
              Prototype Mode
            </span>
          </div>

          {/* Current User Info */}
          <div className="mb-4 rounded-xl bg-bg-secondary p-3 border border-border-primary">
            <div className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-1">Active Identity</div>
            <div className="font-medium text-sm flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {currentUser.full_name}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${getRoleBadge()}`}>
                {currentUser.role}
              </span>
              {currentUser.team_id && (
                <span className="text-[10px] uppercase font-mono bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded-full">
                  {currentUser.team_id} Team
                </span>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-2">
              Switch Presenter Role
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => handleRoleChange('SUPER_ADMIN', null)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                  currentUser.role === 'SUPER_ADMIN'
                    ? 'border-accent-orange bg-accent-orange/5 font-semibold text-accent-orange'
                    : 'border-border-secondary bg-bg-card hover:bg-bg-hover'
                }`}
              >
                👑 Super Admin (Full Access)
              </button>
              
              <button
                onClick={() => handleRoleChange('TEAM_LEAD', 'JAVA')}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                  currentUser.role === 'TEAM_LEAD' && currentUser.team_id === 'JAVA'
                    ? 'border-accent-orange bg-accent-orange/5 font-semibold text-accent-orange'
                    : 'border-border-secondary bg-bg-card hover:bg-bg-hover'
                }`}
              >
                ☕ Java Team Lead
              </button>

              <button
                onClick={() => handleRoleChange('TEAM_LEAD', 'PYTHON')}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                  currentUser.role === 'TEAM_LEAD' && currentUser.team_id === 'PYTHON'
                    ? 'border-accent-orange bg-accent-orange/5 font-semibold text-accent-orange'
                    : 'border-border-secondary bg-bg-card hover:bg-bg-hover'
                }`}
              >
                🐍 Python Team Lead
              </button>

              <button
                onClick={() => handleRoleChange('TEAM_LEAD', 'DOTNET')}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                  currentUser.role === 'TEAM_LEAD' && currentUser.team_id === 'DOTNET'
                    ? 'border-accent-orange bg-accent-orange/5 font-semibold text-accent-orange'
                    : 'border-border-secondary bg-bg-card hover:bg-bg-hover'
                }`}
              >
                💻 .NET Team Lead
              </button>

              <button
                onClick={() => handleRoleChange('TEAM_LEAD', 'SUPPORT')}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                  currentUser.role === 'TEAM_LEAD' && currentUser.team_id === 'SUPPORT'
                    ? 'border-accent-orange bg-accent-orange/5 font-semibold text-accent-orange'
                    : 'border-border-secondary bg-bg-card hover:bg-bg-hover'
                }`}
              >
                🛠️ Support Team Lead
              </button>

              <button
                onClick={() => handleRoleChange('FINANCE', null)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                  currentUser.role === 'FINANCE'
                    ? 'border-accent-orange bg-accent-orange/5 font-semibold text-accent-orange'
                    : 'border-border-secondary bg-bg-card hover:bg-bg-hover'
                }`}
              >
                💵 Finance (View All, Export Reports)
              </button>
            </div>
          </div>

          {/* Theme & Actions */}
          <div className="border-t border-border-secondary pt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Interface Theme</span>
              <button
                onClick={() => setTheme(currentTheme === 'sunny' ? 'command' : 'sunny')}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-hover transition-all"
              >
                {currentTheme === 'sunny' ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-600" />
                    Sunny Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-sky-400" />
                    Command Mode
                  </>
                )}
              </button>
            </div>

            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className={`w-full flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-lg border border-border-primary text-text-secondary bg-bg-secondary hover:bg-bg-hover active:scale-[0.98] transition-all font-medium`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-accent-orange' : ''}`} />
              {isSyncing ? 'Synchronizing CRM...' : 'Simulate Sheet Sync'}
            </button>

            <button
              onClick={() => {
                if (confirm('Reset prototype data to original demo values? This will empty newly created records.')) {
                  resetDatabase();
                  alert('Database reset successful.');
                }
              }}
              className="w-full flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 transition-all font-medium"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Reset Local Database
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
