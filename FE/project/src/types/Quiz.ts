export interface QuizOption {
  optionID: number;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuizQuestion {
  questionID: number;
  questionText: string;
  orderIndex: number;
  explanation: string;
  score: number;
  isMultipleChoice?: boolean; // optional - BE có thể không trả về, FE sẽ tự tính từ correctOptionIds
  options: QuizOption[];
}

export interface QuizAnswer {
  questionId: number;
  selectedOptionIds: number[];
}

export interface QuizSubmitRequest {
  answers: QuizAnswer[];
}

export interface QuizResultQuestion {
  questionID: number;
  isCorrect: boolean;
  questionScore: number;
  maxScore: number;
  selectedOptionIds: number[];
  correctOptionIds: number[];
  explanation: string;
}

export interface QuizResult {
  totalQuestions: number;
  correctQuestions: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  questions: QuizResultQuestion[];
}

export interface QuizResponse {
  code: number;
  message: string;
  result: QuizQuestion[];
}

export interface QuizSubmitResponse {
  code: number;
  message: string;
  result: QuizResult;
}
