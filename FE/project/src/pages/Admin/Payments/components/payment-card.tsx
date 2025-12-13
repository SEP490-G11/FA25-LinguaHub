import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  User, 
  Calendar, 
  ExternalLink,
  QrCode,
  BookOpen,
  CalendarCheck,
  Package
} from 'lucide-react';
import { Payment, PaymentMethod, PaymentType } from '../types';
import { formatCurrency, formatDate, getStatusColor } from '../utils';

interface PaymentCardProps {
  payment: Payment;
}

export function PaymentCard({ payment }: PaymentCardProps) {
  // Get payment method icon
  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'PAYOS':
        return <CreditCard className="w-4 h-4" />;
      case 'MOMO':
        return <Smartphone className="w-4 h-4" />;
      case 'VNPAY':
        return <Building2 className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  // Get payment type icon
  const getPaymentTypeIcon = (type: PaymentType) => {
    switch (type) {
      case 'Course':
        return <BookOpen className="w-4 h-4" />;
      case 'Booking':
        return <CalendarCheck className="w-4 h-4" />;
      case 'Subscription':
        return <Package className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  // Truncate description if too long
  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200 group flex flex-col h-full">
      <CardContent className="p-5 flex flex-col h-full">
        {/* Header: Order Code and Status */}
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {payment.orderCode}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">ID: {payment.paymentID}</p>
          </div>
          <Badge className={`${getStatusColor(payment.status)} font-semibold shadow-sm ml-2 flex-shrink-0`}>
            {payment.status}
          </Badge>
        </div>

        {/* Amount - Prominent Display */}
        <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Số tiền</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(payment.amount)}
          </p>
        </div>

        {/* Payment Type and Method Badges */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            {getPaymentTypeIcon(payment.paymentType)}
            {payment.paymentType}
          </Badge>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            {getPaymentMethodIcon(payment.paymentMethod)}
            {payment.paymentMethod}
          </Badge>
        </div>

        {/* User Information */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-xs text-gray-500">User ID:</span>
            <span className="font-medium">{payment.userId}</span>
          </div>
          {payment.tutorId && (
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span className="text-xs text-gray-500">Tutor ID:</span>
              <span className="font-medium">{payment.tutorId}</span>
            </div>
          )}
          {payment.targetId && (
            <div className="flex items-center gap-2 text-gray-600">
              <Package className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-xs text-gray-500">Target ID:</span>
              <span className="font-medium">{payment.targetId}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {payment.description && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Mô tả</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {truncateDescription(payment.description)}
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className="space-y-2 mb-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-500">Tạo:</span>
            <span className="font-medium">{formatDate(payment.createdAt)}</span>
          </div>
          {payment.paidAt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span className="text-gray-500">Thanh toán:</span>
              <span className="font-medium">{formatDate(payment.paidAt)}</span>
            </div>
          )}
          {payment.expiresAt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span className="text-gray-500">Hết hạn:</span>
              <span className="font-medium">{formatDate(payment.expiresAt)}</span>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* QR Code and Checkout URL */}
        <div className="space-y-2 mt-auto pt-3 border-t border-gray-100">
          {payment.qrCodeUrl && (
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <img 
                src={payment.qrCodeUrl} 
                alt="QR Code" 
                className="w-16 h-16 border border-gray-200 rounded"
              />
            </div>
          )}
          {payment.checkoutUrl && (
            <a
              href={payment.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              <span>Xem link thanh toán</span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
