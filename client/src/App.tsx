import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/context/AuthProvider';
import { homeFor, useAuth } from '@/context/auth';
import Index from './pages/Index';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Dashboards are only needed after login, so load them on demand.
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

const FullPageSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="animate-spin text-primary" size={36} />
  </div>
);

function ProtectedRoute({ children, role }: { children: ReactNode; role: 'student' | 'admin' }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Suspense fallback={<FullPageSpinner />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/student-dashboard"
                element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>}
              />
              <Route
                path="/admin-dashboard"
                element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
