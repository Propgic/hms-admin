import { useState, useEffect, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import DataTable from '../../components/DataTable';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import StatCard from '../../components/StatCard';
import { Inbox, Clock, CheckCircle2, XCircle } from 'lucide-react';
import RoleChip from './RoleChip';

const STATUS_COLOR = {
  open: 'info',
  pending: 'warning',
  resolved: 'success',
  closed: 'gray',
};

const PRIORITY_COLOR = {
  low: 'gray',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

export default function TicketList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ open: 0, pending: 0, resolved: 0, closed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, search };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await api.get(endpoints.support.list, { params });
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
  }, [page, pageSize, search, statusFilter, priorityFilter]);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    api.get(endpoints.support.stats)
      .then((res) => setStats(res.data.data || res.data))
      .catch(() => {});
  }, [items.length]);

  const columns = [
    {
      header: 'Number',
      accessor: 'number',
      cell: (row) => <span className="font-mono font-semibold text-gray-900 dark:text-slate-100">{row.number}</span>,
    },
    {
      header: 'Subject',
      accessor: 'subject',
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-slate-100 line-clamp-1">{row.subject}</div>
          <div className="text-xs flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="text-gray-500 dark:text-slate-400">{row.hospital?.name || '—'}</span>
            {row.createdByName && (
              <>
                <span className="text-gray-300 dark:text-slate-600">·</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">{row.createdByName}</span>
              </>
            )}
            {row.createdByRole && <RoleChip role={row.createdByRole} />}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <Badge color={STATUS_COLOR[row.status] || 'gray'}>{String(row.status).toUpperCase()}</Badge>,
    },
    {
      header: 'Priority',
      accessor: 'priority',
      cell: (row) => <Badge color={PRIORITY_COLOR[row.priority] || 'gray'}>{row.priority}</Badge>,
    },
    {
      header: 'Last Activity',
      accessor: 'lastMsgAt',
      cell: (row) => dayjs(row.lastMsgAt || row.createdAt).fromNow ? dayjs(row.lastMsgAt || row.createdAt).format('MMM D, h:mm A') : '—',
    },
    {
      header: 'Actions',
      id: 'actions',
      width: '80px',
      cell: (row) => (
        <button
          onClick={() => navigate(`/support/${row.id}`)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
          title="Open ticket"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-base text-gray-600 dark:text-slate-400">
        Inbound support tickets from hospitals. Reply or change status.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Open" value={stats.open} icon={Inbox} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <StatCard label="Awaiting hospital" value={stats.pending} icon={Clock} iconBg="bg-amber-100" iconColor="text-amber-600" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
        <StatCard label="Closed" value={stats.closed} icon={XCircle} iconBg="bg-gray-100" iconColor="text-gray-600" />
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        searchable
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by ticket number or subject..."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        totalItems={totalItems}
        emptyIllustration="support"
        emptyTitle="No support tickets"
        emptyMessage="Tickets opened by hospitals will appear here."
        headerActions={
          <div className="flex items-center gap-2">
            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'open', label: 'Open' },
                { value: 'pending', label: 'Awaiting hospital' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              className="w-44"
            />
            <Select
              options={[
                { value: '', label: 'All Priority' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
              value={priorityFilter}
              onChange={(v) => { setPriorityFilter(v); setPage(1); }}
              className="w-40"
            />
          </div>
        }
      />
    </div>
  );
}
