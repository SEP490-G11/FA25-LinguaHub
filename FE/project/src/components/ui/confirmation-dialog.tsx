import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface ConfirmationDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback to handle dialog open state changes
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Dialog title text
   */
  title: string;
  /**
   * Dialog description/message text
   */
  description: string;
  /**
   * Text for the confirm button (defaults to "OK")
   */
  confirmText?: string;
  /**
   * Text for the cancel button (defaults to "Cancel")
   */
  cancelText?: string;
  /**
   * Callback when user confirms the action
   */
  onConfirm: () => void;
  /**
   * Optional callback when user cancels the action
   */
  onCancel?: () => void;
  /**
   * Optional variant for the confirm button styling
   */
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

/**
 * A reusable confirmation dialog component that displays a modal dialog
 * asking the user to confirm or cancel an action.
 * 
 * Features:
 * - Customizable title, description, and button text
 * - Proper accessibility attributes and keyboard navigation
 * - Consistent styling with the design system
 * - TypeScript support with proper interfaces
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'default',
}) => {
  const handleConfirm = React.useCallback(() => {
    onConfirm();
    onOpenChange(false);
  }, [onConfirm, onOpenChange]);

  const handleCancel = React.useCallback(() => {
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={confirmVariant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialog;