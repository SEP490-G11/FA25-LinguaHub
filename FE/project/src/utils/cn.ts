import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

//Gộp nhiều className vào 1 chuỗi duy nhất, tự động xử lý trùng lặp.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
