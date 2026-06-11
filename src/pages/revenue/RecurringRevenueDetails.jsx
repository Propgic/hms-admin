import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Repeat, RefreshCw, Building2 } from 'lucide-react';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatters';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '-');

export default function RecurringRevenueDetails() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.dashboard.recurringRevenue);
      setData(res.data?.data || res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner fullPage size="lg" />;

  const rows = data?.rows || [];
  const mrr = Number(data?.mrr || 0);
  const arr = Number(data?.arr || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-emerald-500 shrink-0" />
            Recurring Revenue
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Live from {data?.activeSubscriptions ?? rows.length} active subscription{(data?.activeSubscriptions ?? rows.length) === 1 ? '' : 's'}
            {' · '}{data?.monthlyCount ?? 0} monthly, {data?.yearlyCount ?? 0} yearly
          </p>
        </div>
        <button
          onClick={load}
          className="ml-auto inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* MRR / ARR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 border-emerald-200 dark:border-emerald-500/30">
          <p className="text-xs uppercase tracking-wide font-bold text-emerald-700 dark:text-emerald-300">MRR</p>
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 tabular-nums">{formatCurrency(mrr)}</p>
          <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70 mt-1">monthly recurring revenue</p>
        </Card>
        <Card className="p-5 border-indigo-200 dark:border-indigo-500/30">
          <p className="text-xs uppercase tracking-wide font-bold text-indigo-700 dark:text-indigo-300">ARR</p>
          <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 mt-1 tabular-nums">{formatCurrency(arr)}</p>
          <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 mt-1">annual recurring revenue (MRR × 12)</p>
        </Card>
      </div>

      {/* Per-subscription breakdown */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" /> MRR by hospital
        </h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          Yearly plans contribute their billed amount ÷ 12 to MRR.
        </p>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">No active subscriptions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">
                  <th className="py-2 pr-4 font-medium">Hospital</th>
                  <th className="py-2 pr-4 font-medium">Plan</th>
                  <th className="py-2 pr-4 font-medium">Cycle</th>
                  <th className="py-2 pr-4 font-medium">Billed</th>
                  <th className="py-2 pr-4 font-medium">MRR</th>
                  <th className="py-2 font-medium">ARR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/70">
                {rows.map((r) => (
                  <tr
                    key={r.subscriptionId}
                    onClick={() => navigate(`/billing/${r.subscriptionId}`)}
                    className="text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-gray-900 dark:text-slate-100">{r.hospitalName}</p>
                      <p className="text-xs text-gray-400">{r.hospitalEmail}</p>
                    </td>
                    <td className="py-2.5 pr-4">{r.planName}</td>
                    <td className="py-2.5 pr-4">
                      <Badge color={r.billingCycle === 'yearly' || r.billingCycle === 'annual' ? 'info' : 'gray'}>
                        {cap(r.billingCycle)}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-gray-500 dark:text-slate-400">{formatCurrency(r.amount)}</td>
                    <td className="py-2.5 pr-4 font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{formatCurrency(r.monthlyEquiv)}</td>
                    <td className="py-2.5 tabular-nums text-indigo-700 dark:text-indigo-400">{formatCurrency(r.annualEquiv)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 dark:border-slate-700 font-semibold text-gray-900 dark:text-slate-100">
                  <td className="py-2.5 pr-4" colSpan={4}>Total</td>
                  <td className="py-2.5 pr-4 tabular-nums text-emerald-700 dark:text-emerald-400">{formatCurrency(mrr)}</td>
                  <td className="py-2.5 tabular-nums text-indigo-700 dark:text-indigo-400">{formatCurrency(arr)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
