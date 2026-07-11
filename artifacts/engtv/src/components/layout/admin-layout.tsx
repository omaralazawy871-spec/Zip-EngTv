import { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { LayoutDashboard, Tv, FolderTree, Settings, LogOut, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setAuthTokenGetter } from '@workspace/api-client-react/src/custom-fetch';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

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
    { href: '/admin', icon: LayoutDashboard, label: 'لوحة القيادة' },
    { href: '/admin/channels', icon: Tv, label: 'القنوات' },
    { href: '/admin/categories', icon: FolderTree, label: 'التصنيفات' },
    { href: '/admin/sources', icon: Radio, label: 'مصادر IPTV' },
    { href: '/admin/settings', icon: Settings, label: 'الإعدادات' },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
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
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
