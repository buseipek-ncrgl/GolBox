import React from 'react';
import { RefreshCw, LogOut, Shield, Menu } from 'lucide-react';

interface AdminHeaderProps {
  adminName: string;
  adminRole: string;
  adminInitials: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onRefresh: () => void;
  onLogout: () => void;
  loading?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  adminName,
  adminRole,
  adminInitials,
  sidebarCollapsed,
  onToggleSidebar,
  onRefresh,
  onLogout,
  loading,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur transition-all sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title={sidebarCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            GölBox <span className="text-xs font-normal text-muted-foreground">Yönetim Paneli</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          title="Verileri Yenile"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          <span className="hidden sm:inline">Yenile</span>
        </button>

        <div className="h-6 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
            {adminInitials}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold leading-tight text-foreground">{adminName}</p>
            <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Shield className="h-3 w-3 text-primary" /> {adminRole}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
          title="Çıkış Yap"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
