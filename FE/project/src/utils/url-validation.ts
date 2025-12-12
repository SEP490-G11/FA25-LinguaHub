/**
 * URL Validation Utilities
 */

/**
 * Validate if a string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return true; // Empty is valid (optional field)
  
  try {
    const urlObj = new URL(url);
    // Check if protocol is http or https
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validate if a string is a valid YouTube URL
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return true; // Empty is valid (optional field)
  
  if (!isValidUrl(url)) return false;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if it's a YouTube domain
    return (
      hostname === 'www.youtube.com' ||
      hostname === 'youtube.com' ||
      hostname === 'youtu.be' ||
      hostname === 'm.youtube.com'
    );
  } catch {
    return false;
  }
};

/**
 * Get error message for invalid URL
 */
export const getUrlErrorMessage = (url: string, fieldName: string = 'URL'): string => {
  if (!url || url.trim() === '') return '';
  
  if (!isValidUrl(url)) {
    return `${fieldName} phải là URL hợp lệ bắt đầu bằng http:// hoặc https://`;
  }
  
  return '';
};

/**
 * Get error message for invalid YouTube URL
 */
export const getYouTubeUrlErrorMessage = (url: string, isRequired: boolean = false): string => {
  if (!url || url.trim() === '') {
    return isRequired ? 'URL video là bắt buộc' : '';
  }
  
  if (!isValidUrl(url)) {
    return 'URL video phải là URL hợp lệ bắt đầu bằng http:// hoặc https://';
  }
  
  if (!isValidYouTubeUrl(url)) {
    return 'URL video phải là link YouTube hợp lệ (youtube.com hoặc youtu.be)';
  }
  
  return '';
};

/**
 * Get error message for resource URL with required check
 */
export const getResourceUrlErrorMessage = (url: string, isRequired: boolean = false): string => {
  if (!url || url.trim() === '') {
    return isRequired ? 'URL tài nguyên là bắt buộc' : '';
  }
  
  if (!isValidUrl(url)) {
    return 'URL tài nguyên phải là URL hợp lệ bắt đầu bằng http:// hoặc https://';
  }
  
  return '';
};