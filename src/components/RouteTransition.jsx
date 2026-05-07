// Lightweight cross-fade between routes — wraps <Outlet/> in a layout.
// Re-mounts its child on every pathname change with a `key`, which lets a
// CSS keyframe animate the new content in. 150ms is fast enough that it
// reads as a soft transition without feeling like a "loading" delay.

import { useLocation } from 'react-router-dom';

export default function RouteTransition({ children }) {
  const location = useLocation();
  return (
    <>
      <div key={location.pathname} className="route-fade">
        {children}
      </div>
      <style>{`
        .route-fade {
          animation: route-fade-in 150ms ease-out both;
          will-change: opacity, transform;
        }
        @keyframes route-fade-in {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @media (prefers-reduced-motion: reduce) {
          .route-fade { animation: none; }
        }
      `}</style>
    </>
  );
}
