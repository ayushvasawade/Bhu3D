import { useState, useEffect, useCallback } from 'react';

export type AppRoute =
  | { name: 'globe' }
  | { name: 'building-details'; buildingId: string };

function parsePath(pathname: string): AppRoute {
  // Matches /building/:buildingId or /building/:buildingId/
  const match = pathname.match(/^\/building\/([^/]+)/);
  if (match) {
    const rawId = decodeURIComponent(match[1]);
    return { name: 'building-details', buildingId: rawId };
  }
  return { name: 'globe' };
}

export function useRouter() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [route, setRoute] = useState<AppRoute>(() => parsePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      setRoute(parsePath(path));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
      setRoute(parsePath(path));
    }
  }, []);

  const navigateToBuilding = useCallback((buildingId: string | number) => {
    navigate(`/building/${buildingId}`);
  }, [navigate]);

  const navigateToGlobe = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return {
    currentPath,
    route,
    navigate,
    navigateToBuilding,
    navigateToGlobe
  };
}
