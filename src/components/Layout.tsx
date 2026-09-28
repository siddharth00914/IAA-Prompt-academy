import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Navbar, { NAV_HEIGHT } from '@/components/Navbar';
import Footer from '@/components/Footer';
import LearningSessionTrackerHost from '@/components/LearningSessionTrackerHost';
import ProgressHydrator from '@/components/ProgressHydrator';
import { ToastProvider } from '@/components/Toast';
import { AdminViewProvider } from '@/lib/admin-view';
import { initSmoothScroll, getLenis } from '@/lib/smooth-scroll';

/**
 * Layout — global chrome. Renders the fixed Navbar, the Night Ops footer,
 * the site-wide grain overlay, Lenis smooth scrolling, and the Toast system.
 *
 * Routing contract (react-dev.md): this Layout renders <Outlet/> and is used
 * as a nested layout route in App.tsx. Because the Navbar is `fixed` (design
 * calls for an overlay nav over the hero), Layout owns the offset: the
 * content slot gets top padding equal to the nav height. Full-bleed heroes
 * opt out inside the page (e.g. `-mt-16`), not by removing this offset.
 *
 * Page agents: do NOT add nav-height padding in pages and do NOT edit Navbar.
 */
export default function Layout() {
  const location = useLocation();

  // Lenis smooth scrolling (no-op when prefers-reduced-motion)
  useEffect(() => initSmoothScroll(), []);

  // return to top on route change
  useEffect(() => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AdminViewProvider>
      <ToastProvider>
        <ProgressHydrator />
        <LearningSessionTrackerHost />
        <div className="grain-overlay" aria-hidden />
        <Navbar />
        <main style={{ paddingTop: NAV_HEIGHT }} className="min-h-[100dvh]">
          <Outlet />
        </main>
        <Footer />
      </ToastProvider>
    </AdminViewProvider>
  );
}
