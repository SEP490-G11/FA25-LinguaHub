// TypeScript types for Language Management

export interface TeachingLanguage {
  id: number;
  nameVi: string;
  nameEn: string;
  isActive: boolean;
  difficulty: string;
  certificates: string;
  thumbnailUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLanguageRequest {
  nameVi: string;
  nameEn: string;
  isActive: boolean;
  difficulty: string;
  certificates: string;
  thumbnailUrl: string;
}

export interface UpdateLanguageRequest {
  nameVi: string;
  nameEn: string;
  isActive: boolean;
  difficulty: string;
  certificates: string;
  thumbnailUrl: string;
}

export interface LanguageResponse {
  code: number;
  message: string;
  result: TeachingLanguage;
}

export interface LanguagesResponse {
  code: number;
  message: string;
  result: TeachingLanguage[];
}

// Error codes
export enum LanguageErrorCode {
  LANGUAGE_ALREADY_EXISTS = 'LANGUAGE_ALREADY_EXISTS',
  LANGUAGE_NOT_FOUND = 'LANGUAGE_NOT_FOUND',
  LANGUAGE_IN_USE = 'LANGUAGE_IN_USE',
  LANGUAGE_NAME_EN_IN_USE = 'LANGUAGE_NAME_EN_IN_USE',
}

// Error messages mapping
export const LANGUAGE_ERROR_MESSAGES: Record<string, string> = {
  [LanguageErrorCode.LANGUAGE_ALREADY_EXISTS]: 'Language (name_en) đã tồn tại, vui lòng chọn tên khác',
  [LanguageErrorCode.LANGUAGE_NOT_FOUND]: 'Language không tồn tại',
  [LanguageErrorCode.LANGUAGE_IN_USE]: 'Không thể xóa vì đang có khóa học sử dụng language này',
  [LanguageErrorCode.LANGUAGE_NAME_EN_IN_USE]: 'Không thể đổi Name (EN) vì đã có khóa học đang sử dụng. Bạn chỉ có thể chỉnh sửa các thông tin khác',
};
