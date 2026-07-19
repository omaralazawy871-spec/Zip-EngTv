import { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Tv, FolderTree, Settings, LogOut, Radio, Database, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setAuthTokenGetter } from '@workspace/api-client-react/src/custom-fetch';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('engtv_admin_token');
    if (!token) {
      setLocation('/admin/login');
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem('engtv_admin_token');
    setAuthTokenGetter(null);
    setLocation('/admin/login');
  };

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: t('nav.dashboard') },
    { href: '/admin/channels', icon: Tv, label: t('nav.channels') },
    { href: '/admin/categories', icon: FolderTree, label: t('nav.categories') },
    { href: '/admin/sources', icon: Radio, label: t('nav.sources') },
    { href: '/admin/backup', icon: Database, label: t('nav.backup') },
    { href: '/admin/settings', icon: Settings, label: t('nav.settings') },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile header */}
      <MobileNav navItems={navItems} location={location} handleLogout={handleLogout} t={t} />

      {/* Desktop Sidebar */}
      <aside className="w-64 border-e border-border/40 bg-card hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border/40">
          <span className="font-bold text-xl text-primary tracking-tight">EngTv Admin</span>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}>
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border/40">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-start text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}

function MobileNav({ navItems, location, handleLogout, t }: {
  navItems: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }[];
  location: string;
  handleLogout: () => void;
  t: (key: string) => string;
}) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/40">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          )
        })}
        <button onClick={handleLogout} className="flex flex-col items-center gap-1 px-2 py-1 text-destructive">
          <LogOut className="w-5 h-5" />
          <span className="text-[10px]">{t('nav.logout')}</span>
        </button>
      </div>
    </nav>
  )
}
