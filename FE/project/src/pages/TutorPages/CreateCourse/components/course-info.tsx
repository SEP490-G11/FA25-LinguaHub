import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUploadField } from '@/components/shared/FileUploadField';
import { getCategories, CourseFormData, Category } from '@/pages/TutorPages/CreateCourse/course-api';
import { useLanguages } from '@/hooks/useLanguages';
import { RefreshCw, Loader2 } from 'lucide-react';

interface Step1Props {
  data: Partial<CourseFormData>;
  onNext: (data: CourseFormData) => void;
  isSubmitting?: boolean;
}

type ValidationErrors = Partial<Record<keyof CourseFormData, string>>;

export function Step1CourseInfo({ data, onNext, isSubmitting = false }: Step1Props) {
  const [formData, setFormData] = useState<CourseFormData>({
    title: data.title || '',
    shortDescription: data.shortDescription || '',
    description: data.description || '',
    requirement: data.requirement || '',
    level: data.level || 'BEGINNER',
    categoryID: data.categoryID || 1,
    language: data.language || 'English',
    duration: data.duration || 0,
    price: data.price || 0,
    thumbnailURL: data.thumbnailURL || '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Categories and languages state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const { languages, isLoading: isLoadingLanguages, error: languagesError, refetch: refetchLanguages } = useLanguages();

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const validateField = (name: string, value: unknown): string | undefined => {
    switch (name) {
      case 'title':
        if (!value || typeof value !== 'string') return 'Tiêu đề là bắt buộc';
        if (value.length < 3) return 'Tiêu đề phải có ít nhất 3 ký tự';
        if (value.length > 100) return 'Tiêu đề không được vượt quá 100 ký tự';
        return undefined;

      case 'shortDescription':
        if (!value || typeof value !== 'string') return 'Mô tả ngắn là bắt buộc';
        if (value.length < 5) return 'Mô tả ngắn phải có ít nhất 5 ký tự';
        if (value.length > 200) return 'Mô tả ngắn không được vượt quá 200 ký tự';
        return undefined;

      case 'description':
        if (!value || typeof value !== 'string') return 'Mô tả là bắt buộc';
        if (value.length < 5) return 'Mô tả phải có ít nhất 5 ký tự';
        if (value.length > 1000) return 'Mô tả không được vượt quá 1000 ký tự';
        return undefined;

      case 'requirement':
        if (!value || typeof value !== 'string') return 'Yêu cầu là bắt buộc';
        if (value.length < 5) return 'Yêu cầu phải có ít nhất 5 ký tự';
        if (value.length > 500) return 'Yêu cầu không được vượt quá 500 ký tự';
        return undefined;

      case 'level':
        if (!value) return 'Cấp độ là bắt buộc';
        return undefined;

      case 'categoryID':
        if (!value) return 'Danh mục là bắt buộc';
        return undefined;

      case 'language':
        if (!value) return 'Ngôn ngữ là bắt buộc';
        return undefined;

      case 'duration':
        if (!value) return 'Thời lượng là bắt buộc';
        const duration = Number(value);
        if (isNaN(duration)) return 'Thời lượng phải là số';
        if (duration < 1 || duration > 999) return 'Thời lượng phải từ 1 đến 999 giờ';
        return undefined;

      case 'price':
        if (value === undefined || value === null || value === '') return 'Giá là bắt buộc';
        const price = Number(value);
        if (isNaN(price)) return 'Giá phải là số';
        if (price < 0) return 'Giá không thể âm';
        if (price > 999999999) return 'Giá không được vượt quá 999,999,999 VND';
        if (!Number.isInteger(price)) return 'Giá phải là số nguyên';
        return undefined;

      case 'thumbnailURL':
        if (!value || typeof value !== 'string') return 'Vui lòng nhập URL ảnh bìa';
        if (!value.trim()) return 'Vui lòng nhập URL ảnh bìa';

        // Validate URL format
        try {
          const url = new URL(value);
          if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return 'URL phải bắt đầu bằng http:// hoặc https://';
          }

          // Validate image extension
          const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
          const hasValidExtension = validExtensions.some(ext =>
            value.toLowerCase().includes(ext)
          );

          if (!hasValidExtension) {
            return 'URL phải là ảnh hợp lệ (JPG, PNG, WEBP, GIF)';
          }
        } catch (error) {
          return 'URL không hợp lệ. Vui lòng nhập URL đầy đủ (VD: https://example.com/image.jpg)';
        }

        return undefined;

      default:
        return undefined;
    }
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof CourseFormData]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration' || name === 'price'
        ? Number(value) || 0
        : value
    }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleThumbnailChange = (url: string) => {
    setFormData(prev => ({ ...prev, thumbnailURL: url }));
    setTouched(prev => ({ ...prev, thumbnailURL: true }));
    if (url) {
      setErrors(prev => ({ ...prev, thumbnailURL: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allTouched: Record<string, boolean> = {};
    const allErrors: ValidationErrors = {};

    // Validate all required fields including thumbnailURL
    ['title', 'shortDescription', 'description', 'requirement', 'categoryID', 'language', 'level', 'duration', 'price', 'thumbnailURL'].forEach((key) => {
      allTouched[key] = true;
      const error = validateField(key, formData[key as keyof CourseFormData]);
      if (error) allErrors[key as keyof ValidationErrors] = error;
    });

    setTouched(allTouched);
    setErrors(allErrors);

    if (Object.keys(allErrors).length === 0) {
      onNext(formData as CourseFormData);
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    // Check if all required fields are filled
    const requiredFields: (keyof CourseFormData)[] = [
      'title',
      'shortDescription',
      'description',
      'requirement',
      'categoryID',
      'language',
      'level',
      'duration',
      'price',
      'thumbnailURL'
    ];

    const allFieldsFilled = requiredFields.every((field) => {
      const value = formData[field];
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'number') return value > 0;
      return value !== undefined && value !== null;
    });

    // Check if there are any errors
    const hasErrors = Object.values(errors).some((error) => error !== undefined);

    return allFieldsFilled && !hasErrors;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-sm font-medium">
            Tiêu đề khóa học <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            onBlur={() => handleBlur('title')}
            placeholder="VD: Tiếng Anh giao tiếp cho người mới bắt đầu"
            className={errors.title && touched.title ? 'border-red-500' : ''}
          />
          {errors.title && touched.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <Label htmlFor="shortDescription" className="text-sm font-medium">
            Mô tả ngắn <span className="text-red-500">*</span>
          </Label>
          <Input
            id="shortDescription"
            value={formData.shortDescription || ''}
            onChange={(e) => handleChange('shortDescription', e.target.value)}
            onBlur={() => handleBlur('shortDescription')}
            placeholder="Tóm tắt ngắn gọn về khóa học (tối đa 200 ký tự)"
            maxLength={200}
            className={errors.shortDescription && touched.shortDescription ? 'border-red-500' : ''}
          />
          <div className="flex justify-between mt-1">
            {errors.shortDescription && touched.shortDescription ? (
              <p className="text-sm text-red-500">{errors.shortDescription}</p>
            ) : (
              <span />
            )}
            <p className="text-sm text-gray-500">
              {formData.shortDescription?.length || 0}/200
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium">
            Mô tả chi tiết <span className="text-red-500">*</span>
          </Label>
          <RichTextEditor
            value={formData.description || ''}
            onChange={(value) => handleChange('description', value)}
            placeholder="Mô tả chi tiết về khóa học của bạn..."
            className={
              errors.description && touched.description
                ? 'border-red-500 rounded-md'
                : ''
            }
          />
          {errors.description && touched.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <Label htmlFor="requirement" className="text-sm font-medium">
            Yêu cầu <span className="text-red-500">*</span>
          </Label>
          <RichTextEditor
            value={formData.requirement || ''}
            onChange={(value) => handleChange('requirement', value)}
            placeholder="Liệt kê các yêu cầu để tham gia khóa học..."
            className={
              errors.requirement && touched.requirement
                ? 'border-red-500 rounded-md'
                : ''
            }
          />
          {errors.requirement && touched.requirement && (
            <p className="text-sm text-red-500 mt-1">{errors.requirement}</p>
          )}
        </div>

        <div>
          <Label htmlFor="category" className="text-sm font-medium">
            Danh mục <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.categoryID?.toString() || ''}
            onValueChange={(value) => {
              handleChange('categoryID', parseInt(value));
              setTouched((prev) => ({ ...prev, categoryID: true }));
            }}
            disabled={isLoadingCategories}
          >
            <SelectTrigger
              className={
                errors.categoryID && touched.categoryID
                  ? 'border-red-500'
                  : ''
              }
            >
              <SelectValue placeholder={isLoadingCategories ? "Đang tải..." : "Chọn danh mục"} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.categoryId} value={String(category.categoryId)}>
                  {category.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryID && touched.categoryID && (
            <p className="text-sm text-red-500 mt-1">{errors.categoryID}</p>
          )}
        </div>

        <div>
          <Label htmlFor="level" className="text-sm font-medium">
            Cấp độ <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.level || 'BEGINNER'}
            onValueChange={(value) => {
              handleChange('level', value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED');
              setTouched((prev) => ({ ...prev, level: true }));
            }}
          >
            <SelectTrigger
              className={
                errors.level && touched.level
                  ? 'border-red-500'
                  : ''
              }
            >
              <SelectValue placeholder="Chọn cấp độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BEGINNER">Cơ bản</SelectItem>
              <SelectItem value="INTERMEDIATE">Trung cấp</SelectItem>
              <SelectItem value="ADVANCED">Nâng cao</SelectItem>
            </SelectContent>
          </Select>
          {errors.level && touched.level && (
            <p className="text-sm text-red-500 mt-1">{errors.level}</p>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium">
            Ngôn ngữ giảng dạy <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.language || 'English'}
            onValueChange={(value) => {
              handleChange('language', value);
              setTouched((prev) => ({ ...prev, language: true }));
            }}
            disabled={isLoadingLanguages || !!languagesError}
          >
            <SelectTrigger
              className={
                errors.language && touched.language
                  ? 'border-red-500'
                  : ''
              }
            >
              <SelectValue placeholder={isLoadingLanguages ? "Đang tải..." : "Chọn ngôn ngữ"} />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.id} value={lang.name}>
                  {lang.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {languagesError && (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm text-red-500 flex-1">{languagesError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refetchLanguages}
                className="flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Thử lại
              </Button>
            </div>
          )}
          {errors.language && touched.language && !languagesError && (
            <p className="text-sm text-red-500 mt-1">{errors.language}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration" className="text-sm font-medium">
              Thời lượng (giờ) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="999"
              value={formData.duration || ''}
              onChange={(e) =>
                handleChange('duration', Number(e.target.value))
              }
              onBlur={() => handleBlur('duration')}
              placeholder="VD: 40"
              className={
                errors.duration && touched.duration
                  ? 'border-red-500'
                  : ''
              }
            />
            {errors.duration && touched.duration && (
              <p className="text-sm text-red-500 mt-1">
                {errors.duration}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="price" className="text-sm font-medium">
              Giá (VND) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              max="999999999"
              step="1"
              value={formData.price || ''}
              onChange={(e) =>
                handleChange('price', Number(e.target.value))
              }
              onBlur={() => handleBlur('price')}
              placeholder="VD: 1500000"
              className={
                errors.price && touched.price ? 'border-red-500' : ''
              }
            />
            {errors.price && touched.price && (
              <p className="text-sm text-red-500 mt-1">{errors.price}</p>
            )}
          </div>
        </div>

        <FileUploadField
          value={formData.thumbnailURL || ''}
          onChange={handleThumbnailChange}
          label="Ảnh bìa"
          error={errors.thumbnailURL && touched.thumbnailURL ? errors.thumbnailURL : undefined}
          allowedTypes={['image/']}
          accept="image/*"
        />
      </div>

      <div className="flex justify-end pt-6">
        <Button type="submit" disabled={!isFormValid() || isSubmitting}>
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
