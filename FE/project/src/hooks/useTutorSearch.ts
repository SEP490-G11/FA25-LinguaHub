

interface Tutor {
  id: number;
  name: string;
  language: string;
  country: string;
  rating: number;
  reviews: number;
  price: number;
  specialties: string[];
  image: string;
  description: string;
  availability: string;
}

export const useTutorSearch = (tutors: Tutor[]) => {
  // Normalize text for comparison
  const normalize = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .trim();
  };

  // Search function
  const search = (query: string): number[] => {
    if (!query || query.trim() === '') {
      return tutors.map(t => t.id);
    }

    const normalizedQuery = normalize(query);
    
    // Language synonyms mapping
    const languageSynonyms: Record<string, string[]> = {
      'english': ['english', 'tieng anh', 'anh'],
      'japanese': ['japanese', 'tieng nhat', 'nhat'],
      'korean': ['korean', 'tieng han', 'han'],
      'chinese': ['chinese', 'tieng trung', 'trung'],
      'french': ['french', 'tieng phap', 'phap'],
      'german': ['german', 'tieng duc', 'duc'],
      'spanish': ['spanish', 'tieng tay ban nha'],
      'italian': ['italian', 'tieng y'],
      'vietnamese': ['vietnamese', 'tieng viet', 'viet'],
    };

    // Expand query with synonyms
    let expandedQuery = normalizedQuery;
    for (const [canonical, synonyms] of Object.entries(languageSynonyms)) {
      for (const synonym of synonyms) {
        if (normalizedQuery.includes(synonym)) {
          // Add canonical form to query
          expandedQuery += ' ' + canonical;
          break;
        }
      }
    }
    
    // Remove common stop words
    const stopWords = ['gia', 'su', 'tutor', 'teacher', 'giao', 'vien', 'nguoi', 'den', 'tu'];
    const queryWords = expandedQuery
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.includes(word))
      .filter((word, index, self) => self.indexOf(word) === index); // Remove duplicates

    if (queryWords.length === 0) {
      return tutors.map(t => t.id);
    }

    // Detect if query contains both language and country
    const languageWords = ['english', 'japanese', 'korean', 'chinese', 'french', 'german', 'spanish', 'italian', 'vietnamese', 'tieng', 'anh', 'nhat', 'han', 'trung', 'phap', 'duc'];
    const countryWords = ['vietnam', 'viet', 'nam', 'japan', 'nhat', 'korea', 'han', 'china', 'trung', 'france', 'phap', 'germany', 'duc', 'usa', 'my', 'uk'];
    
    const hasLanguageWord = queryWords.some(w => languageWords.includes(w));
    const hasCountryWord = queryWords.some(w => countryWords.includes(w));
    const requiresBothMatch = hasLanguageWord && hasCountryWord;

    // Score each tutor
    const scoredTutors = tutors.map(tutor => {
      let score = 0;
      let matchedWords = 0;
      let languageMatched = false;
      let countryMatched = false;
      
      const normalizedName = normalize(tutor.name);
      const normalizedLanguage = normalize(tutor.language);
      const normalizedCountry = normalize(tutor.country);
      const normalizedSpecialties = tutor.specialties.map(s => normalize(s)).join(' ');
      const normalizedDescription = normalize(tutor.description);

      // Bonus for exact phrase match in language (very high priority)
      if (normalizedLanguage.includes(normalizedQuery)) {
        score += 100;
        matchedWords = queryWords.length;
        languageMatched = true;
      }

      // Bonus for exact phrase match in specialties
      if (normalizedSpecialties.includes(normalizedQuery)) {
        score += 80;
        matchedWords = queryWords.length;
        languageMatched = true;
      }

      // Check for exact name match first (highest priority)
      if (normalizedName.includes(normalizedQuery)) {
        score += 200;
        matchedWords = queryWords.length;
      }

      // Individual word matching
      queryWords.forEach(word => {
        let wordMatched = false;
        const isLanguageWord = languageWords.includes(word);
        const isCountryWord = countryWords.includes(word);
        
        // Match in name (very high priority for partial name matching)
        if (normalizedName.includes(word)) {
          score += 50;
          wordMatched = true;
        }
        
        // Match in language (high priority)
        if (normalizedLanguage.includes(word)) {
          score += 15;
          wordMatched = true;
          if (isLanguageWord) {
            languageMatched = true;
          }
        }
        
        // Match in specialties
        if (normalizedSpecialties.includes(word)) {
          score += 12;
          wordMatched = true;
          if (isLanguageWord) {
            languageMatched = true;
          }
        }
        
        // Match in country
        if (normalizedCountry.includes(word)) {
          score += 8;
          wordMatched = true;
          if (isCountryWord) {
            countryMatched = true;
          }
        }
        
        // Match in description (lowest priority)
        if (normalizedDescription.includes(word)) {
          score += 0.5;
          wordMatched = true;
        }

        if (wordMatched) {
          matchedWords++;
        }
      });

      // If query requires both language and country, must match both
      if (requiresBothMatch && (!languageMatched || !countryMatched)) {
        score = 0; // Disqualify if doesn't match both
      }

      // Bonus if all words matched
      if (queryWords.length > 1 && matchedWords === queryWords.length) {
        score *= 1.5;
      }

      return { id: tutor.id, score, matchedWords };
    });

    // Filter and sort tutors
    return scoredTutors
      .filter(t => t.score > 3 && t.matchedWords > 0)
      .sort((a, b) => b.score - a.score)
      .map(t => t.id);
  };

  return { search };
};
