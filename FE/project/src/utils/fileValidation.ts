/**
 * Validation result interface
 */
export interface FileValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates an image file's type and size.
 * 
 * @param file The file to validate
 * @param maxSizeMB Maximum allowed size in Megabytes (default: 1)
 * @returns {FileValidationResult} Result object containing isValid boolean and optional error message
 */
/**
 * Validates a file's type and size.
 * 
 * @param file The file to validate
 * @param maxSizeMB Maximum allowed size in Megabytes (default: 1)
 * @param allowedTypes Array of allowed MIME types (e.g., ['image/', 'application/pdf']). 
 *                     If an item ends with '/', it treats it as a prefix (e.g., 'image/' allows 'image/png', 'image/jpeg').
 * @returns {FileValidationResult} Result object containing isValid boolean and optional error message
 */
export function validateFile(file: File, maxSizeMB: number = 1, allowedTypes: string[] = ['image/']): FileValidationResult {
    // Validate file type
    const isTypeValid = allowedTypes.some(type => {
        if (type.endsWith('/')) {
            return file.type.startsWith(type);
        }
        return file.type === type;
    });

    if (!isTypeValid) {
        return {
            isValid: false,
            error: 'Định dạng file không được hỗ trợ'
        };
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
        return {
            isValid: false,
            error: `Kích thước file không được quá ${maxSizeMB}MB`
        };
    }

    return { isValid: true };
}

/**
 * Validates an image file's type and size (Wrapper for backward compatibility or specific usage).
 */
export function validateImageFile(file: File, maxSizeMB: number = 1): FileValidationResult {
    return validateFile(file, maxSizeMB, ['image/']);
}
