import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Review } from '../types';

interface ReviewCardProps {
  review: Review;
}

/**
 * Helper function to generate initials from a name
 * @param name - Full name of the student
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * ReviewCard component displays a single student review.
 * 
 * Requirements: 8.2, 8.5
 * - Display student name with avatar/initials
 * - Show course title, rating (stars), comment, and date
 * - Format date in relative format (e.g., "2 days ago")
 */
export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const initials = getInitials(review.studentName);
  const createdAt = new Date(review.createdAt);
  
  // Format date in relative format (e.g., "2 days ago") - Requirement 8.2
  const relativeDate = formatDistanceToNow(createdAt, { addSuffix: true });

  // Generate star rating display
  const stars = Array.from({ length: 5 }, (_, index) => index < review.rating);

  return (
    <Card className="hover:shadow-md transition-shadow" role="listitem">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Student Avatar with Initials (Requirement 8.5) */}
          <Avatar className="h-10 w-10 shrink-0" aria-label={`${review.studentName}'s avatar`}>
            <AvatarFallback className="bg-primary/10 text-primary font-medium" aria-label={`Initials: ${initials}`}>
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Student Name and Date */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-medium text-gray-900" aria-label={`Review by ${review.studentName}`}>
                {review.studentName}
              </p>
              <time className="text-xs text-gray-500 shrink-0" dateTime={review.createdAt} aria-label={`Posted ${relativeDate}`}>
                {relativeDate}
              </time>
            </div>

            {/* Course Title */}
            <p className="text-sm text-gray-600 mb-2 line-clamp-1" aria-label={`Course: ${review.courseTitle}`}>
              {review.courseTitle}
            </p>

            {/* Star Rating */}
            <div className="flex items-center gap-1 mb-2" role="img" aria-label={`Rating: ${review.rating} out of 5 stars`}>
              {stars.map((filled, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${
                    filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                  aria-hidden="true"
                />
              ))}
              <span className="text-sm text-gray-600 ml-1" aria-hidden="true">({review.rating})</span>
            </div>

            {/* Review Comment */}
            {review.comment && (
              <p className="text-sm text-gray-700 line-clamp-3" aria-label={`Review comment: ${review.comment}`}>
                {review.comment}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
