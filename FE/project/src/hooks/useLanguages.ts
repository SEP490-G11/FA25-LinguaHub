import { useState, useEffect } from 'react';
import { getLanguages, Language } from '@/pages/TutorPages/CreateCourse/course-api';

interface UseLanguagesReturn {
  languages: Language[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage languages
 * Handles loading, error states, and retry logic
 */
export function useLanguages(): UseLanguagesReturn {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLanguages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getLanguages();
      setLanguages(data);
    } catch (err) {
      console.error('Failed to fetch languages:', err);
      setError('Không thể tải danh sách ngôn ngữ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  return {
    languages,
    isLoading,
    error,
    refetch: fetchLanguages,
  };
}
