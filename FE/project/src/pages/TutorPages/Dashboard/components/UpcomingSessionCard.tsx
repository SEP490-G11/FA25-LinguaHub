import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { UpcomingSession } from '../types';
import { cn } from '@/lib/utils';

interface UpcomingSessionCardProps {
  session: UpcomingSession;
}

/**
 * UpcomingSessionCard component displays a single upcoming 1-on-1 session.
 * Shows session start/end time, student name, and status with appropriate styling.
 * 
 * Requirements: 7.2
 * - Display session start/end time, student name, and status
 * - Format times in user-friendly format
 * - Style with appropriate status indicators
 */
export const UpcomingSessionCard: React.FC<UpcomingSessionCardProps> = ({ session }) => {
  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);

  // Format times in user-friendly format (e.g., "2:00 PM")
  const formattedStartTime = format(startTime, 'h:mm a');
  const formattedEndTime = format(endTime, 'h:mm a');
  const formattedDate = format(startTime, 'MMM dd, yyyy');

  // Determine status badge styling
  const statusVariant = session.status === 'Paid' ? 'default' : 'secondary';
  const statusColor = session.status === 'Paid' 
    ? 'bg-green-100 text-green-800 hover:bg-green-100' 
    : 'bg-blue-100 text-blue-800 hover:bg-blue-100';

  return (
    <Card className="hover:shadow-md transition-shadow" role="listitem">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Student Name */}
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-1.5 rounded-full" aria-hidden="true">
                <User className="h-4 w-4 text-primary" />
              </div>
              <p className="font-medium text-gray-900 truncate" aria-label={`Student: ${session.studentName}`}>
                {session.studentName}
              </p>
            </div>

            {/* Session Title */}
            <p className="text-sm text-gray-600 mb-2 line-clamp-1" aria-label={`Session: ${session.title}`}>
              {session.title}
            </p>

            {/* Time Information */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <time dateTime={session.startTime} aria-label={`Scheduled for ${formattedDate} from ${formattedStartTime} to ${formattedEndTime}`}>
                {formattedDate} • {formattedStartTime} - {formattedEndTime}
              </time>
            </div>
          </div>

          {/* Status Badge */}
          <Badge 
            variant={statusVariant}
            className={cn('shrink-0', statusColor)}
            aria-label={`Status: ${session.status}`}
          >
            {session.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
