import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, Lock, ShieldAlert, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Error types that can occur in the dashboard
 */
export type DashboardErrorType = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'server'
  | 'unknown';

/**
 * Props for DashboardErrorState component
 */
export interface DashboardErrorStateProps {
  error: Error | unknown;
  onRetry?: () => void;
}

/**
 * Determines the error type from an error object
 */
const getErrorType = (error: Error | unknown): DashboardErrorType => {
  if (!(error instanceof Error)) {
    return 'unknown';
  }

  const message = error.message.toLowerCase();
  
  // Check for authentication errors (401)
  if (
    message.includes('401') || 
    message.includes('unauthorized') ||
    message.includes('authentication')
  ) {
    return 'authentication';
  }

  // Check for authorization errors (403)
  if (
    message.includes('403') || 
    message.includes('forbidden') ||
    message.includes('access denied')
  ) {
    return 'authorization';
  }

  // Check for network errors
  if (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('connection') ||
    message.includes('timeout')
  ) {
    return 'network';
  }

  // Check for server errors (5xx)
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('server error') ||
    message.includes('internal server')
  ) {
    return 'server';
  }

  return 'unknown';
};

/**
 * Gets error configuration based on error type
 */
const getErrorConfig = (errorType: DashboardErrorType) => {
  switch (errorType) {
    case 'authentication':
      return {
        icon: Lock,
        title: 'Authentication Required',
        description: 'Your session has expired. Please log in again to continue.',
        showRetry: false,
        showLogin: true,
        variant: 'destructive' as const,
      };
    
    case 'authorization':
      return {
        icon: ShieldAlert,
        title: 'Access Denied',
        description: 'You do not have permission to access the admin dashboard. Please contact your administrator if you believe this is an error.',
        showRetry: false,
        showLogin: false,
        variant: 'destructive' as const,
      };
    
    case 'network':
      return {
        icon: WifiOff,
        title: 'Network Error',
        description: 'Unable to connect to the server. Please check your internet connection and try again.',
        showRetry: true,
        showLogin: false,
        variant: 'destructive' as const,
      };
    
    case 'server':
      return {
        icon: ServerCrash,
        title: 'Server Error',
        description: 'The server encountered an error while processing your request. Our team has been notified. Please try again in a few moments.',
        showRetry: true,
        showLogin: false,
        variant: 'destructive' as const,
      };
    
    case 'unknown':
    default:
      return {
        icon: AlertCircle,
        title: 'Error Loading Dashboard',
        description: 'An unexpected error occurred while loading the dashboard. Please try again.',
        showRetry: true,
        showLogin: false,
        variant: 'destructive' as const,
      };
  }
};

/**
 * DashboardErrorState Component
 * 
 * Displays error states for the Admin Dashboard with appropriate messaging
 * and actions based on the error type.
 * 
 * Handles:
 * - Network errors: Connection issues, timeouts
 * - Authentication errors (401): Session expired
 * - Authorization errors (403): Insufficient permissions
 * - Server errors (5xx): Backend failures
 * - Unknown errors: Unexpected failures
 * 
 * Features:
 * - Retry functionality for recoverable errors
 * - Login redirect for authentication errors
 * - Clear, user-friendly error messages
 * - Appropriate icons for each error type
 */
export const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({ 
  error, 
  onRetry 
}) => {
  const errorType = getErrorType(error);
  const config = getErrorConfig(errorType);
  const Icon = config.icon;

  const handleLogin = () => {
    // Clear any stale tokens
    localStorage.clear();
    sessionStorage.clear();
    // Redirect to login page
    window.location.href = '/login';
  };

  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

  return (
    <div className="container mx-auto p-6" role="alert" aria-live="assertive">
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <Icon className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-xl font-semibold" id="error-title">{config.title}</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground" id="error-description">{config.description}</p>
          
          {/* Show detailed error message in development */}
          {process.env.NODE_ENV === 'development' && (
            <Alert variant="default" className="mt-4" role="status">
              <AlertDescription className="text-xs font-mono">
                <strong>Debug Info:</strong> {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="flex gap-2" role="group" aria-label="Error recovery actions">
            {config.showRetry && onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline"
                className="gap-2"
                aria-label="Retry loading dashboard"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
            )}

            {config.showLogin && (
              <Button 
                onClick={handleLogin}
                variant="default"
                aria-label="Go to login page"
              >
                Go to Login
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Memoized version of DashboardErrorState for performance optimization
 */
export const MemoizedDashboardErrorState = React.memo(DashboardErrorState);

export default DashboardErrorState;
