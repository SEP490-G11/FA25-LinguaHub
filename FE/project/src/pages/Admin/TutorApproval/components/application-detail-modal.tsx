import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Languages,
  Briefcase,
  Award,
  FileText,
  ExternalLink,
  Calendar,
  Mail,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Application, ApprovalFormData } from '../types';

const approvalSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    message: 'Please select a decision',
  }),
  adminNotes: z.string().optional(),
});

interface ApplicationDetailModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (applicationId: string, adminNotes?: string) => void;
  onReject: (applicationId: string, rejectionReason: string) => void;
  isLoading: boolean;
}

export default function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isLoading,
}: ApplicationDetailModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
  });

  const selectedStatus = watch('status');

  const onSubmit = (data: ApprovalFormData) => {
    if (data.status === 'approved') {
      onApprove(application.id, data.adminNotes);
    } else {
      onReject(application.id, data.adminNotes || 'No reason provided');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getStatusBadge = (status: Application['status']) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Tutor Application Details
              </DialogTitle>
              <DialogDescription className="mt-2">
                Review the application information and make a decision
              </DialogDescription>
            </div>
            {getStatusBadge(application.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <User className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Applicant Name</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {application.applicantName}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <Mail className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {application.applicantEmail}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Applied Date</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {application.appliedDate}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <Briefcase className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Experience</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {application.experience} years
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center text-slate-600 dark:text-slate-400">
              <Languages className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Teaching Languages</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {application.teachingLanguages.map((lang, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-sm px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-slate-600 dark:text-slate-400">
              <Award className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Specialization</span>
            </div>
            <p className="text-base text-slate-900 dark:text-slate-50">
              {application.specialization}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-slate-600 dark:text-slate-400">
              <FileText className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Bio</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {application.bio}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Certificate Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-slate-600 dark:text-slate-400">
                  Certificate Name
                </Label>
                <p className="text-base font-medium text-slate-900 dark:text-slate-50">
                  {application.certificateName}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-600 dark:text-slate-400">
                  Certificate Document
                </Label>
                <a
                  href={application.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  View Certificate
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </div>

          {application.status === 'pending' && (
            <>
              <Separator />
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Review Decision
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="status">
                    Decision <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value: 'approved' | 'rejected') =>
                      setValue('status', value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger
                      id="status"
                      className={errors.status ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Select a decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Approve Application
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center">
                          <XCircle className="h-4 w-4 mr-2 text-red-600" />
                          Reject Application
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-red-500">{errors.status.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add any notes about your decision..."
                    rows={4}
                    {...register('adminNotes')}
                    className="resize-none"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    These notes will be saved for internal reference
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Decision'
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
