import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, BookOpen, DollarSign, Wallet, AlertTriangle } from 'lucide-react';
import { ActionableItemCard } from './ActionableItemCard';
import { getActionableItemRoute } from '../utils/navigation';
import type { ActionableItems } from '../types';

/**
 * ActionableItemsSection component displays all actionable items requiring administrator attention.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 * - Display count of tutor verification requests (2.1)
 * - Display count of course drafts pending review (2.2)
 * - Display count of refund requests (2.3)
 * - Display count of withdraw requests (2.4)
 * - Display actionable items as prominent cards with visual indicators (2.5)
 * 
 * @param actionableItems - The actionable items data containing counts for each category
 */
interface ActionableItemsSectionProps {
  actionableItems: ActionableItems;
}

export const ActionableItemsSection: React.FC<ActionableItemsSectionProps> = ({
  actionableItems,
}) => {
  const navigate = useNavigate();

  /**
   * Handle navigation to the appropriate management page
   * Requirement 2.6: Navigate to corresponding management page on click
   * Task 18.2: Memoize callback to prevent recreation on every render
   */
  const handleNavigate = React.useCallback((itemType: 'tutors' | 'courses' | 'refunds' | 'withdraws' | 'reports') => {
    const route = getActionableItemRoute(itemType);
    navigate(route);
  }, [navigate]);

  return (
    <section className="mb-6 md:mb-8" aria-labelledby="actionable-items-heading">
      <h2 id="actionable-items-heading" className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900 dark:text-gray-100">
        Công việc cần xử lý
      </h2>
      
      {/* Responsive grid layout: 1 column on mobile, 2 on tablet, 5 on desktop */}
      {/* Requirements 12.1: Mobile - single column, Tablet - 2 columns, Desktop - full grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Pending Tutors - Requirement 2.1 */}
        <ActionableItemCard
          title="Giáo viên chờ duyệt"
          count={actionableItems.pendingTutors}
          icon={UserCheck}
          onClick={() => handleNavigate('tutors')}
        />

        {/* Pending Courses - Requirement 2.2 */}
        <ActionableItemCard
          title="Khóa học chờ duyệt"
          count={actionableItems.pendingCourses}
          icon={BookOpen}
          onClick={() => handleNavigate('courses')}
        />

        {/* Refund Requests - Requirement 2.3 */}
        <ActionableItemCard
          title="Yêu cầu hoàn tiền"
          count={actionableItems.pendingRefundRequests}
          icon={DollarSign}
          onClick={() => handleNavigate('refunds')}
        />

        {/* Withdraw Requests - Requirement 2.4 */}
        <ActionableItemCard
          title="Yêu cầu rút tiền"
          count={actionableItems.pendingWithdraws}
          icon={Wallet}
          onClick={() => handleNavigate('withdraws')}
        />

        {/* Reported Contents - Requirement 2.5 */}
        <ActionableItemCard
          title="Nội dung bị báo cáo"
          count={actionableItems.reportedContents}
          icon={AlertTriangle}
          onClick={() => handleNavigate('reports')}
        />
      </div>
    </section>
  );
};

// Memoize to prevent unnecessary re-renders
export const MemoizedActionableItemsSection = React.memo(ActionableItemsSection);
