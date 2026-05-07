import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import RowActions from '../../components/RowActions';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import DataTable from '../../components/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AnnouncementForm from './AnnouncementForm';

const SEVERITY_COLOR = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'danger',
};

function isLive(a) {
  if (!a.isActive) return false;
  const now = new Date();
  if (a.startsAt && new Date(a.startsAt) > now) return false;
  if (a.endsAt && new Date(a.endsAt) < now) return false;
  return true;
}

export default function AnnouncementList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, search };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get(endpoints.announcements.list, { params });
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(endpoints.announcements.delete(deleteTarget.id));
      toast.success('Announcement deleted');
      setDeleteTarget(null);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const audienceLabel = (a) => {
    if (a.audience === 'all') return 'All hospitals';
    if (a.audience === 'plan') return `${(a.planIds || []).length} plan(s)`;
    if (a.audience === 'hospital') return `${(a.hospitalIds || []).length} hospital(s)`;
    return a.audience;
  };

  const columns = [
    {
      header: 'Title',
      accessor: 'title',
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-slate-100">{row.title}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">{row.body}</div>
        </div>
      ),
    },
    {
      header: 'Severity',
      accessor: 'severity',
      cell: (row) => <Badge color={SEVERITY_COLOR[row.severity] || 'gray'}>{row.severity}</Badge>,
    },
    {
      header: 'Audience',
      accessor: 'audience',
      cell: (row) => audienceLabel(row),
    },
    {
      header: 'Window',
      accessor: 'startsAt',
      cell: (row) => (
        <div className="text-xs">
          <div>{dayjs(row.startsAt).format('MMM D, YYYY')}</div>
          <div className="text-gray-500 dark:text-slate-400">
            {row.endsAt ? `→ ${dayjs(row.endsAt).format('MMM D, YYYY')}` : '→ no end'}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (row) => {
        if (!row.isActive) return <Badge color="gray">Inactive</Badge>;
        if (isLive(row)) return <Badge color="success">Live</Badge>;
        if (row.startsAt && new Date(row.startsAt) > new Date()) return <Badge color="info">Scheduled</Badge>;
        return <Badge color="gray">Expired</Badge>;
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      width: '110px',
      cell: (row) => (
        <RowActions
          onEdit={() => { setEditing(row); setFormOpen(true); }}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-base text-gray-600 dark:text-slate-400">Broadcast banners shown inside hospital apps</p>
        <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
          New Announcement
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        searchable
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search announcements..."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        totalItems={totalItems}
        emptyIllustration="notifications"
        emptyTitle="No announcements yet"
        emptyMessage="Broadcast a message to hospitals — outage notices, feature releases, billing reminders."
        headerActions={
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            className="w-40"
          />
        }
      />

      <AnnouncementForm
        key={formOpen ? (editing?.id || editing?._id || 'new') : 'closed'}
        isOpen={formOpen}
        announcement={editing}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSuccess={fetchList}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete announcement"
        message={deleteTarget ? `Delete "${deleteTarget.title}"? This cannot be undone.` : ''}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
