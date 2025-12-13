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
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { quizApi, QuestionFormData, QuestionOptionFormData } from '@/pages/TutorPages/CreateCourse/quiz-api';
import { toast } from 'sonner';

interface CreateQuestionDialogProps {
  open: boolean;
  lessonId: string;
  isDraft: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialOrderIndex?: number;
}

export default function CreateQuestionDialog({
  open,
  lessonId,
  isDraft,
  onClose,
  onSuccess,
  initialOrderIndex = 0,
}: CreateQuestionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<QuestionFormData>({
    questionText: '',
    explanation: '',
    score: 1,
    orderIndex: initialOrderIndex,
    options: [
      { optionText: '', isCorrect: false, orderIndex: 0 },
      { optionText: '', isCorrect: false, orderIndex: 1 },
    ],
  });

  // Validation errors
  const [errors, setErrors] = useState<{
    questionText?: string;
    explanation?: string;
    score?: string;
    orderIndex?: string;
    options?: string;
    optionTexts?: { [key: number]: string };
  }>({});

  // Update orderIndex when initialOrderIndex changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, orderIndex: initialOrderIndex }));
  }, [initialOrderIndex]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        questionText: '',
        explanation: '',
        score: 1,
        orderIndex: initialOrderIndex,
        options: [
          { optionText: '', isCorrect: false, orderIndex: 0 },
          { optionText: '', isCorrect: false, orderIndex: 1 },
        ],
      });
      setErrors({});
    }
  }, [open, initialOrderIndex]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate question text (10-500 chars)
    if (!formData.questionText.trim()) {
      newErrors.questionText = 'Vui lòng nhập câu hỏi';
    } else if (formData.questionText.trim().length < 10) {
      newErrors.questionText = 'Câu hỏi phải có ít nhất 10 ký tự';
    } else if (formData.questionText.length > 500) {
      newErrors.questionText = 'Câu hỏi không được vượt quá 500 ký tự';
    }

    // Validate explanation (10-1000 chars)
    if (!formData.explanation.trim()) {
      newErrors.explanation = 'Vui lòng nhập giải thích';
    } else if (formData.explanation.trim().length < 10) {
      newErrors.explanation = 'Giải thích phải có ít nhất 10 ký tự';
    } else if (formData.explanation.length > 1000) {
      newErrors.explanation = 'Giải thích không được vượt quá 1000 ký tự';
    }

    // Validate score (1-100)
    if (formData.score < 1) {
      newErrors.score = 'Điểm số phải lớn hơn 0';
    } else if (formData.score > 100) {
      newErrors.score = 'Điểm số không được vượt quá 100';
    }

    // Validate orderIndex (>=0)
    if (formData.orderIndex < 0) {
      newErrors.orderIndex = 'Thứ tự phải là số không âm';
    }

    // Validate options (2-6 options)
    if (formData.options.length < 2) {
      newErrors.options = 'Phải có ít nhất 2 lựa chọn';
    } else if (formData.options.length > 6) {
      newErrors.options = 'Không được có quá 6 lựa chọn';
    }

    // Validate option texts
    const optionTextErrors: { [key: number]: string } = {};
    formData.options.forEach((option, index) => {
      if (!option.optionText.trim()) {
        optionTextErrors[index] = 'Vui lòng nhập nội dung lựa chọn';
      } else if (option.optionText.length > 200) {
        optionTextErrors[index] = 'Nội dung không được vượt quá 200 ký tự';
      }
    });
    if (Object.keys(optionTextErrors).length > 0) {
      newErrors.optionTexts = optionTextErrors;
    }

    // Validate at least one correct option
    const hasCorrectOption = formData.options.some((opt) => opt.isCorrect);
    if (!hasCorrectOption) {
      newErrors.options = 'Phải có ít nhất một lựa chọn đúng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddOption = () => {
    if (formData.options.length >= 6) {
      toast.error('Không thể thêm quá 6 lựa chọn');
      return;
    }
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        { optionText: '', isCorrect: false, orderIndex: formData.options.length },
      ],
    });
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 2) {
      toast.error('Phải có ít nhất 2 lựa chọn');
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    // Reindex remaining options
    const reindexedOptions = newOptions.map((opt, i) => ({ ...opt, orderIndex: i }));
    setFormData({ ...formData, options: reindexedOptions });
  };

  const handleOptionChange = (index: number, field: keyof QuestionOptionFormData, value: any) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (continueCreating: boolean) => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await quizApi.createQuestion(lessonId, formData, isDraft);
      toast.success('Tạo câu hỏi thành công');
      
      if (continueCreating) {
        // Clear form and increment orderIndex
        setFormData({
          questionText: '',
          explanation: '',
          score: 1,
          orderIndex: formData.orderIndex + 1,
          options: [
            { optionText: '', isCorrect: false, orderIndex: 0 },
            { optionText: '', isCorrect: false, orderIndex: 1 },
          ],
        });
        setErrors({});
      } else {
        onClose();
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Error creating question:', error);
      toast.error(error?.response?.data?.message || 'Không thể tạo câu hỏi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.questionText.trim().length >= 10 &&
      formData.questionText.length <= 500 &&
      formData.explanation.trim().length >= 10 &&
      formData.explanation.length <= 1000 &&
      formData.score >= 1 &&
      formData.score <= 100 &&
      formData.orderIndex >= 0 &&
      formData.options.length >= 2 &&
      formData.options.length <= 6 &&
      formData.options.every((opt) => opt.optionText.trim().length > 0 && opt.optionText.length <= 200) &&
      formData.options.some((opt) => opt.isCorrect)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo câu hỏi mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Question Text */}
          <div>
            <Label htmlFor="question-text">
              Câu hỏi <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="question-text"
              value={formData.questionText}
              onChange={(e) => {
                setFormData({ ...formData, questionText: e.target.value });
                // Clear error when user starts typing
                if (errors.questionText) {
                  setErrors({ ...errors, questionText: undefined });
                }
              }}
              onBlur={() => {
                // Validate on blur
                const text = formData.questionText.trim();
                if (!text) {
                  setErrors({ ...errors, questionText: 'Vui lòng nhập câu hỏi' });
                } else if (text.length < 10) {
                  setErrors({ ...errors, questionText: 'Câu hỏi phải có ít nhất 10 ký tự' });
                } else if (formData.questionText.length > 500) {
                  setErrors({ ...errors, questionText: 'Câu hỏi không được vượt quá 500 ký tự' });
                }
              }}
              placeholder="Nhập câu hỏi (10-500 ký tự)"
              rows={3}
              className={errors.questionText ? 'border-red-500' : ''}
            />
            {errors.questionText && (
              <p className="text-sm text-red-600 mt-1">{errors.questionText}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.questionText.length}/500 ký tự
            </p>
          </div>

          {/* Explanation */}
          <div>
            <Label htmlFor="explanation">
              Giải thích <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => {
                setFormData({ ...formData, explanation: e.target.value });
                // Clear error when user starts typing
                if (errors.explanation) {
                  setErrors({ ...errors, explanation: undefined });
                }
              }}
              onBlur={() => {
                // Validate on blur
                const text = formData.explanation.trim();
                if (!text) {
                  setErrors({ ...errors, explanation: 'Vui lòng nhập giải thích' });
                } else if (text.length < 10) {
                  setErrors({ ...errors, explanation: 'Giải thích phải có ít nhất 10 ký tự' });
                } else if (formData.explanation.length > 1000) {
                  setErrors({ ...errors, explanation: 'Giải thích không được vượt quá 1000 ký tự' });
                }
              }}
              placeholder="Nhập giải thích cho câu trả lời (10-1000 ký tự)"
              rows={3}
              className={errors.explanation ? 'border-red-500' : ''}
            />
            {errors.explanation && (
              <p className="text-sm text-red-600 mt-1">{errors.explanation}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.explanation.length}/1000 ký tự
            </p>
          </div>

          {/* Score and Order Index */}
          {/* Score */}
          <div>
            <Label htmlFor="score">
              Điểm số <span className="text-red-500">*</span>
            </Label>
            <Input
              id="score"
              type="number"
              min="1"
              max="100"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 1 })}
              className={errors.score ? 'border-red-500' : ''}
            />
            {errors.score && <p className="text-sm text-red-600 mt-1">{errors.score}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Điểm số cho câu hỏi này (1-100)
            </p>
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>
                Các lựa chọn <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddOption}
                disabled={formData.options.length >= 6}
                className="gap-2"
              >
                <Plus className="w-3 h-3" />
                Thêm lựa chọn
              </Button>
            </div>
            
            {errors.options && (
              <p className="text-sm text-red-600 mb-2">{errors.options}</p>
            )}

            <div className="space-y-3">
              {formData.options.map((option, index) => (
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
                          handleOptionChange(index, 'optionText', e.target.value)
                        }
                        placeholder="Nhập nội dung lựa chọn"
                        className={
                          errors.optionTexts?.[index] ? 'border-red-500' : ''
                        }
                      />
                    </div>
                    {errors.optionTexts?.[index] && (
                      <p className="text-sm text-red-600 ml-6">
                        {errors.optionTexts[index]}
                      </p>
                    )}
                    <div className="flex items-center gap-2 ml-6">
                      <Checkbox
                        id={`option-correct-${index}`}
                        checked={option.isCorrect}
                        onCheckedChange={(checked) =>
                          handleOptionChange(index, 'isCorrect', checked)
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
                    onClick={() => handleRemoveOption(index)}
                    disabled={formData.options.length <= 2}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {errors.options && (
              <p className="text-sm text-red-600 mt-2">{errors.options}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Phải có từ 2-6 lựa chọn và ít nhất một lựa chọn đúng
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={!isFormValid() || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu và tạo tiếp'
            )}
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={!isFormValid() || isSubmitting}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu và đóng'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
