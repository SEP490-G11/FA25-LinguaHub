// Re-export react-router-dom hooks with custom wrappers if needed
export { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';

// Custom hook for pathname
export const usePathname = () => {
  const location = useLocation();
  return location.pathname;
};

// Custom hook for router (compatibility wrapper)
export const useRouter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
    pathname: location.pathname,
    query: Object.fromEntries(new URLSearchParams(location.search)),
  };
};
