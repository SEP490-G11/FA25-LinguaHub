import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export interface ObjectiveItem {
  id?: string;
  objectiveText: string;
  orderIndex: number;
}

interface CourseObjectivesProps {
  objectives: ObjectiveItem[];
  onNext: (objectives: ObjectiveItem[]) => void;
  onBack: () => void;
  onDeleteObjective?: (objectiveId: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function CourseObjectives({
  objectives,
  onNext,
  onBack,
  onDeleteObjective,
  isSubmitting = false,
}: CourseObjectivesProps) {
  const [objectivesList, setObjectivesList] = useState<ObjectiveItem[]>(
    objectives.length > 0 ? objectives : []
  );
  const [newObjectiveText, setNewObjectiveText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddObjective = () => {
    const error: Record<string, string> = {};

    if (!newObjectiveText.trim()) {
      error.objectiveText = 'Nội dung mục tiêu là bắt buộc';
    } else if (newObjectiveText.trim().length < 5) {
      error.objectiveText = 'Mục tiêu phải có ít nhất 5 ký tự';
    } else if (newObjectiveText.trim().length > 200) {
      error.objectiveText = 'Mục tiêu không được vượt quá 200 ký tự';
    }

    if (Object.keys(error).length > 0) {
      setErrors(error);
      return;
    }

    const newObjective: ObjectiveItem = {
      objectiveText: newObjectiveText.trim(),
      orderIndex: objectivesList.length,
    };

    setObjectivesList([...objectivesList, newObjective]);
    setNewObjectiveText('');
    setErrors({});
  };

  const handleUpdateObjective = (index: number, text: string) => {
    const updated = [...objectivesList];
    updated[index].objectiveText = text;
    setObjectivesList(updated);
  };

  const handleRemoveObjective = async (index: number) => {
    const objectiveToRemove = objectivesList[index];

    // If objective has an ID (already saved to DB), call DELETE API
    if (onDeleteObjective && objectiveToRemove.id) {
      try {
        await onDeleteObjective(objectiveToRemove.id);
      } catch (error) {
        console.error('Failed to delete objective:', error);
        // Don't remove from UI if API call failed
        return;
      }
    }

    const updated = objectivesList.filter((_, i) => i !== index);
    // Update orderIndex for remaining items
    const reordered = updated.map((obj, i) => ({
      ...obj,
      orderIndex: i,
    }));
    setObjectivesList(reordered);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (objectivesList.length === 0) {
      setErrors({ objectives: 'Vui lòng thêm ít nhất một mục tiêu' });
      return;
    }

    onNext(objectivesList);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Mục tiêu khóa học</h2>
        <p className="text-gray-600 mb-4">
          Thêm các mục tiêu học tập cho khóa học này. Học viên sẽ thấy những mục tiêu này
          trước khi đăng ký.
        </p>
      </div>

      {/* Input Section */}
      <Card className="p-6 bg-gray-50">
        <div className="space-y-4">
          <div>
            <Label htmlFor="objective-input" className="text-base font-semibold mb-2">
              Thêm mục tiêu <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="objective-input"
                value={newObjectiveText}
                onChange={(e) => {
                  setNewObjectiveText(e.target.value);
                  if (errors.objectiveText) {
                    setErrors({});
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddObjective();
                  }
                }}
                placeholder="VD: Hiểu ngữ pháp tiếng Anh cơ bản"
                maxLength={200}
                className={errors.objectiveText ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                onClick={handleAddObjective}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm
              </Button>
            </div>
            <div className="flex justify-between mt-2">
              {errors.objectiveText && (
                <p className="text-red-500 text-sm">{errors.objectiveText}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {newObjectiveText.length}/200
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Objectives List */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Mục tiêu ({objectivesList.length})
        </h3>
        {objectivesList.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <p className="text-gray-500">Chưa có mục tiêu nào</p>
            <p className="text-sm text-gray-400">Thêm mục tiêu đầu tiên ở trên</p>
          </div>
        ) : (
          <div className="space-y-2">
            {objectivesList.map((objective, index) => (
              <Card
                key={index}
                className="p-4 flex items-start justify-between bg-white"
              >
                <div className="flex-1 flex items-start gap-3">
                  <span className="font-semibold text-blue-600 min-w-fit pt-3">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <Input
                      value={objective.objectiveText}
                      onChange={(e) => handleUpdateObjective(index, e.target.value)}
                      className="text-gray-800"
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {objective.objectiveText.length}/200
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveObjective(index)}
                  className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Xóa mục tiêu"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </Card>
            ))}
          </div>
        )}
        {errors.objectives && (
          <p className="text-red-500 text-sm mt-2">{errors.objectives}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 gap-4">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="border-gray-300"
        >
          Quay lại
        </Button>
        <Button
          type="submit"
          disabled={objectivesList.length === 0 || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            'Tiếp theo'
          )}
        </Button>
      </div>
    </form>
  );
}
