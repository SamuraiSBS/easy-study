import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MotionProvider, PageTransition } from './components/Motion';
import { ErrorState, LoadingState } from './components/State';
import { useTelegram } from './hooks/useTelegram';
import { AdminPage } from './pages/AdminPage';
import { HomePage } from './pages/HomePage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrderFormPage } from './pages/OrderFormPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReviewPage } from './pages/ReviewPage';
import { ServicePage } from './pages/ServicePage';
import { api } from './services/api';
import type { User } from './types';

export function App() {
  useTelegram();
  const location = useLocation();
  const navigationType = useNavigationType();
  const pageDirection = navigationType === 'POP' ? -1 : 1;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUser() {
    setLoading(true);
    setError(null);
    try {
      setUser(await api.getMe());
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : 'Не удалось авторизоваться');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUser();
  }, []);

  if (loading) {
    return (
      <MotionProvider>
        <Layout user={null}>
          <LoadingState />
        </Layout>
      </MotionProvider>
    );
  }

  if (error) {
    return (
      <MotionProvider>
        <Layout user={null}>
          <ErrorState message={error} onRetry={() => void loadUser()} />
        </Layout>
      </MotionProvider>
    );
  }

  return (
    <MotionProvider>
      <Layout user={user}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition direction={pageDirection}><HomePage /></PageTransition>} />
            <Route path="/services" element={<PageTransition direction={pageDirection}><HomePage /></PageTransition>} />
            <Route path="/services/:serviceId" element={<PageTransition direction={pageDirection}><ServicePage /></PageTransition>} />
            <Route path="/services/:serviceId/order" element={<PageTransition direction={pageDirection}><OrderFormPage /></PageTransition>} />
            <Route path="/orders" element={<PageTransition direction={pageDirection}><OrdersPage /></PageTransition>} />
            <Route path="/orders/:orderId" element={<PageTransition direction={pageDirection}><OrderDetailPage /></PageTransition>} />
            <Route path="/orders/:orderId/review" element={<PageTransition direction={pageDirection}><ReviewPage /></PageTransition>} />
            <Route path="/profile" element={<PageTransition direction={pageDirection}><ProfilePage user={user} /></PageTransition>} />
            <Route path="/admin" element={user?.is_admin ? <PageTransition direction={pageDirection}><AdminPage /></PageTransition> : <Navigate to="/" replace />} />
            <Route path="/admin/orders/:orderId" element={user?.is_admin ? <PageTransition direction={pageDirection}><AdminPage /></PageTransition> : <Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </MotionProvider>
  );
}
