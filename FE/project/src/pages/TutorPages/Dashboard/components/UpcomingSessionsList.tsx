import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { UpcomingSession } from '../types';
import { UpcomingSessionCard } from './UpcomingSessionCard';

interface UpcomingSessionsListProps {
  sessions: UpcomingSession[];
}

/**
 * UpcomingSessionsList component displays a list of upcoming 1-on-1 booking sessions.
 * 
 * Requirements: 7.1, 7.3, 7.4, 7.5
 * - Render list of upcoming sessions (max 5)
 * - Sort sessions chronologically by start time
 * - Filter to only show "Paid" or "Locked" status
 * - Handle empty state with "No upcoming sessions" message
 */
export const UpcomingSessionsList: React.FC<UpcomingSessionsListProps> = ({ sessions }) => {
  // Filter to only show "Paid" or "Locked" status (Requirement 7.5)
  const filteredSessions = sessions.filter(
    (session) => session.status === 'Paid' || session.status === 'Locked'
  );

  // Sort sessions chronologically by start time (Requirement 7.4)
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  // Limit to maximum 5 sessions (Requirement 7.1)
  const displaySessions = sortedSessions.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" aria-hidden="true" />
          Buổi học sắp tới
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displaySessions.length === 0 ? (
          // Empty state (Requirement 7.3)
          <div className="text-center py-8 text-muted-foreground" role="status" aria-label="Không có buổi học sắp tới">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
            <p>Không có buổi học sắp tới</p>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="Upcoming booking sessions">
            {displaySessions.map((session) => (
              <UpcomingSessionCard key={session.slotId} session={session} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
