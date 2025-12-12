import { z } from 'zod';

// Certificate validation schema
export const certificateSchema = z.object({
  certificateName: z
    .string()
    .min(1, 'Vui lòng nhập tên chứng chỉ')
    .max(200, 'Tên chứng chỉ không được quá 200 ký tự'),
  documentUrl: z
    .string()
    .min(1, 'Vui lòng tải lên file tài liệu')
    .url('URL không hợp lệ'),
});

// Tutor application validation schema
export const tutorApplicationSchema = z.object({
  experience: z
    .number({ message: 'Kinh nghiệm phải là một số' })
    .min(0, 'Kinh nghiệm không thể là số âm')
    .max(100, 'Kinh nghiệm không được quá 100 năm'),
  specialization: z
    .string()
    .min(3, 'Chuyên môn phải có ít nhất 3 ký tự')
    .max(200, 'Chuyên môn không được quá 200 ký tự'),
  teachingLanguage: z
    .string()
    .min(2, 'Vui lòng chọn ngôn ngữ giảng dạy')
    .max(50, 'Ngôn ngữ giảng dạy không được quá 50 ký tự'),
  bio: z
    .string()
    .min(50, 'Tiểu sử phải có ít nhất 50 ký tự')
    .max(1000, 'Tiểu sử không được quá 1000 ký tự'),
  certificates: z
    .array(certificateSchema)
    .min(1, 'Vui lòng thêm ít nhất một chứng chỉ'),
});

// Export type inference for TypeScript
export type TutorApplicationFormData = z.infer<typeof tutorApplicationSchema>;
export type CertificateFormData = z.infer<typeof certificateSchema>;
