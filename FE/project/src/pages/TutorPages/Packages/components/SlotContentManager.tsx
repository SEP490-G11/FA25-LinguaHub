import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SlotContent } from '../types';

interface SlotContentManagerProps {
  slots: SlotContent[];
  onChange: (slots: SlotContent[]) => void;
  errors?: Record<number, { content?: string }>;
  maxSlots?: number;
}

const SlotContentManager: React.FC<SlotContentManagerProps> = ({
  slots,
  onChange,
  errors = {},
  maxSlots
}) => {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // Add new slot with auto-increment slot_number
  const handleAddSlot = () => {
    // Check if we've reached max slots
    if (maxSlots && slots.length >= maxSlots) {
      return;
    }

    const maxSlotNumber = slots.length > 0 
      ? Math.max(...slots.map(s => s.slot_number))
      : 0;
    
    const newSlot: SlotContent = {
      slot_number: maxSlotNumber + 1,
      content: ''
    };

    onChange([...slots, newSlot]);
  };

  // Update slot content
  const handleSlotChange = (index: number, content: string) => {
    const updatedSlots = slots.map((slot, i) => 
      i === index ? { ...slot, content } : slot
    );
    onChange(updatedSlots);
  };

  // Delete slot with confirmation
  const handleDeleteSlot = (index: number) => {
    setDeleteIndex(index);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      const updatedSlots = slots.filter((_, i) => i !== deleteIndex);
      onChange(updatedSlots);
      setDeleteIndex(null);
    }
  };

  const cancelDelete = () => {
    setDeleteIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Nội dung các buổi học <span className="text-red-500">*</span>
          {maxSlots && (
            <span className="ml-2 text-xs text-gray-500 font-normal">
              ({slots.length}/{maxSlots} slots)
            </span>
          )}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddSlot}
          disabled={maxSlots ? slots.length >= maxSlots : false}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm slot
        </Button>
      </div>

      {slots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              Chưa có nội dung buổi học nào. Nhấn "Thêm slot" để bắt đầu.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {slots.map((slot, index) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Buổi {slot.slot_number}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSlot(index)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  placeholder={`Nhập nội dung cho buổi ${slot.slot_number}...`}
                  value={slot.content}
                  onChange={(e) => handleSlotChange(index, e.target.value)}
                  className={errors[index]?.content ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  rows={3}
                />
                {errors[index]?.content && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors[index].content}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {slot.content.length}/1000 ký tự
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa buổi học {deleteIndex !== null && slots[deleteIndex] ? slots[deleteIndex].slot_number : ''}? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SlotContentManager;
