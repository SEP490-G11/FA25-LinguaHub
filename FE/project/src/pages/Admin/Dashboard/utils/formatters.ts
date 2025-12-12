import { formatDistanceToNow, format, type Locale } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format a number as Vietnamese Dong (VND) currency
 * @param value - The numeric value to format
 * @returns Formatted currency string with VND symbol and thousand separators
 * @example formatCurrency(1000000) => "1.000.000 ₫"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 * @param date - The date to format (Date object or ISO string)
 * @param locale - Optional locale (defaults to Vietnamese)
 * @returns Relative time string
 * @example formatRelativeTime(new Date()) => "vài giây trước"
 * @example formatRelativeTime('2024-01-01') => "3 tháng trước"
 */
export function formatRelativeTime(
  date: Date | string,
  locale: Locale = vi
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale,
  });
}

/**
 * Format a date as absolute date string
 * @param date - The date to format (Date object or ISO string)
 * @param formatStr - Optional format string (defaults to 'dd/MM/yyyy')
 * @returns Formatted date string
 * @example formatDate(new Date()) => "01/12/2024"
 */
export function formatDate(
  date: Date | string,
  formatStr: string = 'dd/MM/yyyy'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Format a number as percentage
 * @param value - The numeric value to format (e.g., 0.25 for 25% or 25 for 25%)
 * @param decimalPlaces - Number of decimal places (defaults to 2)
 * @param isDecimal - Whether the value is in decimal form (0.25) or percentage form (25)
 * @returns Formatted percentage string
 * @example formatPercentage(0.25, 2, true) => "25.00%"
 * @example formatPercentage(25, 2, false) => "25.00%"
 * @example formatPercentage(33.333, 1, false) => "33.3%"
 */
export function formatPercentage(
  value: number,
  decimalPlaces: number = 2,
  isDecimal: boolean = false
): string {
  const percentValue = isDecimal ? value * 100 : value;
  return `${percentValue.toFixed(decimalPlaces)}%`;
}

/**
 * Format a large number with thousand separators (no currency symbol)
 * @param value - The numeric value to format
 * @returns Formatted number string with thousand separators
 * @example formatNumber(1000000) => "1.000.000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}
