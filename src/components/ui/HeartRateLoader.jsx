/**
 * Heart-rate (ECG) loading animation.
 *
 * Uses scoped CSS via a <style> tag (no styled-components dependency).
 * The two fading panels reveal/cover the SVG line in sync, creating the
 * classic ECG sweep effect. The mask panels pick up the page background via
 * `var(--app-bg)` so they blend into light and dark themes without a visible
 * grey block.
 */
export default function HeartRateLoader({ fullPage = false, label }) {
  const fadeColor = 'var(--app-bg)';
  const stroke = 'oklch(54.6% 0.245 262.881)';

  return (
    <div
      className={
        fullPage
          ? 'flex flex-col items-center justify-center w-full min-h-[calc(100vh-10rem)] gap-3'
          : 'flex flex-col items-center justify-center w-full py-8 gap-3'
      }
    >
      <div className="hr-loader" aria-label="Loading">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          width="150px"
          height="73px"
          viewBox="0 0 150 73"
          xmlSpace="preserve"
        >
          <polyline
            fill="none"
            stroke={stroke}
            strokeWidth={3}
            strokeMiterlimit={10}
            points="0,45.486 38.514,45.486 44.595,33.324 50.676,45.486 57.771,45.486 62.838,55.622 71.959,9 80.067,63.729 84.122,45.486 97.297,45.486 103.379,40.419 110.473,45.486 150,45.486"
          />
        </svg>
        <div className="hr-loader-fade-in" style={{ backgroundColor: fadeColor }} />
        <div className="hr-loader-fade-out" style={{ backgroundColor: fadeColor }} />
      </div>
      {label && <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>}
      <style>{`
        .hr-loader {
          position: relative;
          width: 150px;
          height: 73px;
        }
        .hr-loader-fade-in {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          right: 0;
          animation: hrLoaderIn 2.5s linear infinite;
        }
        .hr-loader-fade-out {
          position: absolute;
          width: 120%;
          height: 100%;
          top: 0;
          left: -120%;
          animation: hrLoaderOut 2.5s linear infinite;
        }
        @keyframes hrLoaderIn {
          0%   { width: 100%; }
          50%  { width: 0; }
          100% { width: 0; }
        }
        @keyframes hrLoaderOut {
          0%   { left: -120%; }
          30%  { left: -120%; }
          100% { left: 0; }
        }
      `}</style>
    </div>
  );
}
