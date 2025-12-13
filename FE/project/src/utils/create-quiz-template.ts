import * as XLSX from 'xlsx';

/**
 * Creates a sample Excel template for quiz questions
 * Downloads the file to the user's computer
 */
export function downloadQuizTemplate() {
  // Sample data with various score formats
  const sampleData = [
    {
      questionText: 'What is 2 + 2?',
      option1: '3',
      option2: '4',
      option3: '5',
      option4: '6',
      correctAnswer: '4',
      explanation: '2 + 2 equals 4',
      score: 1,
    },
    {
      questionText: 'Which planet is known as the Red Planet?',
      option1: 'Venus',
      option2: 'Mars',
      option3: 'Jupiter',
      option4: 'Saturn',
      correctAnswer: 'Mars',
      explanation: 'Mars is called the Red Planet due to its reddish appearance',
      score: '1,5', // Using comma for decimal to avoid Excel date conversion
    },
  ];

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 50 }, // questionText
    { wch: 20 }, // option1
    { wch: 20 }, // option2
    { wch: 20 }, // option3
    { wch: 20 }, // option4
    { wch: 20 }, // correctAnswer
    { wch: 50 }, // explanation
    { wch: 10 }, // score
  ];

  // Format score column as text to prevent date conversion
  // Find the score column (column H, index 7)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 7 }); // Column H (score)
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].t = 's'; // Set cell type to string
      worksheet[cellAddress].z = '@'; // Set number format to text
    }
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Quiz Questions');

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, 'quiz-template.xlsx');
}
