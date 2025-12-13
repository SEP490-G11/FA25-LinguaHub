export const CATEGORIES = [
  { id: 1, name: 'IELTS' },
  { id: 2, name: 'TOEIC' },
  { id: 3, name: 'JLPT' },
  { id: 4, name: 'TOPIK' },
  { id: 5, name: 'HSK' },
] as const;

export type Category = typeof CATEGORIES[number];
