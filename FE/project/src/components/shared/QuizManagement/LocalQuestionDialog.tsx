import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface QuizOptionData {
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface QuizQuestionData {
  questionText: string;
  orderIndex: number;
  explanation: string;
  score: number;
  options: QuizOptionData[];
}

interface LocalQuestionDialogProps {
  open: boolean;
  question?: QuizQuestionData | null;
  initialOrderIndex?: number;
  onClose: () => void;
  onSave: (question: QuizQuestionData) => void;
  onSaveAndContinue?: (question: QuizQuestionData) => void;
}

export default function LocalQuestionDialog({
  open,
  question,
  initialOrderIndex = 0,
  onClose,
  onSave,
  onSaveAndContinue,
}: LocalQuestionDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!question;

  const [formData, setFormData] = useState({
    questionText: '',
    explanation: '',
    score: 10,
    orderIndex: initialOrderIndex,
  });

  const [options, setOptions] = useState<QuizOptionData[]>([
    { optionText: '', isCorrect: false, orderIndex: 0 },
    { optionText: '', isCorrect: false, orderIndex: 1 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (question) {
        // Edit mode - populate with existing data
        setFormData({
          questionText: question.questionText,
          explanation: question.explanation,
          score: question.score,
          orderIndex: question.orderIndex,
        });
        setOptions(question.options);
      } else {
        // Create mode - reset form
        setFormData({
          questionText: '',
          explanation: '',
          score: 10,
          orderIndex: initialOrderIndex,
        });
        setOptions([
          { optionText: '', isCorrect: false, orderIndex: 0 },
          { optionText: '', isCorrect: false, orderIndex: 1 },
        ]);
      }
      setErrors({});
    }
  }, [open, question, initialOrderIndex]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate question text
    if (!formData.questionText.trim()) {
      newErrors.questionText = 'Câu hỏi không được để trống';
    } else if (formData.questionText.length < 10) {
      newErrors.questionText = 'Câu hỏi phải có ít nhất 10 ký tự';
    } else if (formData.questionText.length > 500) {
      newErrors.questionText = 'Câu hỏi không được vượt quá 500 ký tự';
    }

    // Validate explanation
    if (!formData.explanation.trim()) {
      newErrors.explanation = 'Giải thích không được để trống';
    } else if (formData.explanation.length < 10) {
      newErrors.explanation = 'Giải thích phải có ít nhất 10 ký tự';
    } else if (formData.explanation.length > 1000) {
      newErrors.explanation = 'Giải thích không được vượt quá 1000 ký tự';
    }

    // Validate score
    if (formData.score < 1 || formData.score > 100) {
      newErrors.score = 'Điểm phải từ 1 đến 100';
    }

    // Validate order index
    if (formData.orderIndex < 0) {
      newErrors.orderIndex = 'Thứ tự phải >= 0';
    }

    // Validate options
    const filledOptions = options.filter((opt) => opt.optionText.trim());
    if (filledOptions.length < 2) {
      newErrors.options = 'Phải có ít nhất 2 lựa chọn';
    } else if (filledOptions.length > 6) {
      newErrors.options = 'Không được vượt quá 6 lựa chọn';
    }

    // Validate at least one correct option
    const hasCorrectOption = filledOptions.some((opt) => opt.isCorrect);
    if (!hasCorrectOption) {
      newErrors.correctOption = 'Phải có ít nhất 1 đáp án đúng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (continueCreating: boolean = false) => {
    if (!validateForm()) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Vui lòng kiểm tra lại thông tin',
        variant: 'destructive',
      });
      return;
    }

    // Filter out empty options and update order indices
    const validOptions = options
      .filter((opt) => opt.optionText.trim())
      .map((opt, index) => ({
        ...opt,
        orderIndex: index,
      }));

    const questionData: QuizQuestionData = {
      ...formData,
      options: validOptions,
    };

    if (continueCreating && onSaveAndContinue) {
      onSaveAndContinue(questionData);
      // Reset form for next question
      setFormData({
        questionText: '',
        explanation: '',
        score: 10,
        orderIndex: formData.orderIndex + 1,
      });
      setOptions([
        { optionText: '', isCorrect: false, orderIndex: 0 },
        { optionText: '', isCorrect: false, orderIndex: 1 },
      ]);
      setErrors({});
    } else {
      onSave(questionData);
      onClose();
    }
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([
        ...options,
        { optionText: '', isCorrect: false, orderIndex: options.length },
      ]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: keyof QuizOptionData, value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="questionText">
              Câu hỏi <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="questionText"
              value={formData.questionText}
              onChange={(e) =>
                setFormData({ ...formData, questionText: e.target.value })
              }
              placeholder="Nhập câu hỏi (10-500 ký tự)"
              rows={3}
              className={errors.questionText ? 'border-red-500' : ''}
            />
            {errors.questionText && (
              <p className="text-sm text-red-500">{errors.questionText}</p>
            )}
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">
              Giải thích <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) =>
                setFormData({ ...formData, explanation: e.target.value })
              }
              placeholder="Nhập giải thích cho câu trả lời (10-1000 ký tự)"
              rows={3}
              className={errors.explanation ? 'border-red-500' : ''}
            />
            {errors.explanation && (
              <p className="text-sm text-red-500">{errors.explanation}</p>
            )}
          </div>

          {/* Score */}
          <div className="space-y-2">
            <Label htmlFor="score">
              Điểm <span className="text-red-500">*</span>
            </Label>
            <Input
              id="score"
              type="number"
              min="1"
              max="100"
              value={formData.score}
              onChange={(e) =>
                setFormData({ ...formData, score: parseInt(e.target.value) || 0 })
              }
              className={errors.score ? 'border-red-500' : ''}
            />
            {errors.score && (
              <p className="text-sm text-red-500">{errors.score}</p>
            )}
            <p className="text-xs text-gray-500">
              Điểm số cho câu hỏi này (1-100)
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Lựa chọn <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                disabled={options.length >= 6}
              >
                <Plus className="h-4 w-4 mr-1" />
                Thêm lựa chọn
              </Button>
            </div>

            {errors.options && (
              <p className="text-sm text-red-500">{errors.options}</p>
            )}
            {errors.correctOption && (
              <p className="text-sm text-red-500">{errors.correctOption}</p>
            )}

            <div className="space-y-3">
              {options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {index + 1}.
                      </span>
                      <Input
                        value={option.optionText}
                        onChange={(e) =>
                          updateOption(index, 'optionText', e.target.value)
                        }
                        placeholder="Nhập nội dung lựa chọn"
                      />
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <Checkbox
                        id={`option-correct-${index}`}
                        checked={option.isCorrect}
                        onCheckedChange={(checked) =>
                          updateOption(index, 'isCorrect', checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`option-correct-${index}`}
                        className="text-sm cursor-pointer"
                      >
                        Đáp án đúng
                      </Label>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          {!isEditMode && onSaveAndContinue && (
            <Button onClick={() => handleSave(true)} className="bg-green-600 hover:bg-green-700">
              Lưu và tạo tiếp
            </Button>
          )}
          <Button onClick={() => handleSave(false)}>
            {isEditMode ? 'Lưu' : 'Lưu và đóng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
