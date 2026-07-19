import { lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { setAuthTokenGetter } from '@workspace/api-client-react/src/custom-fetch';
import './i18n/i18n';

import Home from '@/pages/home';
import CategoryPage from '@/pages/category';
import WatchPage from '@/pages/watch';
import SearchPage from '@/pages/search';
import FavoritesPage from '@/pages/favorites';

const AdminLogin = lazy(() => import('@/pages/admin/login'));
const AdminDashboard = lazy(() => import('@/pages/admin/dashboard'));
const AdminChannels = lazy(() => import('@/pages/admin/channels'));
const AdminCategories = lazy(() => import('@/pages/admin/categories'));
const AdminSettings = lazy(() => import('@/pages/admin/settings'));
const AdminSources = lazy(() => import('@/pages/admin/sources'));
const AdminBackup = lazy(() => import('@/pages/admin/backup'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

setAuthTokenGetter(() => localStorage.getItem('engtv_admin_token'));

function Router() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <Switch>
        {/* Viewer Routes */}
        <Route path="/" component={Home} />
        <Route path="/category/:id" component={CategoryPage} />
        <Route path="/watch/:id" component={WatchPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/favorites" component={FavoritesPage} />

        {/* Admin Routes (lazy loaded) */}
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/channels" component={AdminChannels} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/sources" component={AdminSources} />
        <Route path="/admin/backup" component={AdminBackup} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
