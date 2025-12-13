import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Smartphone,
  Building2,
  BookOpen,
  CalendarCheck,
  Package,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import { Payment, PaymentMethod, PaymentType } from '../types';
import { formatCurrency, formatDate, getStatusColor } from '../utils';

interface PaymentTableProps {
  payments: Payment[];
}

export function PaymentTable({ payments }: PaymentTableProps) {
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700 w-[140px]">Mã đơn</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[100px]">Trạng thái</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right w-[130px]">Số tiền</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[100px]">Loại</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[100px]">Phương thức</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[80px]">User ID</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[150px]">Ngày tạo</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[150px]">Ngày thanh toán</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[100px] text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.paymentID} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold text-gray-900">{payment.orderCode}</div>
                    <div className="text-xs text-gray-500">ID: {payment.paymentID}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(payment.status)} font-semibold`}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-bold text-blue-600">
                    {formatCurrency(payment.amount)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getPaymentTypeIcon(payment.paymentType)}
                    <span className="text-sm">{payment.paymentType}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(payment.paymentMethod)}
                    <span className="text-sm">{payment.paymentMethod}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {payment.userId}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatDate(payment.createdAt)}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {payment.paidAt ? formatDate(payment.paidAt) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    {payment.checkoutUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0"
                      >
                        <a
                          href={payment.checkoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Xem link thanh toán"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {payment.qrCodeUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0"
                      >
                        <a
                          href={payment.qrCodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Xem QR code"
                        >
                          <QrCode className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
