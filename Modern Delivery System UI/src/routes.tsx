import { createBrowserRouter } from 'react-router';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import MainLayout from './components/MainLayout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CreateOrderPage from './pages/customer/CreateOrderPage';
import OrderListPage from './pages/customer/OrderListPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import ProfilePage from './pages/customer/ProfilePage';
import AddressPage from './pages/customer/AddressPage';
import VoucherListPage from './pages/customer/VoucherListPage';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverOrdersPage from './pages/driver/DriverOrdersPage';
import DriverWalletPage from './pages/driver/DriverWalletPage';
import DriverProfilePage from './pages/driver/DriverProfilePage';
import DriverReviewsPage from './pages/driver/DriverReviewsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminLogsPage from './pages/admin/AdminLogsPage';
import AdminVouchersPage from './pages/admin/AdminVouchersPage';
import NotificationPage from './pages/NotificationPage';

function WithLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // Customer routes
  { path: '/', element: <WithLayout><CustomerDashboard /></WithLayout> },
  { path: '/orders', element: <WithLayout><OrderListPage /></WithLayout> },
  { path: '/orders/new', element: <WithLayout><CreateOrderPage /></WithLayout> },
  { path: '/orders/:id', element: <WithLayout><OrderDetailPage /></WithLayout> },
  { path: '/profile', element: <WithLayout><ProfilePage /></WithLayout> },
  { path: '/profile/addresses', element: <WithLayout><AddressPage /></WithLayout> },
  { path: '/vouchers', element: <WithLayout><VoucherListPage /></WithLayout> },

  // Driver routes
  { path: '/driver', element: <WithLayout><DriverDashboard /></WithLayout> },
  { path: '/driver/orders', element: <WithLayout><DriverOrdersPage /></WithLayout> },
  { path: '/driver/wallet', element: <WithLayout><DriverWalletPage /></WithLayout> },
  { path: '/driver/profile', element: <WithLayout><DriverProfilePage /></WithLayout> },
  { path: '/driver/reviews', element: <WithLayout><DriverReviewsPage /></WithLayout> },

  // Admin routes
  { path: '/admin', element: <WithLayout><AdminDashboard /></WithLayout> },
  { path: '/admin/users', element: <WithLayout><AdminUsersPage /></WithLayout> },
  { path: '/admin/users/:id', element: <WithLayout><AdminUserDetailPage /></WithLayout> },
  { path: '/admin/orders', element: <WithLayout><AdminOrdersPage /></WithLayout> },
  { path: '/admin/logs', element: <WithLayout><AdminLogsPage /></WithLayout> },
  { path: '/admin/vouchers', element: <WithLayout><AdminVouchersPage /></WithLayout> },

  // Common
  { path: '/notifications', element: <WithLayout><NotificationPage /></WithLayout> },
]);
