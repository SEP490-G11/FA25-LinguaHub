import React, { useState } from 'react';
import { ConfirmationDialog } from './confirmation-dialog';
import { Button } from './button';

/**
 * Example usage of the ConfirmationDialog component
 * This file demonstrates how to use the confirmation dialog
 * and can be used for testing purposes.
 */
export const ConfirmationDialogExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    console.log('User confirmed the action');
    // Handle the confirmed action here
  };

  const handleCancel = () => {
    console.log('User cancelled the action');
    // Handle the cancelled action here (optional)
  };

  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)}>
        Open Confirmation Dialog
      </Button>

      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Confirm Action"
        description="Are you sure you want to proceed with this action? This cannot be undone."
        confirmText="Yes, Proceed"
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

/**
 * Example for the approved course editing use case
 * This shows how the dialog would be used specifically for
 * the approved course editing feature.
 */
export const ApprovedCourseEditExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleEditApprovedCourse = () => {
    console.log('Creating draft for approved course...');
    // This would call the createCourseDraft API
    // and navigate to the edit course page
  };

  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)}>
        Edit Approved Course
      </Button>

      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Edit Approved Course"
        description="Bạn có chắc chắn muốn chỉnh sửa khóa học đã được duyệt không?"
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={handleEditApprovedCourse}
      />
    </div>
  );
};

export default ConfirmationDialogExample;