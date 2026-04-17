import { useState, useEffect, useCallback } from 'react';
import { Eye } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import DataTable from '../../components/DataTable';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';

export default function BillingList() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.billing.list, {
        params: { page, limit: 10, search, status: statusFilter || undefined, sortBy: sortField, sortOrder },
      });
      const d = res.data.data || res.data;
      setSubscriptions(d.subscriptions || d.rows || d.items || (Array.isArray(d) ? d : []));
      setTotalPages(d.totalPages || d.pagination?.totalPages || 1);
    } catch {
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortField, sortOrder]);

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
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      cell: (row) => `$${row.amount || 0}`,
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
      cell: (row) => <Badge color={statusColor(row.status)}>{row.status}</Badge>,
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
      <p className="text-sm text-gray-500">Track all hospital subscriptions and payments</p>

      <div className="flex items-center gap-3">
        <Select
          options={[
            { value: '', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'trial', label: 'Trial' },
            { value: 'expired', label: 'Expired' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="w-40"
        />
      </div>

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
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={(f, o) => { setSortField(f); setSortOrder(o); }}
        emptyTitle="No billing records"
        emptyMessage="Billing records will appear here when hospitals subscribe to plans."
      />
    </div>
  );
}
