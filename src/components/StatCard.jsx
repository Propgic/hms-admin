import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

// Modern stat card — replaces the flat-white look with a layered surface:
// soft branded shadow, subtle gradient overlay, and an icon chip with an
// inner glow. Hover lifts the card on a smooth transition.
//
// Tone is driven by `iconColor` (kept for backwards compat with existing
// callers like Dashboard) — we extract the base hue ('blue', 'emerald', etc.)
// to colour the matching ring + accent line.

function toneFromIconColor(iconColor = 'text-blue-600') {
  // Match the Tailwind hue from class strings like "text-emerald-600".
  const m = String(iconColor).match(/text-([a-z]+)-/);
  return m ? m[1] : 'blue';
}

const TONE_RING = {
  blue:    'ring-blue-100/70',
  indigo:  'ring-indigo-100/70',
  emerald: 'ring-emerald-100/70',
  green:   'ring-emerald-100/70',
  amber:   'ring-amber-100/70',
  yellow:  'ring-amber-100/70',
  rose:    'ring-rose-100/70',
  red:     'ring-rose-100/70',
  violet:  'ring-violet-100/70',
  purple:  'ring-violet-100/70',
};

const TONE_GLOW = {
  blue:    'before:bg-blue-500/[0.04]',
  indigo:  'before:bg-indigo-500/[0.04]',
  emerald: 'before:bg-emerald-500/[0.04]',
  green:   'before:bg-emerald-500/[0.04]',
  amber:   'before:bg-amber-500/[0.04]',
  yellow:  'before:bg-amber-500/[0.04]',
  rose:    'before:bg-rose-500/[0.04]',
  red:     'before:bg-rose-500/[0.04]',
  violet:  'before:bg-violet-500/[0.04]',
  purple:  'before:bg-violet-500/[0.04]',
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeType = 'neutral',
  iconBg = 'bg-blue-100',
  iconColor = 'text-blue-600',
  onClick,
}) {
  const clickable = typeof onClick === 'function';
  const tone = toneFromIconColor(iconColor);
  const ring = TONE_RING[tone] || TONE_RING.blue;
  const glow = TONE_GLOW[tone] || TONE_GLOW.blue;

  const TrendIcon =
    changeType === 'positive' ? TrendingUp :
    changeType === 'negative' ? TrendingDown : Minus;
  const changePill = {
    positive: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10',
    negative: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10',
    neutral:  'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/40',
  }[changeType];

  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } }
          : undefined
      }
      className={clsx(
        'group relative overflow-hidden rounded-2xl p-5',
        'bg-white dark:bg-slate-900',
        'border border-slate-200/70 dark:border-slate-700/60',
        'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-6px_rgba(15,23,42,0.06)]',
        'hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_12px_28px_-8px_rgba(15,23,42,0.10)]',
        'hover:-translate-y-0.5 transition-all duration-200',
        // Soft branded glow rendered via ::before — sits behind content,
        // hue matches the icon tone so each stat card feels uniquely tinted.
        'before:absolute before:inset-0 before:-z-0 before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-300',
        glow,
        clickable && 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
      )}
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 text-[26px] font-bold leading-none tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </p>
          {change && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 mt-2.5 text-[11px] font-medium rounded-full px-2 py-0.5',
                changePill,
              )}
            >
              <TrendIcon className="w-3 h-3" />
              {change}
            </span>
          )}
        </div>
        {Icon && (
          <div
            className={clsx(
              'shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ring-4',
              iconBg,
              ring,
              'shadow-inner',
            )}
          >
            <Icon className={clsx('w-5 h-5', iconColor)} strokeWidth={2.25} />
          </div>
        )}
      </div>
      {clickable && (
        <span className="absolute bottom-3 right-3 z-10 text-slate-300 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-4 h-4" />
        </span>
      )}
    </div>
  );
}
