import { useId } from 'react';

export const CHART_COLORS = {
  primary: '#3B82F6',
  primaryDeep: '#2563EB',
  emerald: '#10B981',
  emeraldDeep: '#059669',
  amber: '#F59E0B',
  rose: '#F43F5E',
  violet: '#8B5CF6',
  sky: '#0EA5E9',
  pink: '#EC4899',
  slate: '#64748B',
};

export const PIE_PALETTE = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#F43F5E',
  '#8B5CF6',
  '#0EA5E9',
  '#EC4899',
  '#64748B',
];

export const ANIM = {
  duration: 1100,
  easing: 'ease-out',
  pieDuration: 900,
  barDuration: 900,
};

export const AXIS_TICK = {
  fontSize: 11,
  fill: 'var(--text-muted)',
};

export const GRID_STROKE = 'var(--border)';

export function useGradientId(prefix = 'grad') {
  const id = useId();
  return `${prefix}-${id.replace(/:/g, '')}`;
}
