import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { Review } from '../types';
import { ReviewCard } from './ReviewCard';

interface RecentReviewsListProps {
  reviews: Review[];
}

/**
 * RecentReviewsList component displays a list of recent student reviews.
 * 
 * Requirements: 8.1, 8.3, 8.4
 * - Render list of recent reviews (max 10)
 * - Sort reviews by creation date (most recent first)
 * - Handle empty state with "No reviews yet" message
 */
export const RecentReviewsList: React.FC<RecentReviewsListProps> = ({ reviews }) => {
  // Sort reviews by creation date in descending order (most recent first) - Requirement 8.4
  const sortedReviews = [...reviews].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Limit to maximum 10 reviews (Requirement 8.1)
  const displayReviews = sortedReviews.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
          Đánh giá gần đây
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayReviews.length === 0 ? (
          // Empty state (Requirement 8.3)
          <div className="text-center py-8 text-muted-foreground" role="status" aria-label="Chưa có đánh giá">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
            <p>Chưa có đánh giá</p>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="Recent student reviews">
            {displayReviews.map((review) => (
              <ReviewCard key={review.reviewId} review={review} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
