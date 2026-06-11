import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Building2, Mail, CalendarDays, RefreshCw, Receipt } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatters';
import PaymentModal from './PaymentModal';

const statusColor = (s) => ({ active: 'success', expired: 'danger', trial: 'warning', cancelled: 'gray' }[s] || 'gray');
const paymentColor = (s) => ({ paid: 'success', partial: 'warning', advance: 'info', refunded: 'danger', pending: 'gray' }[s] || 'gray');
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '-');
const methodLabel = (m) => ({ cash: 'Cash', card: 'Card', upi: 'UPI', bank_transfer: 'Bank Transfer', cheque: 'Cheque', other: 'Other' }[m] || (m ? cap(m) : '—'));

// Effective status mirrors the list: a stored-'active' row past its endDate reads as expired.
function effectiveStatus(sub) {
  if (sub?.status === 'active' && sub?.endDate && new Date(sub.endDate) < new Date()) return 'expired';
  return sub?.status;
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-slate-100 mt-0.5">{children}</p>
    </div>
  );
}

export default function BillingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.billing.get(id));
      setSub(res.data?.data || res.data);
    } catch {
      setSub(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner fullPage size="lg" />;
  if (!sub) {
    return (
      <div className="text-center mt-20">
        <p className="text-gray-500 dark:text-slate-400">Subscription not found</p>
        <button onClick={() => navigate('/billing')} className="mt-3 text-blue-600 hover:underline">Back to Billing</button>
      </div>
    );
  }

  const total = Number(sub.amount || 0);
  const paid = Number(sub.amountPaid || 0);
  const remaining = Math.max(0, Math.round((total - paid) * 100) / 100);
  const payments = sub.payments || [];
  const effStatus = effectiveStatus(sub);

  // Row shape PaymentModal expects (it reads hospitalName/planName/amount/amountPaid/paymentRef).
  const modalRow = {
    id: sub.id,
    amount: sub.amount,
    amountPaid: sub.amountPaid,
    paymentRef: sub.paymentRef,
    hospitalName: sub.hospital?.name,
    planName: sub.plan?.name,
    planBillingCycle: sub.plan?.billingCycle,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/billing')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 truncate flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-400 shrink-0" />
            {sub.hospital?.name || '-'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Mail className="w-3.5 h-3.5" /> {sub.hospital?.email || '—'}
          </p>
        </div>
        <div className="ml-auto">
          <Button icon={Wallet} onClick={() => setPayOpen(true)} disabled={effStatus === 'cancelled'}>
            Record Payment
          </Button>
        </div>
      </div>

      {/* Money summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1">{formatCurrency(total)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Paid</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(paid)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Remaining</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(remaining)}</p>
        </Card>
      </div>

      {/* Subscription details */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">Subscription</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5">
          <Field label="Plan">{sub.plan?.name || '-'}</Field>
          <Field label="Billing Cycle">{cap(sub.plan?.billingCycle)}</Field>
          <Field label="Status"><Badge color={statusColor(effStatus)}>{effStatus}</Badge></Field>
          <Field label="Payment"><Badge color={paymentColor(sub.paymentStatus || 'pending')}>{sub.paymentStatus === 'pending' || !sub.paymentStatus ? 'Unpaid' : cap(sub.paymentStatus)}</Badge></Field>
          <Field label="Start Date">{sub.startDate ? dayjs(sub.startDate).format('MMM D, YYYY') : '-'}</Field>
          <Field label="End Date">{sub.endDate ? dayjs(sub.endDate).format('MMM D, YYYY') : '-'}</Field>
          <Field label="Method">{methodLabel(sub.paymentMethod)}</Field>
          <Field label="Last Reference">{sub.paymentRef || '—'}</Field>
        </div>
      </Card>

      {/* Transaction history */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-400" /> Transaction History
          </h2>
          <button onClick={load} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-gray-400 dark:text-slate-500">
            <CalendarDays className="w-6 h-6" />
            <p className="text-sm">No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Method</th>
                  <th className="py-2 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/70">
                {payments.map((p) => (
                  <tr key={p.id} className="text-gray-700 dark:text-slate-300">
                    <td className="py-2.5 pr-4 whitespace-nowrap">{dayjs(p.paidAt).format('MMM D, YYYY · h:mm A')}</td>
                    <td className="py-2.5 pr-4"><Badge color={p.type === 'advance' ? 'info' : p.type === 'full' ? 'success' : 'warning'}>{cap(p.type)}</Badge></td>
                    <td className="py-2.5 pr-4 font-medium tabular-nums text-gray-900 dark:text-slate-100">{formatCurrency(Number(p.amount || 0))}</td>
                    <td className="py-2.5 pr-4">{methodLabel(p.method)}</td>
                    <td className="py-2.5 text-gray-500 dark:text-slate-400">{p.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <PaymentModal
        isOpen={payOpen}
        subscription={modalRow}
        onClose={() => setPayOpen(false)}
        onSuccess={load}
      />
    </div>
  );
}
