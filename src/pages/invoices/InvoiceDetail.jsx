import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle2, XCircle, Pencil, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import InvoiceForm from './InvoiceForm';
import { formatCurrency } from '../../utils/formatters';

const STATUS_COLOR = {
  draft: 'warning',
  paid: 'success',
  issued: 'info',
  overdue: 'danger',
  cancelled: 'gray',
  void: 'gray',
};

async function openPrintable(id) {
  try {
    const res = await api.get(endpoints.invoices.print(id), {
      responseType: 'blob',
      headers: { Accept: 'text/html' },
    });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/html' }));
    const w = window.open(url, '_blank', 'noopener');
    if (!w) {
      toast.error('Popup blocked — allow popups to print invoices');
      URL.revokeObjectURL(url);
      return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to open invoice');
  }
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [paidOpen, setPaidOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.invoices.get(id));
      setInvoice(res.data.data || res.data);
    } catch {
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const markPaid = async () => {
    setBusy(true);
    try {
      await api.post(endpoints.invoices.markPaid(id));
      toast.success('Marked paid');
      setPaidOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const voidInvoice = async () => {
    setBusy(true);
    try {
      await api.post(endpoints.invoices.voidInvoice(id));
      toast.success(invoice?.status === 'draft' ? 'Draft discarded' : 'Voided');
      setVoidOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const issueInvoice = async () => {
    setBusy(true);
    try {
      const res = await api.post(endpoints.invoices.issue(id));
      const issued = res.data?.data || res.data;
      toast.success(`Issued as ${issued?.number || 'invoice'}`);
      setIssueOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue invoice');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner fullPage />;
  if (!invoice) return <div className="text-center py-16 text-gray-500">Invoice not found.</div>;

  const currency = invoice.currency || 'INR';
  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : [];
  const isIGST = Number(invoice.igst) > 0;
  const isDraft = invoice.status === 'draft';
  const isFinal = invoice.status === 'paid' || invoice.status === 'void';
  const canMarkPaid = invoice.status === 'issued' || invoice.status === 'overdue';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          {!isDraft && (
            <Button variant="secondary" icon={Printer} onClick={() => openPrintable(id)}>Print / PDF</Button>
          )}
          {isDraft && (
            <>
              <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>Edit</Button>
              <Button variant="primary" icon={Send} onClick={() => setIssueOpen(true)} loading={busy}>Issue Invoice</Button>
            </>
          )}
          {canMarkPaid && (
            <Button variant="success" icon={CheckCircle2} onClick={() => setPaidOpen(true)} loading={busy}>Mark Paid</Button>
          )}
          {!isFinal && (
            <Button variant="danger" icon={XCircle} onClick={() => setVoidOpen(true)} loading={busy}>
              {isDraft ? 'Discard' : 'Void'}
            </Button>
          )}
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1">Invoice</div>
            <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-slate-100">
              {invoice.number || <span className="italic text-gray-400 dark:text-slate-500">— number assigned on issue —</span>}
            </h1>
            <div className="mt-2"><Badge color={STATUS_COLOR[invoice.status] || 'gray'}>{String(invoice.status).toUpperCase()}</Badge></div>
          </div>
          <div className="text-right text-sm">
            <div className="text-gray-500 dark:text-slate-400">{isDraft ? 'Created' : 'Issued'}</div>
            <div className="font-medium dark:text-slate-100">{dayjs(invoice.issuedAt || invoice.issueDate || invoice.createdAt).format('MMM D, YYYY')}</div>
            {invoice.dueDate && (
              <>
                <div className="text-gray-500 dark:text-slate-400 mt-2">Due</div>
                <div className="font-medium dark:text-slate-100">{dayjs(invoice.dueDate).format('MMM D, YYYY')}</div>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-3">Bill From</div>
          <div className="font-semibold text-gray-900 dark:text-slate-100">{invoice.billFrom?.name || '—'}</div>
          <div className="text-sm text-gray-600 dark:text-slate-300 mt-1">{invoice.billFrom?.address}</div>
          <div className="text-sm text-gray-600 dark:text-slate-300">
            {[invoice.billFrom?.state, invoice.billFrom?.pincode, invoice.billFrom?.country].filter(Boolean).join(', ')}
          </div>
          {invoice.billFrom?.gstin && <div className="text-sm mt-1 dark:text-slate-300">GSTIN: <span className="font-mono">{invoice.billFrom.gstin}</span></div>}
          {invoice.billFrom?.email && <div className="text-sm text-gray-500 dark:text-slate-400">{invoice.billFrom.email}</div>}
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-3">Bill To</div>
          <div className="font-semibold text-gray-900 dark:text-slate-100">{invoice.billTo?.name || invoice.hospital?.name}</div>
          <div className="text-sm text-gray-600 dark:text-slate-300 mt-1">{invoice.billTo?.address}</div>
          <div className="text-sm text-gray-600 dark:text-slate-300">
            {[invoice.billTo?.city, invoice.billTo?.state, invoice.billTo?.pincode].filter(Boolean).join(', ')}
          </div>
          {invoice.billTo?.gstin && <div className="text-sm mt-1 dark:text-slate-300">GSTIN: <span className="font-mono">{invoice.billTo.gstin}</span></div>}
          {invoice.billTo?.email && <div className="text-sm text-gray-500 dark:text-slate-400">{invoice.billTo.email}</div>}
        </Card>
      </div>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
              <tr>
                <th className="text-left px-3 py-2">Description</th>
                <th className="text-center px-3 py-2 w-24">HSN/SAC</th>
                <th className="text-right px-3 py-2 w-20">Qty</th>
                <th className="text-right px-3 py-2 w-32">Rate</th>
                <th className="text-right px-3 py-2 w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {lineItems.map((li, i) => (
                <tr key={i}>
                  <td className="px-3 py-3 text-gray-900 dark:text-slate-100">{li.description}</td>
                  <td className="px-3 py-3 text-center text-gray-600 dark:text-slate-400 font-mono text-xs">{li.hsnCode || invoice.hsnCode || '—'}</td>
                  <td className="px-3 py-3 text-right text-gray-700 dark:text-slate-200">{Number(li.quantity).toFixed(2)}</td>
                  <td className="px-3 py-3 text-right text-gray-700 dark:text-slate-200">{formatCurrency(li.rate, currency)}</td>
                  <td className="px-3 py-3 text-right font-medium text-gray-900 dark:text-slate-100">{formatCurrency(li.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4">
          <div className="w-80 text-sm">
            <div className="flex justify-between py-1"><span className="text-gray-500 dark:text-slate-400">Subtotal</span><span className="dark:text-slate-100">{formatCurrency(invoice.subtotal, currency)}</span></div>
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-gray-500 dark:text-slate-400">Discount{invoice.couponCode ? ` (${invoice.couponCode})` : ''}</span>
                <span className="text-rose-600">− {formatCurrency(invoice.discountAmount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between py-1"><span className="text-gray-500 dark:text-slate-400">Taxable Value</span><span className="dark:text-slate-100">{formatCurrency(invoice.taxableAmount, currency)}</span></div>
            {isIGST ? (
              <div className="flex justify-between py-1"><span className="text-gray-500 dark:text-slate-400">IGST ({Number(invoice.gstRate).toFixed(2)}%)</span><span className="dark:text-slate-100">{formatCurrency(invoice.igst, currency)}</span></div>
            ) : (
              <>
                <div className="flex justify-between py-1"><span className="text-gray-500 dark:text-slate-400">CGST ({(Number(invoice.gstRate) / 2).toFixed(2)}%)</span><span className="dark:text-slate-100">{formatCurrency(invoice.cgst, currency)}</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-500 dark:text-slate-400">SGST ({(Number(invoice.gstRate) / 2).toFixed(2)}%)</span><span className="dark:text-slate-100">{formatCurrency(invoice.sgst, currency)}</span></div>
              </>
            )}
            <div className="flex justify-between py-2 border-t-2 border-gray-900 dark:border-slate-200 mt-2 font-bold text-base dark:text-slate-100">
              <span>Total</span><span>{formatCurrency(invoice.total, currency)}</span>
            </div>
            {invoice.placeOfSupply && (
              <div className="text-xs text-gray-500 dark:text-slate-400 mt-2">Place of Supply: {invoice.placeOfSupply}</div>
            )}
          </div>
        </div>
      </Card>

      {(invoice.notes || invoice.paymentRef) && (
        <Card className="p-5">
          {invoice.notes && (
            <>
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-2">Notes</div>
              <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{invoice.notes}</p>
            </>
          )}
          {invoice.paymentRef && (
            <div className="mt-3 text-sm">
              <span className="text-gray-500 dark:text-slate-400">Payment reference:</span>{' '}
              <span className="font-mono dark:text-slate-200">{invoice.paymentRef}</span>
              {invoice.paidAt && <span className="text-gray-500 dark:text-slate-400"> — {dayjs(invoice.paidAt).format('MMM D, YYYY')}</span>}
            </div>
          )}
        </Card>
      )}

      <ConfirmDialog
        isOpen={paidOpen}
        onClose={() => !busy && setPaidOpen(false)}
        onConfirm={markPaid}
        title="Mark invoice as paid"
        message={`Mark invoice ${invoice.number} as paid? This will record payment of ${formatCurrency(invoice.total, currency)} and close the invoice.`}
        confirmText="Mark paid"
        variant="success"
        loading={busy}
      />

      <ConfirmDialog
        isOpen={issueOpen}
        onClose={() => !busy && setIssueOpen(false)}
        onConfirm={issueInvoice}
        title="Issue invoice"
        message={`Finalize this draft and issue a tax invoice for ${invoice.hospital?.name || 'the hospital'}? An invoice number will be assigned and the document will be locked from further edits.`}
        confirmText="Issue invoice"
        variant="primary"
        loading={busy}
      />

      <ConfirmDialog
        isOpen={voidOpen}
        onClose={() => !busy && setVoidOpen(false)}
        onConfirm={voidInvoice}
        title={isDraft ? 'Discard draft' : 'Void invoice'}
        message={
          isDraft
            ? `Discard this draft for ${invoice.hospital?.name || 'the hospital'}? It has not been issued, so no number was assigned.`
            : `Void invoice ${invoice.number}? This cannot be undone, but the record will remain for audit purposes.`
        }
        confirmText={isDraft ? 'Discard draft' : 'Void invoice'}
        variant="danger"
        loading={busy}
      />

      <InvoiceForm
        isOpen={editOpen}
        invoice={invoice}
        onClose={() => setEditOpen(false)}
        onSuccess={load}
      />
    </div>
  );
}
