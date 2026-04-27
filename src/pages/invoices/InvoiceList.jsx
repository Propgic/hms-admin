import { useState, useEffect, useCallback } from 'react';
import { Plus, Printer, CheckCircle2, XCircle, Eye, Pencil, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import DataTable from '../../components/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
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

export default function InvoiceList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null);
  const [voiding, setVoiding] = useState(false);
  const [paidTarget, setPaidTarget] = useState(null);
  const [paying, setPaying] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [issueTarget, setIssueTarget] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const navigate = useNavigate();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, search };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get(endpoints.invoices.list, { params });
      const d = res.data.data || res.data;
      const list = Array.isArray(d) ? d : (d.items || d.rows || []);
      const pg = res.data.pagination || {};
      setItems(list);
      setTotalPages(pg.totalPages || Math.max(1, Math.ceil((pg.total ?? list.length) / pageSize)));
      setTotalItems(pg.total ?? list.length);
    } catch {
      setItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const markPaid = async () => {
    if (!paidTarget) return;
    setPaying(true);
    try {
      await api.post(endpoints.invoices.markPaid(paidTarget.id));
      toast.success(`Invoice ${paidTarget.number} marked paid`);
      setPaidTarget(null);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setPaying(false);
    }
  };

  const voidInvoice = async () => {
    if (!voidTarget) return;
    setVoiding(true);
    try {
      await api.post(endpoints.invoices.voidInvoice(voidTarget.id));
      toast.success(voidTarget.status === 'draft' ? 'Draft voided' : 'Invoice voided');
      setVoidTarget(null);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setVoiding(false);
    }
  };

  const issueInvoice = async () => {
    if (!issueTarget) return;
    setIssuing(true);
    try {
      const res = await api.post(endpoints.invoices.issue(issueTarget.id));
      const issued = res.data?.data || res.data;
      toast.success(`Issued as ${issued?.number || 'invoice'}`);
      setIssueTarget(null);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue invoice');
    } finally {
      setIssuing(false);
    }
  };

  const columns = [
    {
      header: 'Number',
      accessor: 'number',
      cell: (row) => row.number
        ? <span className="font-mono font-semibold text-gray-900 dark:text-slate-100">{row.number}</span>
        : <span className="font-mono text-xs italic text-gray-400 dark:text-slate-500">— draft —</span>,
    },
    {
      header: 'Hospital',
      accessor: 'hospital',
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-slate-100">{row.hospital?.name}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">{row.hospital?.email}</div>
        </div>
      ),
    },
    {
      header: 'Issued',
      accessor: 'issueDate',
      cell: (row) => row.status === 'draft'
        ? <span className="text-gray-400 dark:text-slate-500">—</span>
        : dayjs(row.issuedAt || row.issueDate).format('MMM D, YYYY'),
    },
    {
      header: 'Due',
      accessor: 'dueDate',
      cell: (row) => row.dueDate ? dayjs(row.dueDate).format('MMM D, YYYY') : '—',
    },
    {
      header: 'Total',
      accessor: 'total',
      align: 'right',
      cell: (row) => (
        <span className="font-semibold text-gray-900 dark:text-slate-100">
          {formatCurrency(Number(row.total), row.currency || 'INR')}
        </span>
      ),
    },
    {
      header: 'GST',
      accessor: 'gstRate',
      align: 'right',
      cell: (row) => `${Number(row.gstRate).toFixed(0)}%`,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <Badge color={STATUS_COLOR[row.status] || 'gray'}>{String(row.status).toUpperCase()}</Badge>,
    },
    {
      header: 'Actions',
      id: 'actions',
      width: '220px',
      cell: (row) => {
        const isDraft = row.status === 'draft';
        const isFinal = row.status === 'paid' || row.status === 'void';
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/invoices/${row.id}`)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </button>
            {!isDraft && (
              <button
                onClick={() => openPrintable(row.id)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"
                title="Print / download PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}
            {isDraft && (
              <>
                <button
                  onClick={() => setEditTarget(row)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                  title="Edit draft"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIssueTarget(row)}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg"
                  title="Issue invoice"
                >
                  <Send className="w-4 h-4" />
                </button>
              </>
            )}
            {(row.status === 'issued' || row.status === 'overdue') && (
              <button
                onClick={() => setPaidTarget(row)}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg"
                title="Mark paid"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
            {!isFinal && (
              <button
                onClick={() => setVoidTarget(row)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                title={isDraft ? 'Discard draft' : 'Void invoice'}
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-base text-gray-600 dark:text-slate-400">GST-compliant tax invoices for hospital subscriptions</p>
        <Button icon={Plus} onClick={() => setFormOpen(true)}>New Invoice</Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        searchable
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by invoice number or hospital..."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        totalItems={totalItems}
        emptyTitle="No invoices yet"
        emptyMessage="Generate your first tax invoice for a hospital subscription."
        headerActions={
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'issued', label: 'Issued' },
              { value: 'paid', label: 'Paid' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'void', label: 'Void' },
            ]}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            className="w-40"
          />
        }
      />

      <InvoiceForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchList}
      />

      <InvoiceForm
        isOpen={!!editTarget}
        invoice={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={fetchList}
      />

      <ConfirmDialog
        isOpen={!!issueTarget}
        onClose={() => !issuing && setIssueTarget(null)}
        onConfirm={issueInvoice}
        title="Issue invoice"
        message={issueTarget ? `Finalize this draft and issue a tax invoice for ${issueTarget.hospital?.name || 'the hospital'}? An invoice number will be assigned and the document will be locked from further edits.` : ''}
        confirmText="Issue invoice"
        variant="primary"
        loading={issuing}
      />

      <ConfirmDialog
        isOpen={!!paidTarget}
        onClose={() => !paying && setPaidTarget(null)}
        onConfirm={markPaid}
        title="Mark invoice as paid"
        message={paidTarget ? `Mark invoice ${paidTarget.number} as paid? This will record payment of ${formatCurrency(Number(paidTarget.total), paidTarget.currency || 'INR')} and close the invoice.` : ''}
        confirmText="Mark paid"
        variant="success"
        loading={paying}
      />

      <ConfirmDialog
        isOpen={!!voidTarget}
        onClose={() => !voiding && setVoidTarget(null)}
        onConfirm={voidInvoice}
        title={voidTarget?.status === 'draft' ? 'Discard draft' : 'Void invoice'}
        message={
          voidTarget
            ? voidTarget.status === 'draft'
              ? `Discard this draft for ${voidTarget.hospital?.name || 'the hospital'}? It has not been issued, so no number was assigned.`
              : `Void invoice ${voidTarget.number}? This cannot be undone, but the record will remain for audit purposes.`
            : ''
        }
        confirmText={voidTarget?.status === 'draft' ? 'Discard draft' : 'Void invoice'}
        variant="danger"
        loading={voiding}
      />
    </div>
  );
}
