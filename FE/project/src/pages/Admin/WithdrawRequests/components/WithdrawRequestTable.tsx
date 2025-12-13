import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, Building2, Calendar, CreditCard, DollarSign } from 'lucide-react';
import { WithdrawRequest } from '../types';
import { formatCurrency, formatDate, getStatusColor } from '../utils';
import { ActionButtons } from './ActionButtons';

interface WithdrawRequestTableProps {
  requests: WithdrawRequest[];
  processingIds: Set<number>;
  onApprove: (withdrawId: number) => Promise<void>;
  onReject: (withdrawId: number) => Promise<void>;
}

export function WithdrawRequestTable({
  requests,
  processingIds,
  onApprove,
  onReject,
}: WithdrawRequestTableProps) {
  // Desktop table view
  const renderDesktopTable = () => (
    <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700 w-[80px]">Mã YC</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[80px]">Tutor ID</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right w-[120px]">Tổng tiền</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right w-[120px]">Số tiền rút</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right w-[100px]">Hoa hồng</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[140px]">Số TK</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[120px]">Ngân hàng</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[140px]">Chủ TK</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[100px]">Trạng thái</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[150px]">Ngày tạo</TableHead>
              <TableHead className="font-semibold text-gray-700 w-[140px] text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.withdrawId} className="hover:bg-gray-50">
                {/* Withdraw ID */}
                <TableCell className="font-medium">
                  <div className="font-semibold text-gray-900">#{request.withdrawId}</div>
                </TableCell>

                {/* Tutor ID */}
                <TableCell className="text-sm text-gray-600">
                  {request.tutorId}
                </TableCell>

                {/* Total Amount */}
                <TableCell className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(request.totalAmount)}
                  </div>
                </TableCell>

                {/* Withdraw Amount */}
                <TableCell className="text-right">
                  <div className="font-bold text-blue-600">
                    {formatCurrency(request.withdrawAmount)}
                  </div>
                </TableCell>

                {/* Commission */}
                <TableCell className="text-right">
                  <div className="font-semibold text-orange-600">
                    {formatCurrency(request.commission)}
                  </div>
                </TableCell>

                {/* Bank Account Number */}
                <TableCell className="text-sm text-gray-600 font-mono">
                  {request.bankAccountNumber}
                </TableCell>

                {/* Bank Name */}
                <TableCell className="text-sm text-gray-700 font-medium">
                  {request.bankName}
                </TableCell>

                {/* Bank Owner Name */}
                <TableCell className="text-sm text-gray-700">
                  {request.bankOwnerName}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge
                    variant={
                      request.status === 'APPROVED'
                        ? 'default'
                        : request.status === 'REJECTED'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className={`${
                      request.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300'
                        : request.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300'
                        : ''
                    } font-semibold`}
                  >
                    {request.status}
                  </Badge>
                </TableCell>

                {/* Created At */}
                <TableCell className="text-sm text-gray-600">
                  {formatDate(request.createdAt)}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center justify-center">
                    <ActionButtons
                      withdrawId={request.withdrawId}
                      status={request.status}
                      isProcessing={processingIds.has(request.withdrawId)}
                      onApprove={onApprove}
                      onReject={onReject}
                      tutorId={request.tutorId}
                      withdrawAmount={request.withdrawAmount}
                      bankName={request.bankName}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  // Mobile card view
  const renderMobileCards = () => (
    <div className="md:hidden space-y-4">
      {requests.map((request) => (
        <Card
          key={request.withdrawId}
          className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200"
        >
          <CardContent className="p-5">
            {/* Header: Withdraw ID and Status */}
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900">
                  Yêu cầu #{request.withdrawId}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Tutor ID: {request.tutorId}
                </p>
              </div>
              <Badge
                variant={
                  request.status === 'APPROVED'
                    ? 'default'
                    : request.status === 'REJECTED'
                    ? 'destructive'
                    : 'secondary'
                }
                className={`${
                  request.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300'
                    : request.status === 'APPROVED'
                    ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300'
                    : ''
                } font-semibold shadow-sm ml-2 flex-shrink-0`}
              >
                {request.status}
              </Badge>
            </div>

            {/* Amounts - Prominent Display */}
            <div className="mb-4 space-y-2">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Số tiền rút</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(request.withdrawAmount)}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Tổng tiền</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(request.totalAmount)}
                  </p>
                </div>
                <div className="flex-1 p-2 bg-orange-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Hoa hồng</p>
                  <p className="text-sm font-semibold text-orange-600">
                    {formatCurrency(request.commission)}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Information */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-gray-500">Ngân hàng:</span>
                <span className="font-medium text-gray-900">{request.bankName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-500">Số TK:</span>
                <span className="font-mono font-medium text-gray-900">
                  {request.bankAccountNumber}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="text-gray-500">Chủ TK:</span>
                <span className="font-medium text-gray-900">{request.bankOwnerName}</span>
              </div>
            </div>

            {/* Created Date */}
            <div className="mb-4 flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-500">Ngày tạo:</span>
              <span className="font-medium">{formatDate(request.createdAt)}</span>
            </div>

            {/* Actions */}
            {request.status === 'PENDING' && (
              <div className="pt-3 border-t border-gray-100">
                <ActionButtons
                  withdrawId={request.withdrawId}
                  status={request.status}
                  isProcessing={processingIds.has(request.withdrawId)}
                  onApprove={onApprove}
                  onReject={onReject}
                  tutorId={request.tutorId}
                  withdrawAmount={request.withdrawAmount}
                  bankName={request.bankName}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      {renderDesktopTable()}
      {renderMobileCards()}
    </>
  );
}
