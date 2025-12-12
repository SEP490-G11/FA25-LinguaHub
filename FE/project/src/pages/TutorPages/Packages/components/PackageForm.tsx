import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PackageFormProps, PackageFormData, packageFormSchema } from '../types';
import BackButton from './BackButton';
import SlotContentManager from './SlotContentManager';

const PackageForm: React.FC<PackageFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  // Initialize React Hook Form with Zod validation
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: '',
      description: '',
      requirement: '',
      objectives: '',
      max_slots: 1,
      slot_content: []
    },
    mode: 'onBlur' // Validate on blur for better UX
  });

  // Watch field values for character counters
  const nameValue = watch('name') || '';
  const descriptionValue = watch('description') || '';
  const requirementValue = watch('requirement') || '';
  const objectivesValue = watch('objectives') || '';
  const maxSlotsValue = watch('max_slots');
  const slotContentValue = watch('slot_content');

  // Initialize form data when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        description: initialData.description || '',
        requirement: initialData.requirement || '',
        objectives: initialData.objectives || '',
        max_slots: initialData.max_slots || 1,
        slot_content: initialData.slot_content || []
      });
    }
  }, [initialData, reset]);

  // Handle form submission
  const onFormSubmit = async (data: PackageFormData) => {
    await onSubmit(data);
  };

  // Transform slot content errors for SlotContentManager
  const slotContentErrors = errors.slot_content
    ? (Array.isArray(errors.slot_content)
        ? errors.slot_content.reduce((acc, error, index) => {
            if (error) {
              acc[index] = {
                content: error.content?.message
              };
            }
            return acc;
          }, {} as Record<number, { content?: string }>)
        : {})
    : {};

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <BackButton onClick={onCancel} />
      </div>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {mode === 'create' ? 'Tạo gói dịch vụ mới' : 'Chỉnh sửa gói dịch vụ'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Package Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Tên gói dịch vụ <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    type="text"
                    placeholder="Nhập tên gói dịch vụ (ví dụ: Khóa học tiếng Anh giao tiếp cơ bản)"
                    className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    disabled={isLoading}
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
              <p className="text-xs text-gray-500">
                {nameValue.length}/200 ký tự
              </p>
            </div>

            {/* Package Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Mô tả gói dịch vụ <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="description"
                    placeholder="Nhập mô tả chi tiết về gói dịch vụ, bao gồm nội dung, phương pháp giảng dạy..."
                    className={errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    rows={4}
                    disabled={isLoading}
                  />
                )}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
              <p className="text-xs text-gray-500">
                {descriptionValue.length}/2000 ký tự
              </p>
            </div>

            {/* Requirement */}
            <div className="space-y-2">
              <Label htmlFor="requirement" className="text-sm font-medium">
                Yêu cầu <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="requirement"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="requirement"
                    placeholder="Nhập yêu cầu đối với học viên (ví dụ: Có kiến thức cơ bản về ngữ pháp, có laptop...)"
                    className={errors.requirement ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    rows={3}
                    disabled={isLoading}
                  />
                )}
              />
              {errors.requirement && (
                <p className="text-sm text-red-500">{errors.requirement.message}</p>
              )}
              <p className="text-xs text-gray-500">
                {requirementValue.length}/1000 ký tự
              </p>
            </div>

            {/* Objectives */}
            <div className="space-y-2">
              <Label htmlFor="objectives" className="text-sm font-medium">
                Mục tiêu <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="objectives"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="objectives"
                    placeholder="Nhập mục tiêu của khóa học (ví dụ: Học viên có thể giao tiếp tiếng Anh cơ bản...)"
                    className={errors.objectives ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    rows={3}
                    disabled={isLoading}
                  />
                )}
              />
              {errors.objectives && (
                <p className="text-sm text-red-500">{errors.objectives.message}</p>
              )}
              <p className="text-xs text-gray-500">
                {objectivesValue.length}/1000 ký tự
              </p>
            </div>

            {/* Max Slots */}
            <div className="space-y-2">
              <Label htmlFor="max_slots" className="text-sm font-medium">
                Số slot tối đa <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="max_slots"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="max_slots"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Nhập số slot tối đa (1-100)"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    className={errors.max_slots ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    disabled={isLoading}
                  />
                )}
              />
              {errors.max_slots && (
                <p className="text-sm text-red-500">{errors.max_slots.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Số lượng học viên tối đa có thể tham gia gói dịch vụ này
              </p>
            </div>

            {/* Slot Content Manager */}
            <Controller
              name="slot_content"
              control={control}
              render={({ field }) => (
                <SlotContentManager
                  slots={field.value}
                  onChange={field.onChange}
                  errors={slotContentErrors}
                  maxSlots={maxSlotsValue}
                />
              )}
            />
            {errors.slot_content && !Array.isArray(errors.slot_content) && errors.slot_content.message && (
              <p className="text-sm text-red-500">{errors.slot_content.message}</p>
            )}
            {maxSlotsValue && slotContentValue.length !== maxSlotsValue && (
              <p className="text-sm text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Số lượng slot hiện tại ({slotContentValue.length}) phải bằng số slot tối đa ({maxSlotsValue})
              </p>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isLoading || (maxSlotsValue && slotContentValue.length !== maxSlotsValue)}
                className="flex-1"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {mode === 'create' ? 'Tạo gói dịch vụ' : 'Cập nhật gói dịch vụ'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PackageForm;