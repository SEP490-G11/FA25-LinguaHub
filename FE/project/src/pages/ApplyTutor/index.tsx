import { useState, useEffect } from 'react';
import { ApplicationForm } from './components/application-form';
import { ApplicationStatus } from './components/application-status';
import { submitTutorApplication, getApplicationStatus } from './api';
import { TutorApplicationFormData } from './schema';
import { ApplicationStatusResponse } from './types';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function ApplyTutor() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusData, setStatusData] = useState<ApplicationStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch application status on component mount
  const checkApplicationStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const status = await getApplicationStatus();
      setStatusData(status);
    } catch (error: any) {
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        'Failed to load application status. Please try again.';
      
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkApplicationStatus();
  }, []);

  const handleSubmit = async (data: TutorApplicationFormData) => {
    setIsSubmitting(true);
    
    try {
      await submitTutorApplication(data);
      
      toast({
        title: 'Success!',
        description: 'Your application has been submitted successfully. We will review it and get back to you soon.',
        variant: 'default',
      });
      
      // Refresh status after successful submission
      await checkApplicationStatus();
    } catch (error: any) {
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        'Failed to submit application. Please try again.';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading spinner while checking status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !statusData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md p-6 text-center">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <button
            onClick={checkApplicationStatus}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      {/* Conditionally render Application Status or Application Form */}
      {statusData ? (
        <ApplicationStatus data={statusData} />
      ) : (
        <ApplicationForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      )}
    </div>
  );
}
