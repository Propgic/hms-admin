import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Eye, Edit2, Trash2, Power, Hourglass, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import DataTable from '../../components/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import HospitalForm from './HospitalForm';
import { useAuth } from '../../hooks/useAuth';

const BAND_STYLES = {
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  red: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

function HealthBadge({ health }) {
  if (!health) return <span className="text-xs text-gray-400">—</span>;
  const cls = BAND_STYLES[health.band] || BAND_STYLES.yellow;
  const tooltip = (health.reasons || []).join(' · ') || `Health ${health.score}/100`;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}
      title={tooltip}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {health.score}
    </span>
  );
}

function TrialCell({ trial }) {
  if (!trial) return <span className="text-xs text-gray-400">—</span>;
  if (trial.expired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
        <ShieldAlert className="w-3.5 h-3.5" />
        Expired
      </span>
    );
  }
  const urgent = trial.daysLeft <= 3;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${urgent ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-slate-300'}`}>
      <Hourglass className="w-3.5 h-3.5" />
      {trial.daysLeft}d left
    </span>
  );
}

export default function HospitalList() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // Pre-select the status filter from a ?status= query param (e.g. the
  // dashboard's "Active Users" card deep-links to /hospitals?status=active).
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(() => {
    const s = searchParams.get('status');
    return ['active', 'trial', 'suspended', 'inactive'].includes(s) ? s : '';
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [formOpen, setFormOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      // Backend stores only `isActive` (boolean), so translate UI status options to isActive.
      // active/trial → isActive=true, suspended/inactive → isActive=false, '' → no filter.
      let isActive;
      if (statusFilter === 'active' || statusFilter === 'trial') isActive = true;
      else if (statusFilter === 'suspended' || statusFilter === 'inactive') isActive = false;
      // Backend sort key for the Status column is isActive, not `status` (which is derived).
      const backendSortField = sortField === 'status' ? 'isActive' : sortField;
      const res = await api.get(endpoints.hospitals.list, {
        params: {
          page,
          limit: pageSize,
          search,
          isActive,
          sortBy: backendSortField,
          sortOrder,
        },
      });
      const d = res.data.data || res.data;
      const list = d.hospitals || d.rows || d.items || (Array.isArray(d) ? d : []);
      // Pagination lives at the response root (res.data.pagination), not inside
      // `data` — when `data` is the bare array, d.pagination is undefined and
      // the pager would be stuck on page 1. Read the root first.
      const pg = res.data.pagination || d.pagination || {};
      // Normalize: derive `status` from `isActive` if the backend hasn't sent it yet
      setHospitals(list.map((h) => ({
        ...h,
        status: h.status || (h.isActive === false ? 'suspended' : 'active'),
        planName: h.planName || h.plan?.name || null,
      })));
      setTotalPages(pg.totalPages || d.totalPages || 1);
      setTotalItems(pg.total ?? d.total ?? list.length);
    } catch {
      setHospitals([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, sortField, sortOrder]);

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.delete(endpoints.hospitals.delete(deleteConfirm.id || deleteConfirm._id));
      toast.success('Hospital deleted');
      setDeleteConfirm(null);
      fetchHospitals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (hospital) => {
    try {
      const nextActive = !(hospital.isActive ?? hospital.status === 'active');
      await api.patch(endpoints.hospitals.toggleStatus(hospital.id || hospital._id), { isActive: nextActive });
      toast.success(`Hospital ${nextActive ? 'activated' : 'suspended'}`);
      fetchHospitals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };


  const statusColor = (s) => {
    const map = { active: 'success', trial: 'warning', trial_expired: 'danger', suspended: 'danger', inactive: 'gray' };
    return map[s] || 'gray';
  };

  const sweepTrials = async () => {
    try {
      const res = await api.post(endpoints.hospitals.sweepExpiredTrials);
      const d = res.data?.data || {};
      toast.success(`Swept ${d.suspended || 0} expired trial(s)`);
      fetchHospitals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sweep failed');
    }
  };

  const columns = [
    {
      header: 'Hospital',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    { header: 'Phone', accessor: 'phone' },
    {
      header: 'Plan',
      accessor: 'plan',
      cell: (row) => row.planName || row.plan?.name || row.plan || '-',
    },
    {
      header: 'Health',
      accessor: 'health',
      cell: (row) => <HealthBadge health={row.health} />,
    },
    {
      header: 'Trial',
      accessor: 'trial',
      cell: (row) => <TrialCell trial={row.trial} />,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => <Badge color={statusColor(row.status)}>{String(row.status).replace('_', ' ')}</Badge>,
    },
    {
      header: 'Joined',
      accessor: 'createdAt',
      sortable: true,
      cell: (row) => dayjs(row.createdAt).format('MMM D, YYYY'),
    },
    {
      header: 'Actions',
      id: 'actions',
      width: '180px',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(`/hospitals/${row.id || row._id}`)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
            title="View"
            aria-label="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => { setEditingHospital(row); setFormOpen(true); }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-primary-500/40 dark:hover:bg-primary-500/10 dark:hover:text-primary-300"
              title="Edit"
              aria-label="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => handleToggleStatus(row)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-amber-500/40 dark:hover:bg-amber-500/10 dark:hover:text-amber-300"
              title="Toggle Status"
              aria-label="Toggle Status"
            >
              <Power className="h-4 w-4" />
            </button>
          )}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setDeleteConfirm(row)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
              title="Delete"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-base text-gray-600 dark:text-slate-400">Manage all registered hospitals</p>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Button variant="secondary" onClick={sweepTrials} title="Suspend hospitals whose trial has expired and who have no active paid subscription">
              Sweep Expired Trials
            </Button>
          )}
          {isSuperAdmin && (
            <Button icon={Plus} onClick={() => { setEditingHospital(null); setFormOpen(true); }}>
              Add Hospital
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={hospitals}
        loading={loading}
        searchable
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search hospitals..."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        totalItems={totalItems}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={(f, o) => { setSortField(f); setSortOrder(o); }}
        emptyIllustration="patients"
        emptyTitle="No hospitals found"
        emptyMessage="Get started by adding your first hospital."
        headerActions={(
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'trial', label: 'Trial' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            className="w-40"
          />
        )}
      />

      <HospitalForm
        key={formOpen ? (editingHospital?.id || editingHospital?._id || 'new') : 'closed'}
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingHospital(null); }}
        hospital={editingHospital}
        onSuccess={fetchHospitals}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Hospital"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
