import axios from '@/config/axiosConfig';
import { QuizQuestion } from '@/types/Quiz';

// Form data interfaces for creating/editing questions
export interface QuestionOptionFormData {
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuestionFormData {
  questionText: string;
  orderIndex: number;
  explanation: string;
  score: number;
  options: QuestionOptionFormData[];
}

// API Response type
interface ApiResponse<T> {
  code?: number;
  message?: string;
  result?: T;
  questionID?: number;
  questionDraftID?: number;
}

export const quizApi = {
  // ==================== LIVE MODE APIs ====================
  
  // Create a new question for a live quiz lesson
  createLiveQuestion: async (
    lessonId: string,
    questionData: QuestionFormData
  ): Promise<{ questionId: string }> => {
    const payload = {
      questionText: questionData.questionText,
      orderIndex: questionData.orderIndex,
      explanation: questionData.explanation,
      score: questionData.score,
      options: questionData.options,
    };
    
    const res = await axios.post<ApiResponse<{
      questionID: number;
      questionText: string;
      orderIndex: number;
      explanation: string;
      score: number;
      options: Array<{
        optionID: number;
        optionText: string;
        isCorrect: boolean;
        orderIndex: number;
      }>;
    }>>(
      `/tutor/quiz/lessons/${lessonId}/questions`,
      payload
    );
    
    const questionId = res?.data?.result?.questionID || res?.data?.questionID;
    if (!questionId) throw new Error('Invalid response from server');
    return { questionId: questionId.toString() };
  },

  // Fetch all questions for a live quiz lesson
  getLiveQuestions: async (lessonId: string): Promise<QuizQuestion[]> => {
    const res = await axios.get<ApiResponse<{
      lessonID: number;
      lessonTitle: string;
      lessonType: string;
      isLive: boolean;
      questions: QuizQuestion[];
    }>>(
      `/tutor/quiz/lessons/${lessonId}`
    );
    return res?.data?.result?.questions || [];
  },

  // Update an existing live question
  updateLiveQuestion: async (
    questionId: string,
    questionData: QuestionFormData
  ): Promise<{ questionId: string }> => {
    const payload = {
      questionText: questionData.questionText,
      orderIndex: questionData.orderIndex,
      explanation: questionData.explanation,
      score: questionData.score,
      options: questionData.options,
    };
    
    const res = await axios.put<ApiResponse<{
      questionID: number;
      questionText: string;
      orderIndex: number;
      explanation: string;
      score: number;
      options: Array<{
        optionID: number;
        optionText: string;
        isCorrect: boolean;
        orderIndex: number;
      }>;
    }>>(
      `/tutor/quiz/questions/${questionId}`,
      payload
    );
    
    const qId = res?.data?.result?.questionID || res?.data?.questionID || questionId;
    return { questionId: qId.toString() };
  },

  // Delete a live question
  deleteLiveQuestion: async (questionId: string): Promise<void> => {
    await axios.delete(`/tutor/quiz/questions/${questionId}`);
  },

  // ==================== DRAFT MODE APIs ====================
  
  // Create a new question for a draft quiz lesson
  createDraftQuestion: async (
    lessonDraftId: string,
    questionData: QuestionFormData
  ): Promise<{ questionDraftId: string }> => {
    const payload = {
      questionText: questionData.questionText,
      orderIndex: questionData.orderIndex,
      explanation: questionData.explanation,
      score: questionData.score,
      options: questionData.options,
    };
    
    const res = await axios.post<ApiResponse<{
      questionDraftID: number;
      questionText: string;
      orderIndex: number;
      explanation: string;
      score: number;
      options: Array<{
        optionID: number;
        optionText: string;
        isCorrect: boolean;
        orderIndex: number;
      }>;
    }>>(
      `/tutor/quiz/draft-lessons/${lessonDraftId}/questions`,
      payload
    );
    
    const questionDraftId = res?.data?.result?.questionDraftID || res?.data?.questionDraftID;
    if (!questionDraftId) throw new Error('Invalid response from server');
    return { questionDraftId: questionDraftId.toString() };
  },

  // Fetch all questions for a draft quiz lesson
  getDraftQuestions: async (lessonDraftId: string): Promise<QuizQuestion[]> => {
    const res = await axios.get<ApiResponse<{
      lessonID: number;
      lessonTitle: string;
      lessonType: string;
      isLive: boolean;
      questions: QuizQuestion[];
    }>>(
      `/tutor/quiz/draft-lessons/${lessonDraftId}`
    );
    return res?.data?.result?.questions || [];
  },

  // Update an existing draft question
  updateDraftQuestion: async (
    questionDraftId: string,
    questionData: QuestionFormData
  ): Promise<{ questionDraftId: string }> => {
    const payload = {
      questionText: questionData.questionText,
      orderIndex: questionData.orderIndex,
      explanation: questionData.explanation,
      score: questionData.score,
      options: questionData.options,
    };
    
    const res = await axios.put<ApiResponse<{
      questionDraftID: number;
      questionText: string;
      orderIndex: number;
      explanation: string;
      score: number;
      options: Array<{
        optionID: number;
        optionText: string;
        isCorrect: boolean;
        orderIndex: number;
      }>;
    }>>(
      `/tutor/quiz/draft-questions/${questionDraftId}`,
      payload
    );
    
    const qId = res?.data?.result?.questionDraftID || res?.data?.questionDraftID || questionDraftId;
    return { questionDraftId: qId.toString() };
  },

  // Delete a draft question
  deleteDraftQuestion: async (questionDraftId: string): Promise<void> => {
    await axios.delete(`/tutor/quiz/draft-questions/${questionDraftId}`);
  },

  // ==================== HELPER FUNCTIONS ====================
  
  // Determine which API to use based on mode
  createQuestion: async (
    lessonId: string,
    questionData: QuestionFormData,
    isDraft: boolean
  ): Promise<{ questionId: string }> => {
    if (isDraft) {
      const result = await quizApi.createDraftQuestion(lessonId, questionData);
      return { questionId: result.questionDraftId };
    } else {
      return quizApi.createLiveQuestion(lessonId, questionData);
    }
  },

  getQuestions: async (
    lessonId: string,
    isDraft: boolean
  ): Promise<QuizQuestion[]> => {
    return isDraft
      ? quizApi.getDraftQuestions(lessonId)
      : quizApi.getLiveQuestions(lessonId);
  },

  updateQuestion: async (
    questionId: string,
    questionData: QuestionFormData,
    isDraft: boolean
  ): Promise<{ questionId: string }> => {
    if (isDraft) {
      const result = await quizApi.updateDraftQuestion(questionId, questionData);
      return { questionId: result.questionDraftId };
    } else {
      return quizApi.updateLiveQuestion(questionId, questionData);
    }
  },

  deleteQuestion: async (
    questionId: string,
    isDraft: boolean
  ): Promise<void> => {
    return isDraft
      ? quizApi.deleteDraftQuestion(questionId)
      : quizApi.deleteLiveQuestion(questionId);
  },
};
