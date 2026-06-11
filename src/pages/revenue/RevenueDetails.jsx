import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, RefreshCw, Building2 } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatters';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '-');
const paymentColor = (s) => ({ paid: 'success', partial: 'warning', advance: 'info', refunded: 'danger', pending: 'gray' }[s] || 'gray');

export default function RevenueDetails() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.dashboard.revenueBreakdown);
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
  const total = Number(data?.total || 0);
  const collected = Number(data?.collected || 0);
  const outstanding = Number(data?.outstanding || 0);
  const byPlan = data?.byPlan || [];

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
            <DollarSign className="w-5 h-5 text-amber-500 shrink-0" />
            Monthly Revenue
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Recurring value across {rows.length} active subscription{rows.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          onClick={load}
          className="ml-auto inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Money summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Total (billed)</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">{formatCurrency(total)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Collected</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(collected)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Outstanding</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(outstanding)}</p>
        </Card>
      </div>

      {/* By plan */}
      {byPlan.length > 0 && (
        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">By plan</h2>
          <div className="flex flex-wrap gap-3">
            {byPlan.map((p) => (
              <div key={p.planName} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5">
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{p.planName}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {p.count} hospital{p.count === 1 ? '' : 's'} · {formatCurrency(p.amount)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Per-hospital breakdown */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" /> Revenue by hospital
        </h2>
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
                  <th className="py-2 pr-4 font-medium">Paid</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/70">
                {rows.map((r) => {
                  const paidPct = r.amount > 0 ? Math.min(100, (r.amountPaid / r.amount) * 100) : 0;
                  return (
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
                      <td className="py-2.5 pr-4">{cap(r.billingCycle)}</td>
                      <td className="py-2.5 pr-4 font-medium tabular-nums text-gray-900 dark:text-slate-100">{formatCurrency(r.amount)}</td>
                      <td className="py-2.5 pr-4">
                        <div className="min-w-[150px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium tabular-nums text-gray-900 dark:text-slate-100">{formatCurrency(r.amountPaid)}</span>
                            <span className="tabular-nums text-gray-400">{paidPct.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paidPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <Badge color={paymentColor(r.paymentStatus)}>
                          {r.paymentStatus === 'pending' ? 'Unpaid' : cap(r.paymentStatus)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
