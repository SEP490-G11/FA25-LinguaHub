import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import { quizApi } from '@/pages/TutorPages/CreateCourse/quiz-api';
import { QuizQuestion } from '@/types/Quiz';
import EditQuestionDialog from './EditQuestionDialog';
import DeleteQuestionDialog from './DeleteQuestionDialog';

interface QuizQuestionListProps {
  lessonId: string;
  isDraft: boolean;
  readOnly?: boolean;
  onQuestionsChange?: (questions: QuizQuestion[]) => void;
  initialQuestions?: QuizQuestion[]; // Add prop for cached questions
}

export default function QuizQuestionList({
  lessonId,
  isDraft,
  readOnly = false,
  onQuestionsChange,
  initialQuestions,
}: QuizQuestionListProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions || []);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(!!initialQuestions);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const fetchQuestions = async () => {
    if (!lessonId) return;
    
    setLoading(true);
    try {
      const data = await quizApi.getQuestions(lessonId, isDraft);
      // Sort by orderIndex
      const sortedQuestions = [...data].sort((a, b) => a.orderIndex - b.orderIndex);
      setQuestions(sortedQuestions);
      onQuestionsChange?.(sortedQuestions);
      setHasFetched(true);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we don't have initial questions and haven't fetched yet
    if (!hasFetched && !initialQuestions) {
      fetchQuestions();
    }
  }, [lessonId, isDraft, hasFetched, initialQuestions]);

  const handleEditSuccess = () => {
    setEditingQuestion(null);
    fetchQuestions();
  };

  const handleDeleteSuccess = () => {
    setDeletingQuestionId(null);
    fetchQuestions();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải câu hỏi...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    if (readOnly) {
      return (
        <div className="text-center py-4 text-gray-500 text-sm italic">
          Chưa có câu hỏi nào
        </div>
      );
    }
    return null; // Don't render anything when empty in edit mode, let parent handle the display
  }

  return (
    <>
      <div className="space-y-2">
        {questions.map((question, index) => (
          <div
            key={question.questionID}
            className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-700 flex-shrink-0">
                {index + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {truncateText(question.questionText, 100)}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">
                    Điểm: {question.score}
                  </span>
                  <span className="text-xs text-gray-500">
                    {question.options.length} lựa chọn
                  </span>
                </div>
              </div>
            </div>
            {!readOnly && (
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingQuestion(question)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeletingQuestionId(question.questionID.toString())}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Question Dialog */}
      {editingQuestion && (
        <EditQuestionDialog
          open={!!editingQuestion}
          question={editingQuestion}
          isDraft={isDraft}
          onClose={() => setEditingQuestion(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Question Dialog */}
      {deletingQuestionId && (
        <DeleteQuestionDialog
          open={!!deletingQuestionId}
          questionId={deletingQuestionId}
          isDraft={isDraft}
          onClose={() => setDeletingQuestionId(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </>
  );
}
