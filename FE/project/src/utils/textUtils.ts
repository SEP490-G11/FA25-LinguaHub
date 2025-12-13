/**
 * Utility functions for text processing
 * Xử lý LaTeX, special characters, và format text
 */

/**
 * Loại bỏ LaTeX syntax và trả về text thuần
 * Ví dụ: "$\text{has/have}$" -> "has/have"
 *        "$V3/Ved$" -> "V3/Ved"
 */
export const stripLatex = (text: string | null | undefined): string => {
  if (!text) return '';
  
  return text
    // $\text{...}$ -> nội dung bên trong
    .replace(/\$\\text\{([^}]+)\}\$/g, '$1')
    // $\textbf{...}$ -> nội dung bên trong (bold)
    .replace(/\$\\textbf\{([^}]+)\}\$/g, '$1')
    // $\textit{...}$ -> nội dung bên trong (italic)
    .replace(/\$\\textit\{([^}]+)\}\$/g, '$1')
    // $\mathbf{...}$ -> nội dung bên trong
    .replace(/\$\\mathbf\{([^}]+)\}\$/g, '$1')
    // $\frac{a}{b}$ -> a/b
    .replace(/\$\\frac\{([^}]+)\}\{([^}]+)\}\$/g, '$1/$2')
    // $...$ -> nội dung bên trong (inline math)
    .replace(/\$([^$]+)\$/g, '$1')
    // \textbf{...} -> nội dung (không có $)
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    // \textit{...} -> nội dung
    .replace(/\\textit\{([^}]+)\}/g, '$1')
    // \text{...} -> nội dung
    .replace(/\\text\{([^}]+)\}/g, '$1')
    // Loại bỏ các ký tự LaTeX còn sót
    .replace(/\\\\/g, ' ')
    .replace(/\\[a-zA-Z]+/g, '')
    .trim();
};

/**
 * Render text với xử lý LaTeX - dùng cho hiển thị trong UI
 * Alias của stripLatex để dễ đọc hơn
 */
export const renderText = stripLatex;

/**
 * Xử lý HTML content có chứa LaTeX
 * Dùng cho dangerouslySetInnerHTML
 */
export const processHtmlContent = (html: string | null | undefined): string => {
  if (!html) return '';
  
  // Xử lý LaTeX trong HTML
  return html
    .replace(/\$\\text\{([^}]+)\}\$/g, '<span>$1</span>')
    .replace(/\$\\textbf\{([^}]+)\}\$/g, '<strong>$1</strong>')
    .replace(/\$\\textit\{([^}]+)\}\$/g, '<em>$1</em>')
    .replace(/\$([^$]+)\$/g, '<code>$1</code>');
};

/**
 * CSS styles cho Quill content viewer
 * Dùng để hiển thị nội dung được tạo từ Quill editor
 */
export const quillViewerStyles = `
  .ql-editor-view .ql-align-center { text-align: center; }
  .ql-editor-view .ql-align-right { text-align: right; }
  .ql-editor-view .ql-align-justify { text-align: justify; }
  .ql-editor-view .ql-indent-1 { padding-left: 3em; }
  .ql-editor-view .ql-indent-2 { padding-left: 6em; }
  .ql-editor-view .ql-indent-3 { padding-left: 9em; }
  .ql-editor-view .ql-indent-4 { padding-left: 12em; }
  .ql-editor-view .ql-indent-5 { padding-left: 15em; }
  .ql-editor-view .ql-indent-6 { padding-left: 18em; }
  .ql-editor-view .ql-indent-7 { padding-left: 21em; }
  .ql-editor-view .ql-indent-8 { padding-left: 24em; }
  .ql-editor-view .ql-video { width: 100%; aspect-ratio: 16/9; border-radius: 0.5rem; }
  .ql-editor-view img { max-width: 100%; height: auto; border-radius: 0.5rem; }
  .ql-editor-view s { text-decoration: line-through; }
  .ql-editor-view u { text-decoration: underline; }
  .ql-editor-view .ql-size-small { font-size: 0.75em; }
  .ql-editor-view .ql-size-large { font-size: 1.5em; }
  .ql-editor-view .ql-size-huge { font-size: 2.5em; }
  .ql-editor-view .ql-font-serif { font-family: Georgia, Times New Roman, serif; }
  .ql-editor-view .ql-font-monospace { font-family: Monaco, Courier New, monospace; }
`;

/**
 * Prose classes cho Tailwind Typography
 * Dùng kết hợp với ql-editor-view để hiển thị rich content
 */
export const proseClasses = `
  prose prose-lg prose-slate max-w-none ql-editor-view
  prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mb-4 prose-headings:mt-8
  prose-h1:text-3xl prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-3
  prose-h2:text-2xl prose-h3:text-xl
  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-4 prose-p:text-base
  prose-ul:my-4 prose-ul:space-y-2 prose-ul:list-disc prose-ul:pl-6
  prose-ol:my-4 prose-ol:space-y-2 prose-ol:list-decimal prose-ol:pl-6
  prose-li:text-gray-700 prose-li:leading-relaxed prose-li:text-base
  prose-strong:text-gray-900 prose-strong:font-semibold
  prose-em:text-gray-600 prose-em:italic
  prose-blockquote:border-l-4 prose-blockquote:border-blue-500 
  prose-blockquote:bg-blue-50 prose-blockquote:pl-6 prose-blockquote:py-4
  prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:my-6
  prose-blockquote:rounded-r-lg prose-blockquote:shadow-sm
  prose-code:bg-blue-100 prose-code:text-blue-800 prose-code:px-2 
  prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-6 
  prose-pre:rounded-xl prose-pre:my-6 prose-pre:overflow-x-auto
  prose-pre:border-2 prose-pre:border-gray-700
  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800 
  prose-a:font-medium hover:prose-a:underline
  prose-hr:border-gray-300 prose-hr:my-8
  prose-table:border-collapse prose-table:w-full prose-table:border prose-table:border-gray-300
  prose-th:bg-gray-100 prose-th:p-3 prose-th:text-left prose-th:font-semibold
  prose-th:border prose-th:border-gray-300
  prose-td:border prose-td:border-gray-300 prose-td:p-3
  prose-img:rounded-lg prose-img:shadow-md prose-img:my-6
`.trim().replace(/\s+/g, ' ');
