// Phát hiện lỗi trong dev mode
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

//Cho phép điều hướng trang
import { BrowserRouter } from 'react-router-dom';

//React Query for server state management
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

//Cuộn lên đầu khi đổi trang
import { ScrollToTop } from '@/hooks/ScrollToTop.tsx';

import App from './App';
import './index.css';

import { GoogleOAuthProvider } from "@react-oauth/google";
import { UserProvider } from '@/contexts/UserContext';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <GoogleOAuthProvider clientId="42781484149-pel6vfv7rb7ih298ru93t6vq1fg8q3sq.apps.googleusercontent.com">
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <UserProvider>
              <ScrollToTop />
              <App />
            </UserProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </StrictMode>
);
