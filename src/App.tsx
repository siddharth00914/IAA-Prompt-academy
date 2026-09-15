import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import Layout from '@/components/Layout';
import TaxiwayLoader from '@/components/TaxiwayLoader';

// Route pages are code-split: the initial chunk carries only the router,
// the eager Layout chrome (Navbar/Footer/Toast), and shared libs.
const Home = lazy(() => import('@/pages/Home'));
const Journey = lazy(() => import('@/pages/Journey'));
const GateOverview = lazy(() => import('@/pages/GateOverview'));
const Lesson = lazy(() => import('@/pages/Lesson'));
const GateCheck = lazy(() => import('@/pages/GateCheck'));
const Lab = lazy(() => import('@/pages/Lab'));
const Safety = lazy(() => import('@/pages/Safety'));
const Arrival = lazy(() => import('@/pages/Arrival'));
const Manual = lazy(() => import('@/pages/Manual'));
const Stub = lazy(() => import('@/pages/Stub'));

/** Per-route Suspense so the eager chrome never flashes during page loads. */
function Page({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60dvh] items-center justify-center">
          <TaxiwayLoader label="TAXIING TO GATE" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

/**
 * Routing contract: Layout renders <Outlet/> (nested-route pattern).
 * Layout owns the fixed-navbar offset — pages must not add their own.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route
            index
            element={
              <Page>
                <Home />
              </Page>
            }
          />
          <Route
            path="journey"
            element={
              <Page>
                <Journey />
              </Page>
            }
          />
          <Route
            path="gates/:gateId"
            element={
              <Page>
                <GateOverview />
              </Page>
            }
          />
          <Route
            path="gates/:gateId/legs/:legId"
            element={
              <Page>
                <Lesson />
              </Page>
            }
          />
          <Route
            path="gates/:gateId/check"
            element={
              <Page>
                <GateCheck />
              </Page>
            }
          />
          <Route
            path="lab"
            element={
              <Page>
                <Lab />
              </Page>
            }
          />
          <Route
            path="safety"
            element={
              <Page>
                <Safety />
              </Page>
            }
          />
          <Route
            path="arrival"
            element={
              <Page>
                <Arrival />
              </Page>
            }
          />
          <Route
            path="manual"
            element={
              <Page>
                <Manual />
              </Page>
            }
          />
          <Route
            path="*"
            element={
              <Page>
                <Stub label="OFF ROUTE" title="This taxiway doesn't exist.">
                  <p>The page you asked for isn't on any flight plan we filed.</p>
                </Stub>
              </Page>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
