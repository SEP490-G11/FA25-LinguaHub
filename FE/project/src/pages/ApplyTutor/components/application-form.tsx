import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tutorApplicationSchema, TutorApplicationFormData } from '../schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguages } from '@/hooks/useLanguages';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { FileUploadField } from '@/components/shared/FileUploadField';

interface ApplicationFormProps {
  onSubmit: (data: TutorApplicationFormData) => void;
  isSubmitting?: boolean;
}

export function ApplicationForm({ onSubmit, isSubmitting = false }: ApplicationFormProps) {
  const { languages, isLoading: isLoadingLanguages } = useLanguages();
  const form = useForm<TutorApplicationFormData>({
    resolver: zodResolver(tutorApplicationSchema),
    mode: 'onChange',
    defaultValues: {
      experience: 0,
      specialization: '',
      teachingLanguage: '',
      bio: '',
      certificates: [{ certificateName: '', documentUrl: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'certificates',
  });

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Đăng ký trở thành gia sư</CardTitle>
        <CardDescription>
          Điền vào biểu mẫu dưới đây để gửi đơn đăng ký trở thành gia sư trên nền tảng của chúng tôi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Experience Field */}
            <FormField
              control={form.control}
              name="experience"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Kinh nghiệm (năm) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Nhập số năm kinh nghiệm giảng dạy của bạn"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      disabled={isSubmitting}
                      className={cn(
                        'transition-all duration-200',
                        fieldState.error && 'border-red-500 focus-visible:ring-red-500',
                        !fieldState.error && field.value > 0 && 'border-green-500 focus-visible:ring-green-500'
                      )}
                      aria-invalid={fieldState.error ? 'true' : 'false'}
                      aria-describedby={fieldState.error ? 'experience-error' : 'experience-description'}
                    />
                  </FormControl>
                  <FormMessage id="experience-error" />
                </FormItem>
              )}
            />

            {/* Specialization Field */}
            <FormField
              control={form.control}
              name="specialization"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Chuyên môn *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập chuyên môn của bạn"
                      {...field}
                      disabled={isSubmitting}
                      className={cn(
                        'transition-all duration-200',
                        fieldState.error && 'border-red-500 focus-visible:ring-red-500',
                        !fieldState.error && field.value.length >= 3 && 'border-green-500 focus-visible:ring-green-500'
                      )}
                      aria-invalid={fieldState.error ? 'true' : 'false'}
                      aria-describedby={fieldState.error ? 'specialization-error' : 'specialization-description'}
                    />
                  </FormControl>
                  <FormMessage id="specialization-error" />
                </FormItem>
              )}
            />

            {/* Teaching Language Field */}
            <FormField
              control={form.control}
              name="teachingLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngôn ngữ giảng dạy *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting || isLoadingLanguages}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ngôn ngữ bạn sẽ giảng dạy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.id} value={language.name}>
                          {language.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bio Field */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field, fieldState }) => {
                const charCount = field.value?.length || 0;
                const maxChars = 1000;
                const minChars = 50;
                const isValid = charCount >= minChars && charCount <= maxChars;

                return (
                  <FormItem>
                    <FormLabel>Tiểu sử *</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Hãy cho chúng tôi biết về bản thân, triết lý giảng dạy và lý do bạn muốn trở thành gia sư..."
                        disabled={isSubmitting}
                        className={cn(
                          'transition-all duration-200',
                          fieldState.error && 'border-red-500 focus-visible:ring-red-500',
                          !fieldState.error && isValid && 'border-green-500 focus-visible:ring-green-500'
                        )}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between">

                      <span
                        className={cn(
                          'text-sm transition-colors duration-200',
                          charCount < minChars && 'text-muted-foreground',
                          charCount >= minChars && charCount <= maxChars && 'text-green-600',
                          charCount > maxChars && 'text-red-600'
                        )}
                        aria-live="polite"
                      >
                        {charCount}/{maxChars}
                      </span>
                    </div>
                    <FormMessage id="bio-error" />
                  </FormItem>
                );
              }}
            />

            {/* Certificates Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel>Chứng chỉ *</FormLabel>
                  <FormDescription>
                    Thêm ít nhất một chứng chỉ để chứng minh trình độ của bạn
                  </FormDescription>
                </div>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} className="relative transition-all duration-300 hover:shadow-md">
                  <CardContent className="pt-6 space-y-4">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 transition-all duration-200 hover:scale-110 hover:bg-red-50"
                        onClick={() => remove(index)}
                        disabled={isSubmitting}
                        aria-label={`Remove certificate ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Certificate Name Field */}
                    <FormField
                      control={form.control}
                      name={`certificates.${index}.certificateName`}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Tên chứng chỉ</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ví dụ: Chứng chỉ TESOL, Thạc sĩ Giáo dục"
                              {...field}
                              disabled={isSubmitting}
                              className={cn(
                                'transition-all duration-200',
                                fieldState.error && 'border-red-500 focus-visible:ring-red-500',
                                !fieldState.error && field.value.length > 0 && 'border-green-500 focus-visible:ring-green-500'
                              )}
                              aria-invalid={fieldState.error ? 'true' : 'false'}
                              aria-describedby={fieldState.error ? `certificate-name-${index}-error` : undefined}
                            />
                          </FormControl>
                          <FormMessage id={`certificate-name-${index}-error`} />
                        </FormItem>
                      )}
                    />

                    {/* Document URL Field */}
                    <FormField
                      control={form.control}
                      name={`certificates.${index}.documentUrl`}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>File tài liệu</FormLabel>
                          <FormControl>
                            <FileUploadField
                              value={field.value}
                              onChange={field.onChange}
                              error={fieldState.error?.message}
                              allowedTypes={['application/pdf', 'image/']}
                              accept=".pdf,image/*"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full transition-all duration-200 hover:scale-[1.02]"
                onClick={() => append({ certificateName: '', documentUrl: '' })}
                disabled={isSubmitting}
                aria-label="Add another certificate"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm chứng chỉ
              </Button>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid || form.formState.isSubmitting}
              className="w-full transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isSubmitting ? 'Submitting application' : 'Submit application'}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang gửi...
                </span>
              ) : 'Gửi đơn đăng ký'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
