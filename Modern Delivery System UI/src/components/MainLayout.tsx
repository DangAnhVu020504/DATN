import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

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

const userData: Record<Role, { name: string; email: string; avatar: string }> = {
  customer: { name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', avatar: 'A' },
  driver: { name: 'Trần Minh Khoa', email: 'khoa.driver@speed.vn', avatar: 'K' },
  admin: { name: 'Admin System', email: 'admin@speed.vn', avatar: 'S' },
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Detect role from path
  const getRole = (): Role => {
    if (location.pathname.startsWith('/admin')) return 'admin';
    if (location.pathname.startsWith('/driver')) return 'driver';
    return 'customer';
  };
  const role = getRole();
  const nav = navItems[role];
  const user = userData[role];

  const handleLogout = () => navigate('/login');

  const isActive = (path: string) => {
    if (path === '/' || path === '/driver' || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
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

        {/* Role switcher demo */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Demo: Chuyển vai trò</div>
          <div className="flex gap-1">
            {(['customer', 'driver', 'admin'] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => navigate(r === 'customer' ? '/' : r === 'driver' ? '/driver' : '/admin')}
                className={`flex-1 py-1 px-1 text-xs rounded-lg font-medium transition-all duration-200 ${
                  role === r
                    ? 'bg-red-gradient text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {r === 'customer' ? 'KH' : r === 'driver' ? 'TX' : 'QT'}
              </button>
            ))}
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
                  {item.label === 'Thông báo' && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">3</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-red-gradient rounded-full flex items-center justify-center text-white font-bold text-sm shadow">
              {user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
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
          >
            <div className="space-y-1">
              <span className="block w-5 h-0.5 bg-gray-700" />
              <span className="block w-5 h-0.5 bg-gray-700" />
              <span className="block w-5 h-0.5 bg-gray-700" />
            </div>
          </button>
          <div className="font-black text-gray-900 text-lg" style={{ fontFamily: 'Nunito' }}>Speed</div>
          <div className="w-8 h-8 bg-red-gradient rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user.avatar}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
