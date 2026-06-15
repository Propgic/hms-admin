import Modal from '../../components/ui/Modal';

// Per-metric "how it's calculated" definitions. Each returns the displayed
// value, a plain-language formula, the actual inputs that produced it, and a
// one-line explanation — so clicking a card shows exactly how the number comes.
const DEFS = {
  totalRevenue: (o) => ({
    title: 'Total Revenue',
    value: o.totalRevenue,
    formula: "Sum of every subscription's amount booked this calendar year",
    rows: [
      ['Counted', 'All subscriptions created this year'],
      ['= Total revenue', o.totalRevenue],
    ],
    note: 'Gross billed value of subscriptions created this year — not cash actually collected (see Billing for paid vs. outstanding).',
  }),
  totalHospitals: (o) => ({
    title: 'Total Hospitals',
    value: String(o.totalHospitals ?? 0),
    formula: 'Count of all hospital tenants on the platform',
    rows: [
      ['Total tenants', String(o.totalHospitals ?? 0)],
      ['Active', String(o.activeHospitals ?? 0)],
      ['Suspended / inactive', String((o.totalHospitals ?? 0) - (o.activeHospitals ?? 0))],
    ],
    note: 'Every hospital ever onboarded, regardless of current status.',
  }),
  avgRevenue: (o) => ({
    title: 'Avg Revenue / Hospital',
    value: o.avgRevenue,
    formula: 'Total revenue ÷ active hospitals',
    rows: [
      ['Total revenue', o.totalRevenue],
      ['÷ Active hospitals', String(o.activeHospitals ?? 0)],
      ['= Avg / hospital', o.avgRevenue],
    ],
    note: 'Average billed revenue per active hospital this year.',
  }),
  churnRate: (o) => ({
    title: 'Churn Rate',
    value: o.churnRate,
    formula: '(Total hospitals − active hospitals) ÷ total hospitals',
    rows: [
      ['Total hospitals', String(o.totalHospitals ?? 0)],
      ['Active hospitals', String(o.activeHospitals ?? 0)],
      ['Churned (suspended)', String((o.totalHospitals ?? 0) - (o.activeHospitals ?? 0))],
      ['= Churn rate', o.churnRate],
    ],
    note: 'Share of hospital tenants currently suspended or inactive.',
  }),
  mrr: (o, m) => ({
    title: 'MRR — Monthly Recurring Revenue',
    value: m.mrr,
    formula: "Sum of each active subscription's monthly-equivalent (yearly plans ÷ 12)",
    rows: [
      ['Active subscriptions', String(m.activeSubs ?? 0)],
      ['= MRR', m.mrr],
    ],
    note: 'Normalized recurring revenue per month. A ₹99,999/yr plan contributes ₹8,333/mo.',
  }),
  arr: (o, m) => ({
    title: 'ARR — Annual Recurring Revenue',
    value: m.arr,
    formula: 'MRR × 12',
    rows: [
      ['MRR', m.mrr],
      ['× 12 months', ''],
      ['= ARR', m.arr],
    ],
    note: 'MRR projected over a full year.',
  }),
  arpu: (o, m) => ({
    title: 'ARPU — Avg Revenue Per User',
    value: m.arpu,
    formula: 'MRR ÷ active subscriptions',
    rows: [
      ['MRR', m.mrr],
      ['÷ Active subscriptions', String(m.activeSubs ?? 0)],
      ['= ARPU', m.arpu],
    ],
    note: 'Average monthly recurring revenue per active subscription.',
  }),
  ltv: (o, m) => ({
    title: 'LTV — Lifetime Value',
    value: m.ltv,
    formula: 'ARPU ÷ monthly revenue-churn rate',
    rows: [
      ['ARPU', m.arpu],
      ['÷ Revenue churn', `${m.revenueChurnRate ?? 0}%`],
      ['= LTV', m.ltv],
    ],
    note: 'Estimated total revenue from a subscription over its lifetime (capped when churn is near zero).',
  }),
};

export default function MetricInfoModal({ metric, overview, mrr, onClose }) {
  if (!metric || !DEFS[metric]) return null;
  const def = DEFS[metric](overview || {}, mrr || {});

  return (
    <Modal isOpen={!!metric} onClose={onClose} title={def.title} size="md">
      <div className="space-y-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 tabular-nums">{def.value}</p>

        <div className="rounded-lg bg-gray-50 dark:bg-slate-800/60 p-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">How it's calculated</p>
          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{def.formula}</p>
        </div>

        <div className="rounded-lg border border-gray-100 dark:border-slate-800 overflow-hidden">
          {def.rows.map(([k, v], i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 text-sm border-b border-gray-50 dark:border-slate-800/70 last:border-b-0"
            >
              <span className="text-gray-600 dark:text-slate-400">{k}</span>
              <span className="font-medium text-gray-900 dark:text-slate-100 tabular-nums">{v}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{def.note}</p>
      </div>
    </Modal>
  );
}
