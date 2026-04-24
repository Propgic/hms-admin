import { useState, useEffect, useCallback } from 'react';
import { Plus, Printer, CheckCircle2, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import DataTable from '../../components/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import InvoiceForm from './InvoiceForm';
import { formatCurrency } from '../../utils/formatters';

const STATUS_COLOR = {
  paid: 'success',
  issued: 'info',
  overdue: 'danger',
  cancelled: 'gray',
  void: 'gray',
};

// Resolves the backend base URL used by the axios instance so we can open the
// printable invoice in a new tab with the same cookie-based session.
function openPrintable(id) {
  const base = api.defaults.baseURL || '';
  window.open(`${base}${endpoints.invoices.print(id)}`, '_blank', 'noopener');
}

export default function InvoiceList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const navigate = useNavigate();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.invoices.list, { params: { page, limit: pageSize, search } });
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
  }, [page, pageSize, search]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const markPaid = async (inv) => {
    try {
      await api.post(endpoints.invoices.markPaid(inv.id));
      toast.success(`Invoice ${inv.number} marked paid`);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const voidInvoice = async (inv) => {
    if (!window.confirm(`Void invoice ${inv.number}? This cannot be undone.`)) return;
    try {
      await api.post(endpoints.invoices.voidInvoice(inv.id));
      toast.success('Invoice voided');
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const columns = [
    {
      header: 'Number',
      accessor: 'number',
      cell: (row) => <span className="font-mono font-semibold text-gray-900 dark:text-slate-100">{row.number}</span>,
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
      cell: (row) => dayjs(row.issueDate).format('MMM D, YYYY'),
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
      width: '200px',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/invoices/${row.id}`)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openPrintable(row.id)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"
            title="Print / download PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
          {row.status !== 'paid' && row.status !== 'void' && (
            <>
              <button
                onClick={() => markPaid(row)}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg"
                title="Mark paid"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => voidInvoice(row)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                title="Void"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
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
      />

      <InvoiceForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchList}
      />
    </div>
  );
}
