import * as XLSX from 'xlsx';

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

export interface ParseResult {
  success: boolean;
  questions: QuizQuestionData[];
  errors: string[];
  importedCount: number;
}

interface ExcelRow {
  questionText?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  correctAnswer?: string;
  explanation?: string;
  score?: number;
}

// Required columns for validation
const REQUIRED_COLUMNS = [
  'questionText',
  'option1',
  'option2',
  'correctAnswer',
  'explanation',
];

/**
 * Validates that the Excel worksheet has all required columns
 */
export function validateExcelStructure(
  worksheet: XLSX.WorkSheet
): { valid: boolean; missingColumns: string[] } {
  // Get the first row (headers)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const headers: string[] = [];

  // Extract headers from first row
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
    const cell = worksheet[cellAddress];
    if (cell && cell.v) {
      headers.push(String(cell.v).trim());
    }
  }

  // Check for missing required columns
  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !headers.includes(col)
  );

  return {
    valid: missingColumns.length === 0,
    missingColumns,
  };
}

/**
 * Helper function to detect if a value looks like an Excel date serial number
 */
function isExcelDateSerial(value: any): boolean {
  if (typeof value !== 'number') return false;
  // Excel date serials are typically between 1 (1900-01-01) and 2958465 (9999-12-31)
  // But for scores, we expect values < 1000
  return value > 1000;
}

/**
 * Transforms an Excel row into a QuizQuestionData object
 * Returns null if the row is invalid or missing required fields
 */
export function transformRowToQuestion(
  row: ExcelRow,
  orderIndex: number
): QuizQuestionData | null {
  // Validate required fields
  if (
    !row.questionText ||
    !row.option1 ||
    !row.option2 ||
    !row.correctAnswer ||
    !row.explanation
  ) {
    return null;
  }

  // Trim all text fields
  const questionText = String(row.questionText).trim();
  const option1 = String(row.option1).trim();
  const option2 = String(row.option2).trim();
  const option3 = row.option3 ? String(row.option3).trim() : '';
  const option4 = row.option4 ? String(row.option4).trim() : '';
  const correctAnswer = String(row.correctAnswer).trim();
  const explanation = String(row.explanation).trim();

  // Validate that required fields are not empty after trimming
  if (!questionText || !option1 || !option2 || !correctAnswer || !explanation) {
    return null;
  }

  // Build options array
  const options: QuizOptionData[] = [];
  let optionOrderIndex = 0;

  // Add option1 (required)
  options.push({
    optionText: option1,
    isCorrect: option1 === correctAnswer,
    orderIndex: optionOrderIndex++,
  });

  // Add option2 (required)
  options.push({
    optionText: option2,
    isCorrect: option2 === correctAnswer,
    orderIndex: optionOrderIndex++,
  });

  // Add option3 if present
  if (option3) {
    options.push({
      optionText: option3,
      isCorrect: option3 === correctAnswer,
      orderIndex: optionOrderIndex++,
    });
  }

  // Add option4 if present
  if (option4) {
    options.push({
      optionText: option4,
      isCorrect: option4 === correctAnswer,
      orderIndex: optionOrderIndex++,
    });
  }

  // Validate that exactly one option is marked as correct
  const correctCount = options.filter((opt) => opt.isCorrect).length;
  if (correctCount !== 1) {
    return null;
  }

  // Handle score - default to 1 if not provided or invalid
  let score = 1;
  if (row.score !== undefined && row.score !== null) {
    // Check if it's an Excel date serial number
    if (isExcelDateSerial(row.score)) {
      console.warn(
        `Score value "${row.score}" looks like an Excel date. ` +
        `Please format the Score column as Text or use comma (1,5) instead of dot (1.5). ` +
        `Using default score of 1.`
      );
    } else {
      // Convert to string first to handle various formats
      const scoreStr = String(row.score).trim();
      
      // Replace comma with dot for decimal numbers (European format)
      const normalizedScore = scoreStr.replace(',', '.');
      
      const parsedScore = Number(normalizedScore);
      
      // Check if it's a valid number
      if (!isNaN(parsedScore) && parsedScore > 0 && parsedScore < 1000) {
        score = parsedScore;
      } else {
        console.warn(`Invalid score value: ${row.score}, using default score of 1`);
      }
    }
  }

  return {
    questionText,
    orderIndex,
    explanation,
    score,
    options,
  };
}

/**
 * Main function to parse an Excel file and extract quiz questions
 * Handles file reading, validation, and transformation
 */
export async function parseExcelFile(
  file: File,
  startOrderIndex: number
): Promise<ParseResult> {
  const errors: string[] = [];
  const questions: QuizQuestionData[] = [];

  try {
    // Read file using FileReader API
    const arrayBuffer = await readFileAsArrayBuffer(file);

    // Parse the Excel file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Get the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        questions: [],
        errors: ['File Excel không có dữ liệu'],
        importedCount: 0,
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];

    // Validate structure
    const validation = validateExcelStructure(worksheet);
    if (!validation.valid) {
      return {
        success: false,
        questions: [],
        errors: [
          `Thiếu các cột bắt buộc: ${validation.missingColumns.join(', ')}`,
        ],
        importedCount: 0,
      };
    }

    // Convert worksheet to JSON
    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: undefined,
    });

    // Check if there are any data rows
    if (rows.length === 0) {
      return {
        success: false,
        questions: [],
        errors: ['File Excel không có dữ liệu'],
        importedCount: 0,
      };
    }

    // Transform each row to a question
    let currentOrderIndex = startOrderIndex;
    let skippedCount = 0;
    let dateWarningShown = false;

    rows.forEach((row, index) => {
      // Check for Excel date issue in score column
      if (!dateWarningShown && row.score && isExcelDateSerial(row.score)) {
        errors.push(
          `⚠️ Cột Score có giá trị ngày tháng. Vui lòng format cột thành Text hoặc dùng dấu phẩy (1,5) thay vì dấu chấm (1.5)`
        );
        dateWarningShown = true;
      }

      const question = transformRowToQuestion(row, currentOrderIndex);
      if (question) {
        questions.push(question);
        currentOrderIndex++;
      } else {
        skippedCount++;
        errors.push(`Dòng ${index + 2} bị bỏ qua do dữ liệu không hợp lệ`);
      }
    });

    // Check if any valid questions were found
    if (questions.length === 0) {
      return {
        success: false,
        questions: [],
        errors: ['Không tìm thấy câu hỏi hợp lệ trong file'],
        importedCount: 0,
      };
    }

    // Return success result
    return {
      success: true,
      questions,
      errors: skippedCount > 0 ? errors : [],
      importedCount: questions.length,
    };
  } catch (error) {
    return {
      success: false,
      questions: [],
      errors: [
        `Lỗi khi đọc file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
      importedCount: 0,
    };
  }
}

/**
 * Helper function to read a file as ArrayBuffer using FileReader API
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as ArrayBuffer);
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsArrayBuffer(file);
  });
}
