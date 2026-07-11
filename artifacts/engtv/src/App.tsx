import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useEffect } from 'react';
import { setAuthTokenGetter } from '@workspace/api-client-react/src/custom-fetch';

import Home from '@/pages/home';
import CategoryPage from '@/pages/category';
import WatchPage from '@/pages/watch';
import SearchPage from '@/pages/search';
import FavoritesPage from '@/pages/favorites';

import AdminLogin from '@/pages/admin/login';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminChannels from '@/pages/admin/channels';
import AdminCategories from '@/pages/admin/categories';
import AdminSettings from '@/pages/admin/settings';
import AdminSources from '@/pages/admin/sources';

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
    <Switch>
      {/* Viewer Routes */}
      <Route path="/" component={Home} />
      <Route path="/category/:id" component={CategoryPage} />
      <Route path="/watch/:id" component={WatchPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/favorites" component={FavoritesPage} />

      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/channels" component={AdminChannels} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/sources" component={AdminSources} />

      <Route component={NotFound} />
    </Switch>
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
