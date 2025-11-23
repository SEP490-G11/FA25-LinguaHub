import { useState, useEffect } from 'react';
import { DollarSign, Filter, ArrowUpDown, User, Calendar, CreditCard, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import api from '@/config/axiosConfig';

interface RefundRequest {
  refundRequestId: number;
  bookingPlanId: number;
  slotId: number;
  userId: number;
  packageId: number | null;
  refundAmount: number;
  bankAccountNumber: string | null;
  bankOwnerName: string | null;
  bankName: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUBMITTED';
  createdAt: string;
  processedAt: string | null;
}

const AdminRefundManagement = () => {
  const [allRefunds, setAllRefunds] = useState<RefundRequest[]>([]);
  const [displayedRefunds, setDisplayedRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();
  
  // Modal state
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const openBankDetailsModal = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setIsModalOpen(true);
  };
  
  const closeBankDetailsModal = () => {
    setSelectedRefund(null);
    setIsModalOpen(false);
  };

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/refund/all');
        setAllRefunds(response.data.result || []);
      } catch (error) {
        console.error('Error fetching refunds:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load refund requests',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchRefunds();
  }, [toast]);

  useEffect(() => {
    let filtered = allRefunds;
    
    if (activeFilter !== 'all') {
      filtered = filtered.filter(r => r.status.toLowerCase() === activeFilter);
    }
    
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    setDisplayedRefunds(sorted);
    setCurrentPage(1);
  }, [allRefunds, activeFilter, sortOrder]);

  const totalPages = Math.ceil(displayedRefunds.length / itemsPerPage);
  const paginatedRefunds = displayedRefunds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    pending: allRefunds.filter(r => r.status === 'PENDING').length,
    submitted: allRefunds.filter(r => r.status === 'SUBMITTED').length,
    approved: allRefunds.filter(r => r.status === 'APPROVED').length,
    rejected: allRefunds.filter(r => r.status === 'REJECTED').length,
    totalAmount: allRefunds.reduce((acc, r) => acc + r.refundAmount, 0),
  };

  const handleApprove = async (refundId: number) => {
    try {
      const response = await api.put(`/admin/refund/${refundId}/approve`);
      if (response.data.code === 0) {
        toast({ 
          title: 'Success', 
          description: response.data.message || 'Refund approved successfully' 
        });
        const allResponse = await api.get('/admin/refund/all');
        setAllRefunds(allResponse.data.result || []);
      } else {
        // Backend trả về code khác 0 (có lỗi)
        toast({ 
          variant: 'destructive', 
          description: `Thất bại: ${response.data.message || 'Failed to approve refund'}` 
        });
      }
    } catch (error: any) {
      console.error(error);
      // Lấy error message từ backend response
      const errorMessage = error?.response?.data?.message || 'Failed to approve refund';
      toast({ 
        variant: 'destructive', 
        description: `Thất bại: ${errorMessage}` 
      });
    }
  };

  const handleReject = async (refundId: number) => {
    try {
      const response = await api.put(`/admin/refund/${refundId}/reject`);
      if (response.data.code === 0) {
        toast({ 
          title: 'Success', 
          description: response.data.message || 'Refund rejected successfully' 
        });
        const allResponse = await api.get('/admin/refund/all');
        setAllRefunds(allResponse.data.result || []);
      } else {
        // Backend trả về code khác 0 (có lỗi)
        toast({ 
          variant: 'destructive', 
          description: `Thất bại: ${response.data.message || 'Failed to reject refund'}` 
        });
      }
    } catch (error: any) {
      console.error(error);
      // Lấy error message từ backend response
      const errorMessage = error?.response?.data?.message || 'Failed to reject refund';
      toast({ 
        variant: 'destructive', 
        description: `Thất bại: ${errorMessage}` 
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: <Badge className="bg-amber-100 text-amber-700"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>,
      SUBMITTED: <Badge className="bg-blue-100 text-blue-700"><AlertCircle className="w-3 h-3 mr-1" />Submitted</Badge>,
      APPROVED: <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>,
      REJECTED: <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            Refund Management
          </h1>
          <p className="text-gray-600 mt-1">Manage all refund requests</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4"><div className="text-sm text-gray-600">Total</div><div className="text-2xl font-bold">{allRefunds.length}</div></Card>
          <Card className="p-4"><div className="text-sm text-amber-600">Pending</div><div className="text-2xl font-bold text-amber-600">{stats.pending}</div></Card>
          <Card className="p-4"><div className="text-sm text-blue-600">Submitted</div><div className="text-2xl font-bold text-blue-600">{stats.submitted}</div></Card>
          <Card className="p-4"><div className="text-sm text-green-600">Approved</div><div className="text-2xl font-bold text-green-600">{stats.approved}</div></Card>
          <Card className="p-4"><div className="text-sm text-red-600">Rejected</div><div className="text-2xl font-bold text-red-600">{stats.rejected}</div></Card>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-5 h-5" />
              {['all', 'pending', 'submitted', 'approved', 'rejected'].map(f => (
                <Button key={f} variant={activeFilter === f ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5" />
              <Button variant={sortOrder === 'newest' ? 'default' : 'outline'} size="sm" onClick={() => setSortOrder('newest')}>Newest</Button>
              <Button variant={sortOrder === 'oldest' ? 'default' : 'outline'} size="sm" onClick={() => setSortOrder('oldest')}>Oldest</Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {paginatedRefunds.map((refund) => (
            <Card key={refund.refundRequestId} className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-blue-100 text-blue-600">{refund.bankOwnerName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{refund.bankOwnerName || 'No name'}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600"><User className="w-4 h-4" />User ID: {refund.userId}</div>
                      </div>
                      {getStatusBadge(refund.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4" />{new Date(refund.createdAt).toLocaleDateString()}</div>
                      {refund.bankAccountNumber && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBankDetailsModal(refund)}
                            className="text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Bank Details
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm text-gray-600">Refund Amount</div>
                      <div className="text-2xl font-bold text-blue-600">{refund.refundAmount.toLocaleString()} đ</div>
                    </div>
                  </div>
                </div>
                {refund.status === 'SUBMITTED' && (
                  <div className="flex flex-col gap-2 lg:min-w-[200px]">
                    <Button onClick={() => handleApprove(refund.refundRequestId)} className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 h-4 mr-2" />Approve</Button>
                    <Button onClick={() => handleReject(refund.refundRequestId)} variant="destructive"><XCircle className="w-4 h-4 mr-2" />Reject</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)} className="w-10">{page}</Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
          </div>
        )}
        
        {/* Bank Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Bank Account Details
              </DialogTitle>
              <DialogDescription>
                Refund amount: <span className="font-bold text-blue-600">{selectedRefund?.refundAmount.toLocaleString()} đ</span>
              </DialogDescription>
            </DialogHeader>
            
            {selectedRefund && (
              <div className="space-y-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Bank Name</div>
                    <div className="font-semibold text-gray-900">
                      {selectedRefund.bankName || 'Not provided'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Account Holder Name</div>
                    <div className="font-semibold text-gray-900">
                      {selectedRefund.bankOwnerName || 'Not provided'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Account Number</div>
                    <div className="font-semibold text-gray-900 text-lg">
                      {selectedRefund.bankAccountNumber || 'Not provided'}
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-800">
                    <strong>User ID:</strong> {selectedRefund.userId}
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>Created:</strong> {new Date(selectedRefund.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>Status:</strong> {selectedRefund.status}
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={closeBankDetailsModal}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  {selectedRefund.status === 'SUBMITTED' && (
                    <>
                      <Button
                        onClick={() => {
                          handleApprove(selectedRefund.refundRequestId);
                          closeBankDetailsModal();
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          handleReject(selectedRefund.refundRequestId);
                          closeBankDetailsModal();
                        }}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminRefundManagement;
