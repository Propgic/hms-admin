import { useState, useEffect, useCallback } from 'react';
import { Eye } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import DataTable from '../../components/DataTable';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { formatCurrency } from '../../utils/formatters';

export default function BillingList() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.billing.list, {
        params: { page, limit: pageSize, search, status: statusFilter || undefined, sortBy: sortField, sortOrder },
      });
      // Backend response: { success, message, data: [...rows], pagination: {...} }
      // Pagination lives on res.data.pagination, NOT on the items array.
      const payload = res.data || {};
      const d = payload.data;
      const list = Array.isArray(d) ? d : (d?.subscriptions || d?.rows || d?.items || []);
      const pag = payload.pagination || d?.pagination || {};
      setSubscriptions(list);
      setTotalPages(pag.totalPages || 1);
      setTotalItems(pag.total ?? list.length);
    } catch {
      setSubscriptions([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, sortField, sortOrder]);

  useEffect(() => { fetchBilling(); }, [fetchBilling]);

  const statusColor = (s) => {
    const map = { active: 'success', expired: 'danger', trial: 'warning', cancelled: 'gray' };
    return map[s] || 'gray';
  };

  const columns = [
    {
      header: 'Hospital',
      accessor: 'hospitalName',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.hospitalName || row.hospital?.name || '-'}</p>
          <p className="text-xs text-gray-500">{row.hospitalEmail || row.hospital?.email || ''}</p>
        </div>
      ),
    },
    {
      header: 'Plan',
      accessor: 'planName',
      cell: (row) => row.planName || row.plan?.name || '-',
    },
    {
      header: 'Billing Cycle',
      accessor: 'planBillingCycle',
      cell: (row) => {
        const c = row.planBillingCycle || row.plan?.billingCycle;
        return c ? c.charAt(0).toUpperCase() + c.slice(1) : '-';
      },
    },
    {
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      cell: (row) => formatCurrency(row.amount || 0),
    },
    {
      header: 'Start Date',
      accessor: 'startDate',
      sortable: true,
      cell: (row) => row.startDate ? dayjs(row.startDate).format('MMM D, YYYY') : '-',
    },
    {
      header: 'End Date',
      accessor: 'endDate',
      cell: (row) => row.endDate ? dayjs(row.endDate).format('MMM D, YYYY') : '-',
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      // Backend sends `effectiveStatus` (a stored-'active' row whose endDate
      // has passed reads as 'expired'); fall back to raw status defensively.
      cell: (row) => {
        const s = row.effectiveStatus ?? row.status;
        return <Badge color={statusColor(s)}>{s}</Badge>;
      },
    },
    {
      header: 'Payment',
      accessor: 'paymentStatus',
      cell: (row) => (
        <Badge color={row.paymentStatus === 'paid' ? 'success' : row.paymentStatus === 'pending' ? 'warning' : 'danger'}>
          {row.paymentStatus || 'N/A'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-base text-gray-600 dark:text-slate-400">Track all hospital subscriptions and payments</p>

      <DataTable
        columns={columns}
        data={subscriptions}
        loading={loading}
        searchable
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search billing records..."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        totalItems={totalItems}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={(f, o) => { setSortField(f); setSortOrder(o); }}
        emptyIllustration="invoices"
        emptyTitle="No billing records"
        emptyMessage="Billing records will appear here when hospitals subscribe to plans."
        headerActions={(
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'trial', label: 'Trial' },
              { value: 'expired', label: 'Expired' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            className="w-40"
          />
        )}
      />
    </div>
  );
}
