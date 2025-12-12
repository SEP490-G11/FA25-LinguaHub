/**
 * Locale utility functions for language display
 */

export type SupportedLocale = 'vi' | 'en';

/**
 * Detect user's locale from browser settings
 * @returns 'vi' for Vietnamese, 'en' for English (default)
 */
export function detectUserLocale(): SupportedLocale {
  // Check browser language
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // Check if Vietnamese
  if (browserLang && browserLang.toLowerCase().startsWith('vi')) {
    return 'vi';
  }
  
  // Default to English
  return 'en';
}

/**
 * Get the current locale (can be extended to use context/state in the future)
 * @returns Current locale setting
 */
export function getCurrentLocale(): SupportedLocale {
  // For now, detect from browser
  // In the future, this could check user preferences from context/localStorage
  return detectUserLocale();
}
