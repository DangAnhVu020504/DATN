// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: string;
}

export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  customerId: number | null;
  driverId: number | null;
  email: string;
  fullName: string;
  roles: string[];
}

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  roles: string[];
  createdAt: string;
}

// Order types
export interface CreateOrderRequest {
  pickupAddress: string;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryAddress: string;
  deliveryContactName: string;
  deliveryContactPhone: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  packageDescription?: string;
  packageWeight?: number;
  packageNote?: string;
  deliveryType: string;
  scheduledTime?: string;
  paymentMethod?: string;
  voucherCode?: string;
}

export interface OrderResponse {
  id: number;
  orderCode: string;
  customerId: number;
  customerName: string;
  driverId: number | null;
  driverName: string | null;
  driverPhone: string | null;
  pickupAddress: string;
  pickupContactName: string;
  pickupContactPhone: string;
  deliveryAddress: string;
  deliveryContactName: string;
  deliveryContactPhone: string;
  packageDescription: string;
  packageWeight: number;
  packageNote?: string | null;
  distanceKm?: number | null;
  basePrice?: number | null;
  distancePrice?: number | null;
  weightSurcharge?: number | null;
  totalPrice: number;
  discountAmount: number;
  status: string;
  deliveryType: string;
  scheduledTime?: string | null;
  createdAt: string;
  acceptedAt?: string | null;
  deliveredAt: string | null;
}

export interface OrderHistoryResponse {
  id: number;
  status: string;
  note: string | null;
  changedBy: number | null;
  createdAt: string;
}

export interface DashboardResponse {
  totalOrders: number;
  totalCustomers: number;
  totalDrivers: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveringOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
  timestamp: string;
}

// Page
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Address types
export interface AddressRequest {
  label?: string;
  contactName: string;
  contactPhone: string;
  addressLine: string;
  ward?: string;
  district?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface AddressResponse {
  id: number;
  label: string | null;
  contactName: string;
  contactPhone: string;
  addressLine: string;
  ward: string | null;
  district: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

// Voucher types
export interface VoucherRequest {
  code: string;
  description?: string;
  discountType: string; // PERCENTAGE | FIXED_AMOUNT
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  startDate: string;
  endDate: string;
}

export interface VoucherResponse {
  id: number;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number | null;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// Wallet types
export interface WalletResponse {
  id: number;
  driverId: number;
  driverName: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResponse {
  id: number;
  type: string; // CREDIT | DEBIT
  amount: number;
  balanceAfter: number;
  description: string;
  orderId: number | null;
  createdAt: string;
}

// Review types
export interface ReviewResponse {
  id: number;
  orderId: number;
  customerName: string;
  driverName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

// Notification types
export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  referenceId: number | null;
  createdAt: string;
}

// Audit log types
export interface LogResponse {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  createdAt: string;
}

// Update profile
export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

// Driver profile
export interface DriverProfileResponse {
  id: number;
  userId: number;
  fullName: string;
  phone: string | null;
  email: string;
  avatarUrl: string | null;
  licensePlate: string | null;
  vehicleType: string | null;
  status: string;
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
}
