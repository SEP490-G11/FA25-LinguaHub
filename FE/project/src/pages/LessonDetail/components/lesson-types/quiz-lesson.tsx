import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/config/axiosConfig";
import { renderText } from "@/utils/textUtils";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type {
  QuizQuestion,
  QuizResult,
  QuizSubmitRequest,
} from "@/types/Quiz";

interface QuizContentProps {
  lesson: {
    id: number;
    title: string;
    duration: number;
  };
  courseId: number;
}

const QuizContent = ({ lesson, courseId }: QuizContentProps) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false); // Track if quiz was completed before
  const [previousResult, setPreviousResult] = useState<QuizResult | null>(null); // Store previous quiz result
  const [hasStarted, setHasStarted] = useState(false); // Track if user has started the quiz

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // Pagination for question overview
  const QUESTIONS_PER_PAGE = 10;
  const [overviewPage, setOverviewPage] = useState(0);
  const totalOverviewPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex = overviewPage * QUESTIONS_PER_PAGE;
  const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, questions.length);
  const visibleQuestions = questions.slice(startIndex, endIndex);

  // Fetch quiz questions and check if completed
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(
          `/student/courses/${courseId}/lessons/${lesson.id}/quiz`
        );

        if (res?.data?.code === 0 && res.data.result) {
          setQuestions(res.data.result);
        }

        // Check if lesson is already completed
        try {
          const courseRes = await api.get(`/student/courses/${courseId}`);
          if (courseRes?.data?.result?.sectionProgress) {
            const course = courseRes.data.result;
            for (const sec of course.sectionProgress) {
              for (const l of sec.lessons) {
                if (l.lessonId === lesson.id && l.isDone) {
                  setIsCompleted(true);
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.error("Failed to check completion status:", error);
        }

        // Fetch latest quiz result from backend
        try {
          const resultRes = await api.get(
            `/student/courses/${courseId}/lessons/${lesson.id}/quiz/result/latest`
          );
          
          if (resultRes?.data?.code === 0 && resultRes.data.result) {
            const latestResult = resultRes.data.result;
            setPreviousResult(latestResult);
            
            // Also save to localStorage as backup
            const storageKey = `quiz_result_${courseId}_${lesson.id}`;
            localStorage.setItem(storageKey, JSON.stringify(latestResult));
          }
        } catch (error) {
          // If API fails, try to load from localStorage as fallback
          console.log("No previous quiz result found or API error:", error);
          const storageKey = `quiz_result_${courseId}_${lesson.id}`;
          const savedResult = localStorage.getItem(storageKey);
          if (savedResult) {
            try {
              const parsedResult = JSON.parse(savedResult);
              setPreviousResult(parsedResult);
            } catch (error) {
              console.error("Failed to parse saved quiz result:", error);
            }
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải câu hỏi quiz.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [courseId, lesson.id, toast]);

  // Handle answer selection with toggle
  const handleAnswerChange = (questionId: number, optionId: number, isMultiple: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      const exists = current.includes(optionId);

      if (isMultiple) {
        return {
          ...prev,
          [questionId]: exists
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      } else {
        return {
          ...prev,
          [questionId]: exists ? [] : [optionId],
        };
      }
    });
  };

  // Navigation
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Start quiz for the first time
  const handleStartQuiz = () => {
    setHasStarted(true);
    setAnswers({});
    setResult(null);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setOverviewPage(0);
  };

  // Reset quiz to retake
  const handleRetake = () => {
    setHasStarted(true);
    setAnswers({});
    setResult(null);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setOverviewPage(0);
    
    toast({
      title: "Làm lại quiz",
      description: previousResult 
        ? `Điểm số trước đó: ${previousResult.percentage}%. Bạn có thể làm lại để cải thiện điểm số.`
        : "Bạn có thể làm lại bài quiz này.",
    });
  };

  // Submit quiz
  const handleSubmit = async () => {
    const unanswered = questions.filter(
      (q) => !answers[q.questionID] || answers[q.questionID].length === 0
    );

    if (unanswered.length > 0) {
      toast({
        variant: "destructive",
        title: "Chưa hoàn thành",
        description: `Bạn còn ${unanswered.length} câu hỏi chưa trả lời.`,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: QuizSubmitRequest = {
        answers: Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
          questionId: parseInt(questionId),
          selectedOptionIds,
        })),
      };

      const res = await api.post(
        `/student/courses/${courseId}/lessons/${lesson.id}/quiz/submit`,
        payload
      );

      if (res?.data?.code === 0 && res.data.result) {
        const quizResult = res.data.result;
        setResult(quizResult);
        setShowResults(true);
        setCurrentQuestionIndex(0);
        setIsCompleted(true); // Mark as completed

        // Save result to localStorage
        const storageKey = `quiz_result_${courseId}_${lesson.id}`;
        localStorage.setItem(storageKey, JSON.stringify(quizResult));
        setPreviousResult(quizResult);

        // Show improvement message if there was a previous result
        const improvementMsg = previousResult 
          ? previousResult.percentage < quizResult.percentage
            ? ` Cải thiện từ ${previousResult.percentage}%! 🎉`
            : previousResult.percentage > quizResult.percentage
            ? ` Điểm trước: ${previousResult.percentage}%`
            : " Giữ nguyên điểm số!"
          : "";

        toast({
          title: "Đã nộp bài! 🎉",
          description: `Bạn đạt ${quizResult.percentage}%${improvementMsg}`,
          className: "bg-green-600 text-white border-none",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể nộp bài quiz.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xác định câu hỏi có nhiều đáp án đúng hay không
  // Ưu tiên: 1) từ result (correctOptionIds), 2) từ previousResult, 3) từ API field
  const isMultipleChoice = (question: QuizQuestion) => {
    // Nếu đã có result, kiểm tra số lượng correctOptionIds
    if (result) {
      const questionResult = result.questions.find(q => q.questionID === question.questionID);
      if (questionResult && questionResult.correctOptionIds.length > 1) {
        return true;
      }
    }
    // Nếu có previousResult, kiểm tra từ đó
    if (previousResult) {
      const questionResult = previousResult.questions.find(q => q.questionID === question.questionID);
      if (questionResult && questionResult.correctOptionIds.length > 1) {
        return true;
      }
    }
    // Fallback: dùng field từ API nếu có
    return question.isMultipleChoice === true;
  };

  if (isLoading) {
    return (
      <div className="lg:col-span-2">
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải quiz...</p>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="lg:col-span-2">
        <Card className="overflow-hidden shadow-xl border-0">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
          </div>
          <div className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa có câu hỏi</h2>
            <p className="text-gray-600 mb-6">
              Quiz này hiện chưa có câu hỏi nào.
            </p>
            <Button onClick={() => window.history.back()}>Quay lại</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show start screen if user hasn't started and has previous result
  if (!hasStarted && previousResult && !showResults) {
    return (
      <div className="lg:col-span-2">
        <Card className="overflow-hidden shadow-xl border-0">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
                <div className="flex items-center gap-4 text-blue-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    <span>{questions.length} câu hỏi</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                <Trophy className="w-12 h-12" />
              </div>
            </div>
          </div>

          <div className="p-12">
            <div className="text-center mb-8">
              <Trophy className="w-20 h-20 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bạn đã hoàn thành quiz này
              </h2>
              <p className="text-gray-600">
                Xem lại kết quả lần trước hoặc làm lại để cải thiện điểm số
              </p>
            </div>

            {/* Previous Result Display */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Kết quả lần trước
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 text-center shadow-md">
                  <p className="text-sm text-gray-600 mb-1">Điểm số</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {previousResult.totalScore}/{previousResult.maxScore}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-md">
                  <p className="text-sm text-gray-600 mb-1">Phần trăm</p>
                  <p className="text-2xl font-bold text-green-600">
                    {previousResult.percentage}%
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-md">
                  <p className="text-sm text-gray-600 mb-1">Đúng</p>
                  <p className="text-2xl font-bold text-green-600">
                    {previousResult.correctQuestions}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center shadow-md">
                  <p className="text-sm text-gray-600 mb-1">Tổng câu</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {previousResult.totalQuestions}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleRetake}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg"
              >
                Làm lại bài quiz
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show start screen if user hasn't started and no previous result
  if (!hasStarted && !previousResult && !showResults) {
    return (
      <div className="lg:col-span-2">
        <Card className="overflow-hidden shadow-xl border-0">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
                <div className="flex items-center gap-4 text-blue-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    <span>{questions.length} câu hỏi</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                <Trophy className="w-12 h-12" />
              </div>
            </div>
          </div>

          <div className="p-12 text-center">
            <BookOpen className="w-20 h-20 text-blue-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Sẵn sàng bắt đầu quiz?
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Quiz này có {questions.length} câu hỏi. Hãy chuẩn bị tinh thần và bắt đầu thử thách!
            </p>
            <Button
              onClick={handleStartQuiz}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-6 text-lg"
            >
              Bắt đầu làm quiz
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2">
      {/* Header */}
      <Card className="mb-6 overflow-hidden shadow-xl border-0">
        <motion.div initial="initial" animate="animate" variants={fadeInUp}>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{lesson.title}</h1>
                  {isCompleted && (
                    <Badge className="bg-green-500 text-white border-none">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Đã hoàn thành
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-blue-100">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    <span>{questions.length} câu hỏi</span>
                  </div>
                  {!showResults && (
                    <span className="font-semibold">
                      Câu {currentQuestionIndex + 1} / {questions.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                <Trophy className="w-12 h-12" />
              </div>
            </div>

            {!showResults && (
              <div className="mt-4">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </Card>

      {/* Results Summary */}
      {showResults && result && (
        <Card className="mb-6 overflow-hidden shadow-xl border-0">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 p-8">
            <div className="text-center mb-6">
              <Trophy className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Kết quả của bạn</h2>
              {isCompleted && (
                <p className="text-sm text-gray-600">
                  Quiz này đã được đánh dấu hoàn thành
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 text-center shadow-md">
                <p className="text-sm text-gray-600 mb-1">Điểm số</p>
                <p className="text-2xl font-bold text-blue-600">
                  {result.totalScore}/{result.maxScore}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-md">
                <p className="text-sm text-gray-600 mb-1">Phần trăm</p>
                <p className="text-2xl font-bold text-green-600">{result.percentage}%</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-md">
                <p className="text-sm text-gray-600 mb-1">Đúng</p>
                <p className="text-2xl font-bold text-green-600">{result.correctQuestions}</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-md">
                <p className="text-sm text-gray-600 mb-1">Tổng câu</p>
                <p className="text-2xl font-bold text-gray-900">{result.totalQuestions}</p>
              </div>
            </div>
            
            {/* Retake Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleRetake}
                variant="outline"
                className="flex items-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3"
              >
                Làm lại bài quiz
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Question Navigation */}
      {!showResults && (
        <Card className="mb-6 p-4 shadow-lg border-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Tổng quan câu hỏi</h3>
            {totalOverviewPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOverviewPage(Math.max(0, overviewPage - 1))}
                  disabled={overviewPage === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">
                  {startIndex + 1}-{endIndex} / {questions.length}
                </span>
                <button
                  onClick={() => setOverviewPage(Math.min(totalOverviewPages - 1, overviewPage + 1))}
                  disabled={overviewPage === totalOverviewPages - 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleQuestions.map((q, idx) => {
              const actualIndex = startIndex + idx;
              const isAnswered = answers[q.questionID]?.length > 0;
              const isCurrent = actualIndex === currentQuestionIndex;

              return (
                <button
                  key={actualIndex}
                  onClick={() => goToQuestion(actualIndex)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                    isCurrent
                      ? "bg-blue-600 text-white scale-110 shadow-lg"
                      : isAnswered
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {actualIndex + 1}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Current Question */}
      {!showResults && currentQuestion && (
        <Card className="overflow-hidden shadow-lg border-0 mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-blue-600 text-white">
                    Câu {currentQuestionIndex + 1}
                  </Badge>
                  {isMultipleChoice(currentQuestion) && (
                    <Badge variant="outline" className="text-purple-600">
                      Nhiều đáp án
                    </Badge>
                  )}
                  <Badge variant="secondary">{currentQuestion.score} điểm</Badge>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {renderText(currentQuestion.questionText)}
                </h3>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isMultipleChoice(currentQuestion) ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestion.questionID]?.includes(option.optionID);

                  return (
                    <div
                      key={option.optionID}
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                      onClick={() => handleAnswerChange(currentQuestion.questionID, option.optionID, true)}
                    >
                      <Checkbox
                        id={`option-${option.optionID}`}
                        checked={isSelected}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={`option-${option.optionID}`}
                        className="flex-1 cursor-pointer"
                      >
                        {renderText(option.optionText)}
                      </Label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <RadioGroup
                value={answers[currentQuestion.questionID]?.[0]?.toString() || ""}
              >
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestion.questionID]?.[0] === option.optionID;

                    return (
                      <div
                        key={option.optionID}
                        className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => handleAnswerChange(currentQuestion.questionID, option.optionID, false)}
                      >
                        <RadioGroupItem
                          value={option.optionID.toString()}
                          id={`option-${option.optionID}`}
                          className="mt-1"
                        />
                        <Label
                          htmlFor={`option-${option.optionID}`}
                          className="flex-1 cursor-pointer"
                        >
                          {renderText(option.optionText)}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            )}
          </div>
        </Card>
      )}

      {/* Results View - Show current question result */}
      {showResults && result && currentQuestion && (
        <Card className="overflow-hidden shadow-lg border-0 mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-blue-600 text-white">
                    Câu {currentQuestionIndex + 1}
                  </Badge>
                  {isMultipleChoice(currentQuestion) && (
                    <Badge variant="outline" className="text-purple-600">
                      Nhiều đáp án
                    </Badge>
                  )}
                  <Badge variant="secondary">{currentQuestion.score} điểm</Badge>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {renderText(currentQuestion.questionText)}
                </h3>
              </div>
              <div>
                {result.questions[currentQuestionIndex]?.isCorrect ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const questionResult = result.questions[currentQuestionIndex];
                const isSelected = questionResult?.selectedOptionIds.includes(option.optionID);
                const isCorrect = questionResult?.correctOptionIds.includes(option.optionID);

                return (
                  <div
                    key={option.optionID}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 ${
                      isCorrect
                        ? "border-green-500 bg-green-50"
                        : isSelected
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex-1">
                      <span className="text-gray-900">{renderText(option.optionText)}</span>
                    </div>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                );
              })}
            </div>

            {result.questions[currentQuestionIndex]?.explanation && (
              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Giải thích</h4>
                    <p className="text-blue-800">
                      {renderText(result.questions[currentQuestionIndex].explanation)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={handlePrevious}
          disabled={isFirstQuestion}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Câu trước
        </Button>

        <div className="flex gap-2">
          {!showResults ? (
            <>
              {!isLastQuestion ? (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  Câu tiếp
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {isSubmitting ? "Đang nộp bài..." : "Nộp bài"}
                </Button>
              )}
            </>
          ) : (
            !isLastQuestion && (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                Câu tiếp
                <ChevronRight className="w-4 h-4" />
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizContent;

// Alias export for consistency with other lesson types
export { QuizContent as QuizLesson };
