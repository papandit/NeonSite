// Resets the window scroll to the top whenever the route changes, so every page
// opens from the top instead of inheriting the previous page's scroll position.
// (React Router does not do this by default.)

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
