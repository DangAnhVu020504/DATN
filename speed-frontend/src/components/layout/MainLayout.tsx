import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/redux/store';
import { logout } from '@/redux/slices/authSlice';

type Role = 'customer' | 'driver' | 'admin';

const navItems: Record<Role, { path: string; label: string; icon: string }[]> = {
  customer: [
    { path: '/', label: 'Tổng quan', icon: '🏠' },
    { path: '/orders', label: 'Đơn hàng', icon: '📦' },
    { path: '/orders/new', label: 'Tạo đơn mới', icon: '➕' },
    { path: '/vouchers', label: 'Voucher', icon: '🎟️' },
    { path: '/profile', label: 'Hồ sơ', icon: '👤' },
    { path: '/notifications', label: 'Thông báo', icon: '🔔' },
  ],
  driver: [
    { path: '/driver', label: 'Tổng quan', icon: '🏠' },
    { path: '/driver/orders', label: 'Lịch sử giao', icon: '📋' },
    { path: '/driver/wallet', label: 'Ví tiền', icon: '💰' },
    { path: '/driver/profile', label: 'Hồ sơ', icon: '👤' },
    { path: '/driver/reviews', label: 'Đánh giá', icon: '⭐' },
    { path: '/notifications', label: 'Thông báo', icon: '🔔' },
  ],
  admin: [
    { path: '/admin', label: 'Tổng quan', icon: '🛡️' },
    { path: '/admin/orders', label: 'Đơn hàng', icon: '📦' },
    { path: '/admin/users', label: 'Người dùng', icon: '👥' },
    { path: '/admin/vouchers', label: 'Voucher', icon: '🎟️' },
    { path: '/admin/logs', label: 'Audit Logs', icon: '📜' },
    { path: '/notifications', label: 'Thông báo', icon: '🔔' },
  ],
};

const roleLabels: Record<Role, string> = {
  customer: 'Khách hàng',
  driver: 'Tài xế',
  admin: 'Quản trị',
};

export default function MainLayout() {
  const { pathname: location } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roles = user?.roles ?? [];
  const role: Role = roles.includes('ROLE_ADMIN') || roles.includes('ADMIN')
    ? 'admin'
    : roles.includes('ROLE_DRIVER') || roles.includes('DRIVER')
      ? 'driver'
      : 'customer';

  const nav = navItems[role];
  const userName = user?.fullName ?? 'Người dùng';
  const userEmail = user?.email ?? '';
  const avatar = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/' || path === '/driver' || path === '/admin') {
      return location === path;
    }
    return location.startsWith(path);
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-white shadow-xl transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-10 h-10 bg-red-gradient rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-black text-lg" style={{ fontFamily: 'Nunito' }}>S</span>
          </div>
          <div>
            <div className="font-black text-gray-900 text-lg leading-tight" style={{ fontFamily: 'Nunito' }}>
              Speed
            </div>
            <div className="text-xs text-gray-400 font-medium">Delivery System</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-3 mb-3">
            {roleLabels[role]}
          </div>
          <ul className="space-y-1">
            {nav.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive(item.path)
                      ? 'nav-active shadow-sm'
                      : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-red-gradient rounded-full flex items-center justify-center text-white font-bold text-sm shadow">
              {avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{userName}</div>
              <div className="text-xs text-gray-400 truncate">{userEmail}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 border border-red-100"
          >
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
            id="mobile-menu-button"
          >
            <div className="space-y-1">
              <span className="block w-5 h-0.5 bg-gray-700" />
              <span className="block w-5 h-0.5 bg-gray-700" />
              <span className="block w-5 h-0.5 bg-gray-700" />
            </div>
          </button>
          <div className="font-black text-gray-900 text-lg" style={{ fontFamily: 'Nunito' }}>Speed</div>
          <div className="w-8 h-8 bg-red-gradient rounded-full flex items-center justify-center text-white font-bold text-sm">
            {avatar}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { type Role, navItems };
