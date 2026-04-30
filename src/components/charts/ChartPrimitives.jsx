import { LineChart as LineIcon } from 'lucide-react';

export function ChartEmpty({ icon: Icon = LineIcon, message = 'No data to display', hint = 'Data will appear here once available.' }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center px-6 py-8">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ background: 'var(--surface-muted)', color: 'var(--text-subtle)' }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{message}</p>
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}

export function isEmpty(data) {
  return !Array.isArray(data) || data.length === 0;
}

export function AreaGradient({ id, color, from = 0.28, to = 0 }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={from} />
      <stop offset="95%" stopColor={color} stopOpacity={to} />
    </linearGradient>
  );
}

export function BarGradient({ id, color }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={1} />
      <stop offset="100%" stopColor={color} stopOpacity={0.55} />
    </linearGradient>
  );
}

export function CustomTooltip({ active, payload, label, valueFormatter, labelFormatter }) {
  if (!active || !payload || !payload.length) return null;
  const displayLabel = labelFormatter ? labelFormatter(label) : label;
  return (
    <div
      className="rounded-xl px-3 py-2.5 shadow-lg backdrop-blur"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        color: 'var(--text)',
        minWidth: 140,
      }}
    >
      {displayLabel !== undefined && (
        <div className="text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
          {displayLabel}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: p.color || p.stroke || p.fill }}
            />
            <span className="flex-1" style={{ color: 'var(--text-muted)' }}>
              {p.name}
            </span>
            <span className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
              {valueFormatter ? valueFormatter(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
