import { ROUTES } from '@/constants/routes';

/**
 * Get the route for actionable item cards
 * @param itemType - The type of actionable item
 * @returns The route path for the actionable item management page
 */
export function getActionableItemRoute(
  itemType: 'tutors' | 'courses' | 'refunds' | 'withdraws' | 'reports'
): string {
  switch (itemType) {
    case 'tutors':
      return ROUTES.ADMIN_TUTOR_APPROVAL;
    
    case 'courses':
      return ROUTES.ADMIN_COURSE_APPROVAL;
    
    case 'refunds':
      return ROUTES.ADMIN_REFUND_MANAGEMENT;
    
    case 'withdraws':
      return ROUTES.ADMIN_WITHDRAW_REQUESTS;
    
    case 'reports':
      // TODO: Add route when reports management page is implemented
      return ROUTES.ADMIN_DASHBOARD;
    
    default:
      return ROUTES.ADMIN_DASHBOARD;
  }
}

/**
 * Navigate to an actionable item management page
 * @param itemType - The type of actionable item
 * @param navigate - The navigate function from react-router-dom
 */
export function navigateToActionableItem(
  itemType: 'tutors' | 'courses' | 'refunds' | 'withdraws' | 'reports',
  navigate: (path: string) => void
): void {
  const route = getActionableItemRoute(itemType);
  navigate(route);
}
