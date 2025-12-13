import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Download } from 'lucide-react';
import { parseExcelFile, ParseResult } from '@/utils/excel-parser';
import { downloadQuizTemplate } from '@/utils/create-quiz-template';
import { toast } from 'sonner';

// Types matching the course structure
interface QuizQuestionData {
  questionText: string;
  orderIndex: number;
  explanation: string;
  score: number;
  options: QuizOptionData[];
}

interface QuizOptionData {
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface ImportQuizQuestionsExcelProps {
  sectionIndex: number;
  lessonIndex: number;
  currentQuestionCount: number;
  onImport: (questions: QuizQuestionData[]) => void;
  disabled?: boolean;
}

export default function ImportQuizQuestionsExcel({
  sectionIndex,
  lessonIndex,
  currentQuestionCount,
  onImport,
  disabled = false,
}: ImportQuizQuestionsExcelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    console.log('Import button clicked');
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    console.log('File selected:', file?.name);
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    // Validate file type
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    console.log('File extension:', fileExtension);
    
    if (!validExtensions.includes(fileExtension)) {
      console.log('Invalid file extension');
      toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      console.log('File too large:', file.size);
      toast.error('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Set loading state
    console.log('Starting to parse file...');
    setIsLoading(true);

    try {
      // Parse the Excel file
      const result: ParseResult = await parseExcelFile(file, currentQuestionCount);

      console.log('Parse result:', result);

      if (result.success && result.questions.length > 0) {
        console.log('Calling onImport with questions:', result.questions);
        
        // Call onImport callback with parsed questions
        onImport(result.questions);

        // Display success toast
        if (result.errors.length > 0) {
          // Partial success
          const skippedCount = result.errors.length;
          toast.success(
            `Đã import ${result.importedCount} câu hỏi. ${skippedCount} câu hỏi bị bỏ qua do lỗi dữ liệu`
          );
        } else {
          // Full success
          toast.success(`Đã import thành công ${result.importedCount} câu hỏi`);
        }
      } else {
        // Display error toast with details
        console.log('Import failed:', result.errors);
        const errorMessage = result.errors.length > 0 
          ? result.errors[0] 
          : 'Không thể import câu hỏi từ file';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error importing questions:', error);
      toast.error('Không thể đọc file. Vui lòng thử lại');
    } finally {
      // Reset loading state
      setIsLoading(false);
      
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadQuizTemplate();
      toast.success('Đã tải xuống file mẫu');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Không thể tải xuống file mẫu');
    }
  };

  return (
    <div className="flex gap-2 w-full">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleDownloadTemplate}
        disabled={disabled || isLoading}
        className="gap-2"
        title="Tải xuống file Excel mẫu"
      >
        <Download className="w-3 h-3" />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleButtonClick}
        disabled={disabled || isLoading}
        className="flex-1 gap-2 border-dashed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          <>
            <Upload className="w-3 h-3" />
            Import Excel
          </>
        )}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}
