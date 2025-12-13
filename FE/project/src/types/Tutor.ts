export interface TutorApiResponse {
    totalRatings: number;
    avgRating: number;
    tutorId: number;
    userId: number;
    userEmail: string;
    userName: string;
    avatarURL: string | null;
    country: string | null;
    specialization: string | null;
    teachingLanguage: string | null;
    pricePerHour: number | null;
    status: string;
}
export interface Tutor {
    id: number;
    name: string;
    language: string[];
    country: string;
    rating: number;
    reviews: number;
    price: number;
    specialties: string[];
    image: string;
    description: string;
    availability: string;
}
