import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GitCompare } from 'lucide-react';
import CourseDetailPage from './CourseDetailPage';
import { ChangeComparisonModal } from './components/change-comparison-modal';
import { ROUTES } from '@/constants/routes';

export default function DraftDetailPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();
  const [showChanges, setShowChanges] = useState(false);

  if (!draftId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            ID không hợp lệ
          </h2>
          <p className="text-gray-600 mb-6">
            Không thể xác định khóa học. Vui lòng quay lại danh sách và thử lại.
          </p>
          <Button
            onClick={() => navigate(ROUTES.ADMIN_COURSE_APPROVAL_DRAFTS)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const handleShowChanges = () => {
    setShowChanges(true);
  };

  const handleCloseChanges = () => {
    setShowChanges(false);
  };

  const additionalActionsButton = (
    <Button
      onClick={handleShowChanges}
      variant="outline"
      className="w-full gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
    >
      <GitCompare className="w-4 h-4" />
      Xem thay đổi
    </Button>
  );

  return (
    <>
      <CourseDetailPage
        courseId={draftId}
        isDraft={true}
        additionalActions={additionalActionsButton}
      />
      
      <ChangeComparisonModal
        open={showChanges}
        draftID={parseInt(draftId)}
        onClose={handleCloseChanges}
      />
    </>
  );
}
