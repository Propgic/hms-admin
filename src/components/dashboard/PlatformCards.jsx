// Platform super-admin dashboard cards. Self-contained (each fetches its own
// data, has its own loading/empty state) so the parent can mount any subset
// without orchestration. Keeps the same visual language as the hms tenant
// cards (CardShell pattern, accent gradients, scroll-on-overflow).

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  LifeBuoy, ArrowRight, AlertTriangle, Repeat, CreditCard,
  CalendarClock, Building2, TrendingUp, Layers,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import { formatCurrency } from '../../utils/formatters';

// Small fetch helper — keeps the cards lean and consistent.
function useFetch(url, fallback) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    api.get(url)
      .then((r) => { if (!cancelled) setData(r.data?.data ?? r.data ?? fallback); })
      .catch(() => {
        if (!cancelled) setData(fallback);
        // Cards share this helper; dedupe via a stable id so a full outage
        // collapses to a single toast instead of one per card.
        toast.error('Could not load some dashboard data', { id: 'dashboard-card-fetch' });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  return { data, loading };
}

function EmptyState({ children }) {
  return (
    <div className="h-full flex items-center justify-center text-center">
      <p className="text-xs text-gray-400 dark:text-slate-500 italic px-4">{children}</p>
    </div>
  );
}

function CardShell({ title, subtitle, icon: Icon, accent = 'blue', linkTo, linkLabel, badge, children }) {
  const ACCENT = {
    blue:    'from-blue-500 to-blue-700',
    emerald: 'from-emerald-500 to-emerald-700',
    violet:  'from-violet-500 to-violet-700',
    amber:   'from-amber-500 to-amber-700',
    rose:    'from-rose-500 to-rose-700',
    indigo:  'from-indigo-500 to-indigo-700',
  }[accent] || 'from-blue-500 to-blue-700';
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col h-full min-w-0">
      <div className="shrink-0 flex items-start gap-2 mb-3 min-w-0">
        <span className={clsx('shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br text-white flex items-center justify-center shadow-sm', ACCENT)}>
          <Icon className="w-4.5 h-4.5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-tight truncate">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {linkTo && (
          <Link to={linkTo} className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-300 hover:underline" title={linkLabel || 'View'}>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.4)_transparent]">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// 1) SUPPORT OVERVIEW
// ============================================================================
const STATUS_COLOR = {
  open:    'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
};
const PRIORITY_COLOR = {
  low:    'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  high:   'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

export function SupportOverviewCard() {
  const { data, loading } = useFetch(endpoints.dashboard.supportOverview, {
    counts: { open: 0, pending: 0, resolved: 0, closed: 0, total: 0, unresolved: 0 },
    oldest: [],
  });
  const c = data?.counts || {};
  return (
    <CardShell
      title="Support tickets"
      subtitle={c.total > 0 ? `${c.unresolved} unresolved · ${c.total} total` : 'Inbound from hospitals'}
      icon={LifeBuoy}
      accent="blue"
      linkTo="/support"
      linkLabel="Inbox"
      badge={c.unresolved > 0 && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          <AlertTriangle className="w-3 h-3" /> {c.unresolved}
        </span>
      )}
    >
      {loading ? <EmptyState>Loading…</EmptyState> : (
        <>
          {/* Status mini-grid */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Open',     val: c.open,     tone: 'text-blue-600 dark:text-blue-300' },
              { label: 'Pending',  val: c.pending,  tone: 'text-amber-600 dark:text-amber-300' },
              { label: 'Resolved', val: c.resolved, tone: 'text-emerald-600 dark:text-emerald-300' },
              { label: 'Closed',   val: c.closed,   tone: 'text-gray-500 dark:text-slate-400' },
            ].map((b) => (
              <div key={b.label} className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/40 p-1.5 text-center">
                <p className={clsx('text-base font-bold tabular-nums leading-none', b.tone)}>{b.val}</p>
                <p className="text-[9px] uppercase tracking-wide text-gray-500 dark:text-slate-400 mt-0.5">{b.label}</p>
              </div>
            ))}
          </div>

          <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-slate-500 mb-1.5">
            Oldest unresolved
          </div>
          {(!data?.oldest || data.oldest.length === 0) ? (
            <EmptyState>Inbox zero. 🎉</EmptyState>
          ) : (
            <ul className="space-y-1.5">
              {data.oldest.map((t) => (
                <li key={t.id}>
                  <Link to={`/support/${t.id}`} className="block rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono text-[10px] text-gray-400 dark:text-slate-500">{t.number}</span>
                      <span className={clsx('px-1 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide', STATUS_COLOR[t.status])}>
                        {t.status}
                      </span>
                      <span className={clsx('px-1 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide', PRIORITY_COLOR[t.priority])}>
                        {t.priority}
                      </span>
                      <span className="ml-auto text-[10px] text-gray-400 dark:text-slate-500 tabular-nums whitespace-nowrap">
                        {dayjs(t.createdAt).format('D MMM')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-gray-900 dark:text-slate-100 truncate">{t.subject}</p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                      {t.hospital?.name || '—'}
                      {t.createdByName && <span className="text-gray-400 dark:text-slate-500"> · {t.createdByName}</span>}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </CardShell>
  );
}

// ============================================================================
// 2) RECURRING REVENUE (MRR / ARR)
// ============================================================================
export function RecurringRevenueCard() {
  const { data, loading } = useFetch(endpoints.dashboard.recurringRevenue, {
    mrr: 0, arr: 0, activeSubscriptions: 0, monthlyCount: 0, yearlyCount: 0,
  });
  return (
    <CardShell
      title="Recurring revenue"
      subtitle="Live from active subscriptions"
      icon={Repeat}
      accent="emerald"
      linkTo="/billing"
      linkLabel="Billing"
    >
      {loading ? <EmptyState>Loading…</EmptyState> : (
        <div className="flex flex-col h-full">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-500/10 dark:to-emerald-500/5 p-2.5 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300">MRR</p>
              <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums truncate" title={formatCurrency(data.mrr)}>
                {formatCurrency(data.mrr)}
              </p>
              <p className="text-[10px] text-emerald-700/70 dark:text-emerald-300/70 mt-0.5">monthly</p>
            </div>
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-500/10 dark:to-indigo-500/5 p-2.5 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-700 dark:text-indigo-300">ARR</p>
              <p className="mt-1 text-lg font-bold text-indigo-700 dark:text-indigo-300 tabular-nums truncate" title={formatCurrency(data.arr)}>
                {formatCurrency(data.arr)}
              </p>
              <p className="text-[10px] text-indigo-700/70 dark:text-indigo-300/70 mt-0.5">annual</p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs py-0.5">
              <span className="text-gray-600 dark:text-slate-300">Active subscriptions</span>
              <span className="font-bold text-gray-900 dark:text-slate-100 tabular-nums">{data.activeSubscriptions}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-0.5">
              <span className="text-gray-600 dark:text-slate-300">Billing monthly</span>
              <span className="font-bold text-gray-900 dark:text-slate-100 tabular-nums">{data.monthlyCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-0.5">
              <span className="text-gray-600 dark:text-slate-300">Billing yearly</span>
              <span className="font-bold text-gray-900 dark:text-slate-100 tabular-nums">{data.yearlyCount}</span>
            </div>
          </div>
        </div>
      )}
    </CardShell>
  );
}

// ============================================================================
// 3) PLAN DISTRIBUTION (donut)
// ============================================================================
const DONUT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];

function Donut({ rows, total }) {
  // Build SVG arc segments. Falls back to a hollow ring when total = 0.
  const radius = 56;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-gray-100 dark:text-slate-800" />
        {total > 0 && rows.map((r, i) => {
          const dash = (r.hospitalCount / total) * circumference;
          const seg = (
            <circle
              key={r.planId}
              cx="80" cy="80" r={radius}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return seg;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-gray-900 dark:text-slate-100 tabular-nums">{total}</span>
        <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-slate-400">hospitals</span>
      </div>
    </div>
  );
}

export function PlanDistributionCard() {
  const { data, loading } = useFetch(endpoints.dashboard.planDistribution, { total: 0, rows: [] });
  const visibleRows = useMemo(() => (data?.rows || []).filter((r) => r.hospitalCount > 0 || r.price > 0), [data]);
  return (
    <CardShell
      title="Hospitals by plan"
      subtitle="Active subscription mix"
      icon={Layers}
      accent="violet"
      linkTo="/plans"
      linkLabel="Plans"
    >
      {loading ? <EmptyState>Loading…</EmptyState> : data.total === 0 ? (
        <EmptyState>No active subscriptions yet.</EmptyState>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 h-full">
          <div className="self-center">
            <Donut rows={visibleRows} total={data.total} />
          </div>
          <ul className="flex-1 min-w-0 space-y-1.5">
            {visibleRows.map((r, i) => {
              const ratio = data.total > 0 ? r.hospitalCount / data.total : 0;
              return (
                <li key={r.planId} className="text-xs min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="font-semibold text-gray-900 dark:text-slate-100 truncate">{r.name}</span>
                    <span className="ml-auto shrink-0 font-bold tabular-nums text-gray-900 dark:text-slate-100">
                      {r.hospitalCount}
                    </span>
                  </div>
                  <div className="mt-1 ml-4 flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0 h-1 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.round(ratio * 100)}%`, background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    </div>
                    <span className="shrink-0 text-[10px] text-gray-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                      {formatCurrency(r.monthlyRevenue)}/mo
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </CardShell>
  );
}

// ============================================================================
// 4) UPCOMING RENEWALS
// ============================================================================
export function UpcomingRenewalsCard() {
  const { data, loading } = useFetch(endpoints.dashboard.upcomingRenewals, { rows: [], count: 0, within7: 0 });
  return (
    <CardShell
      title="Upcoming renewals"
      subtitle="Subscriptions ending in 30 days"
      icon={CalendarClock}
      accent="amber"
      linkTo="/billing"
      linkLabel="Subscriptions"
      badge={data.within7 > 0 && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
          <AlertTriangle className="w-3 h-3" /> {data.within7} this week
        </span>
      )}
    >
      {loading ? <EmptyState>Loading…</EmptyState> : data.rows.length === 0 ? (
        <EmptyState>Nothing renewing soon.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {data.rows.map((r) => {
            const urgent = r.daysUntil <= 7;
            const warn   = r.daysUntil > 7 && r.daysUntil <= 14;
            return (
              <li key={r.id} className="flex items-center gap-2.5 text-xs">
                <span className={clsx(
                  'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm',
                  urgent ? 'bg-rose-500' : warn ? 'bg-amber-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600',
                )}>
                  <Building2 className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link to={`/hospitals/${r.hospitalId}`} className="font-semibold text-gray-900 dark:text-slate-100 truncate hover:text-blue-600 dark:hover:text-blue-300">
                      {r.hospital?.name || 'Hospital'}
                    </Link>
                    <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                      {r.plan}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                    {dayjs(r.endDate).format('D MMM YYYY')} · {formatCurrency(r.amount)}
                  </p>
                </div>
                <span className={clsx(
                  'shrink-0 text-right text-[11px] font-bold uppercase tracking-wide tabular-nums whitespace-nowrap',
                  urgent ? 'text-rose-600 dark:text-rose-300' : warn ? 'text-amber-600 dark:text-amber-300' : 'text-gray-500 dark:text-slate-400',
                )}>
                  {r.daysUntil === 0 ? 'Today' : `${r.daysUntil}d`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </CardShell>
  );
}
