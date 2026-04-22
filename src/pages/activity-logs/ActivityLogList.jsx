import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import DataTable from '../../components/DataTable';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';

export default function ActivityLogList() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.activityLogs.list, {
        params: { page, limit: 15, search, action: actionFilter || undefined, sortBy: sortField, sortOrder },
      });
      const d = res.data.data || res.data;
      setLogs(d.logs || d.rows || d.items || (Array.isArray(d) ? d : []));
      setTotalPages(d.totalPages || d.pagination?.totalPages || 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, sortField, sortOrder]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const actionColor = (a) => {
    if (!a) return 'gray';
    const l = a.toLowerCase();
    if (l.includes('create') || l.includes('add')) return 'success';
    if (l.includes('delete') || l.includes('remove')) return 'danger';
    if (l.includes('update') || l.includes('edit')) return 'info';
    if (l.includes('login') || l.includes('auth')) return 'warning';
    return 'gray';
  };

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      sortable: true,
      cell: (row) => (
        <span className="text-gray-600 whitespace-nowrap">
          {dayjs(row.createdAt).format('MMM D, YYYY h:mm A')}
        </span>
      ),
    },
    {
      header: 'User',
      accessor: 'userName',
      cell: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.userName || row.user?.name || 'System'}</p>
          <p className="text-xs text-gray-500">{row.userEmail || row.user?.email || ''}</p>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: 'action',
      cell: (row) => <Badge color={actionColor(row.action)}>{row.action}</Badge>,
    },
    {
      header: 'Resource',
      accessor: 'resource',
      cell: (row) => (
        <span className="text-gray-700">{row.resource || row.module || '-'}</span>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      cell: (row) => (
        <span className="text-gray-600 text-sm line-clamp-1">{row.description || row.message || '-'}</span>
      ),
    },
    {
      header: 'IP Address',
      accessor: 'ipAddress',
      cell: (row) => <span className="text-gray-500 text-xs font-mono">{row.ipAddress || row.ip || '-'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Track all platform activities and actions</p>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        searchable
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search logs..."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={(f, o) => { setSortField(f); setSortOrder(o); }}
        emptyTitle="No activity logs"
        emptyMessage="Activity logs will appear here as users interact with the platform."
        headerActions={(
          <Select
            options={[
              { value: '', label: 'All Actions' },
              { value: 'create', label: 'Create' },
              { value: 'update', label: 'Update' },
              { value: 'delete', label: 'Delete' },
              { value: 'login', label: 'Login' },
              { value: 'logout', label: 'Logout' },
            ]}
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="w-40"
          />
        )}
      />
    </div>
  );
}
