import { useEffect, useCallback } from 'react';

/**
 * Custom hook for keyboard shortcuts in the Admin Dashboard
 * Task 17.2: Implement keyboard navigation
 * 
 * This hook provides keyboard shortcut functionality for common dashboard actions.
 * Currently implements basic shortcuts, can be extended for more complex interactions.
 * 
 * @param onRefresh - Optional callback to refresh dashboard data (Ctrl/Cmd + R)
 */
interface UseKeyboardShortcutsProps {
  onRefresh?: () => void;
}

export const useKeyboardShortcuts = ({ onRefresh }: UseKeyboardShortcutsProps = {}) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check for modifier keys (Ctrl on Windows/Linux, Cmd on Mac)
      const isModifierKey = event.ctrlKey || event.metaKey;

      // Refresh dashboard data: Ctrl/Cmd + R
      if (isModifierKey && event.key === 'r' && onRefresh) {
        event.preventDefault();
        onRefresh();
        return;
      }

      // Help dialog: Shift + ?
      if (event.shiftKey && event.key === '?') {
        event.preventDefault();
        // Future: Show keyboard shortcuts help dialog
        console.log('Keyboard shortcuts help - to be implemented');
        return;
      }

      // Escape key: Clear focus from current element
      if (event.key === 'Escape') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }
    },
    [onRefresh]
  );

  useEffect(() => {
    // Add event listener for keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    // Return any utility functions if needed
    // For now, the hook handles everything internally
  };
};

/**
 * Utility function to focus the first interactive element in a section
 * Useful for keyboard navigation between sections
 * 
 * @param sectionId - The ID of the section to focus
 */
export const focusSection = (sectionId: string) => {
  const section = document.getElementById(sectionId);
  if (section) {
    // Find the first focusable element in the section
    const focusableElements = section.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    } else {
      // If no focusable elements, focus the section itself
      section.setAttribute('tabindex', '-1');
      section.focus();
    }
  }
};

/**
 * Utility function to announce a message to screen readers
 * Uses ARIA live region for dynamic announcements
 * 
 * @param message - The message to announce
 * @param priority - The priority level ('polite' or 'assertive')
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) => {
  // Create or get the live region
  let liveRegion = document.getElementById('screen-reader-announcements');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'screen-reader-announcements';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only'; // Visually hidden but accessible to screen readers
    document.body.appendChild(liveRegion);
  }
  
  // Update the live region with the message
  liveRegion.textContent = message;
  
  // Clear the message after a delay to allow for repeated announcements
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = '';
    }
  }, 1000);
};
