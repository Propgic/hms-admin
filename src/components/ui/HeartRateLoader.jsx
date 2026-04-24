/**
 * Heart-rate (ECG) loading animation.
 *
 * Uses SVG stroke-dasharray to draw the line in, then out — no background
 * masking rectangles, so the loader works on any surface (cards, buttons,
 * table overlays, page backgrounds) in both light and dark mode without
 * leaving visible grey patches.
 *
 * `size` picks preset dimensions — "md" for page/section loaders, "sm" for
 * inline use in buttons or tight table overlays.
 */
const SIZES = {
  sm: { w: 44, h: 22 },
  md: { w: 150, h: 73 },
};

const STROKE = 'oklch(54.6% 0.245 262.881)';

export default function HeartRateLoader({ fullPage = false, label, size = 'md', inline = false }) {
  const { w, h } = SIZES[size] || SIZES.md;

  const wrapperClass = inline
    ? 'inline-flex items-center justify-center'
    : fullPage
      ? 'flex flex-col items-center justify-center w-full min-h-[calc(100vh-10rem)] gap-3'
      : 'flex flex-col items-center justify-center w-full py-8 gap-3';

  return (
    <div className={wrapperClass}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={`${w}px`}
        height={`${h}px`}
        viewBox="0 0 150 73"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Loading"
        role="img"
      >
        <polyline
          className="hr-ecg-line"
          fill="none"
          stroke={STROKE}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
          points="0,45.486 38.514,45.486 44.595,33.324 50.676,45.486 57.771,45.486 62.838,55.622 71.959,9 80.067,63.729 84.122,45.486 97.297,45.486 103.379,40.419 110.473,45.486 150,45.486"
        />
      </svg>
      {label && !inline && <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>}
      <style>{`
        .hr-ecg-line {
          stroke-dasharray: 1 1;
          stroke-dashoffset: 1;
          animation: hrEcgSweep 2.2s linear infinite;
        }
        @keyframes hrEcgSweep {
          0%   { stroke-dashoffset: 1; }
          55%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -1; }
        }
      `}</style>
    </div>
  );
}
