import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import CustomerDashboard from '@/pages/customer/CustomerDashboard';
import CreateOrderPage from '@/pages/customer/CreateOrderPage';
import OrderListPage from '@/pages/customer/OrderListPage';
import OrderDetailPage from '@/pages/customer/OrderDetailPage';
import ProfilePage from '@/pages/customer/ProfilePage';
import AddressPage from '@/pages/customer/AddressPage';
import VoucherListPage from '@/pages/customer/VoucherListPage';
import DriverDashboard from '@/pages/driver/DriverDashboard';
import DriverOrdersPage from '@/pages/driver/DriverOrdersPage';
import DriverWalletPage from '@/pages/driver/DriverWalletPage';
import DriverProfilePage from '@/pages/driver/DriverProfilePage';
import DriverReviewsPage from '@/pages/driver/DriverReviewsPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminUserDetailPage from '@/pages/admin/AdminUserDetailPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminLogsPage from '@/pages/admin/AdminLogsPage';
import AdminVouchersPage from '@/pages/admin/AdminVouchersPage';
import NotificationPage from '@/pages/NotificationsPage';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Customer */}
          <Route element={
            <ProtectedRoute roles={['ROLE_CUSTOMER']}>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<CustomerDashboard />} />
            <Route path="/orders" element={<OrderListPage />} />
            <Route path="/orders/new" element={<CreateOrderPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/addresses" element={<AddressPage />} />
            <Route path="/vouchers" element={<VoucherListPage />} />
          </Route>

          {/* Driver */}
          <Route element={
            <ProtectedRoute roles={['ROLE_DRIVER']}>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/driver" element={<DriverDashboard />} />
            <Route path="/driver/orders" element={<DriverOrdersPage />} />
            <Route path="/driver/wallet" element={<DriverWalletPage />} />
            <Route path="/driver/profile" element={<DriverProfilePage />} />
            <Route path="/driver/reviews" element={<DriverReviewsPage />} />
          </Route>

          {/* Admin */}
          <Route element={
            <ProtectedRoute roles={['ROLE_ADMIN']}>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
            <Route path="/admin/vouchers" element={<AdminVouchersPage />} />
            <Route path="/admin/logs" element={<AdminLogsPage />} />
          </Route>

          {/* Common */}
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/notifications" element={<NotificationPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
