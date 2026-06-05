import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
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
      <Layout user={null}>
        <LoadingState />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout user={null}>
        <ErrorState message={error} onRetry={() => void loadUser()} />
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/services/:serviceId" element={<ServicePage />} />
        <Route path="/services/:serviceId/order" element={<OrderFormPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        <Route path="/orders/:orderId/review" element={<ReviewPage />} />
        <Route path="/profile" element={<ProfilePage user={user} />} />
        <Route path="/admin" element={user?.is_admin ? <AdminPage /> : <Navigate to="/" replace />} />
        <Route path="/admin/orders/:orderId" element={user?.is_admin ? <AdminPage /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
