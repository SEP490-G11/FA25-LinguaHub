export interface Course {
    id: number;
    title: string;
    shortDescription: string;
    description: string;
    requirement?: string | null;
    level: string;
    duration: number;
    price: number;
    language: string;
    thumbnailURL: string;
    categoryName: string;
    tutorName: string;
    status: string;
    avgRating: number;
    totalRatings: number;
    learnerCount: number;
    tutorAvatarURL?: string | null;
    tutorAddress?: string | null;
    createdAt: string;
    isWishListed?: boolean;
    isPurchased?: boolean | null;
    tutorID: number;
}
