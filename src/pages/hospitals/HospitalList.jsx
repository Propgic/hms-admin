import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit2, Trash2, Power } from 'lucide-react';
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

export default function HospitalList() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
      // Normalize: derive `status` from `isActive` if the backend hasn't sent it yet
      setHospitals(list.map((h) => ({
        ...h,
        status: h.status || (h.isActive === false ? 'suspended' : 'active'),
        planName: h.planName || h.plan?.name || null,
      })));
      setTotalPages(d.totalPages || d.pagination?.totalPages || 1);
      setTotalItems(d.total ?? d.pagination?.total ?? list.length);
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
    const map = { active: 'success', trial: 'warning', suspended: 'danger', inactive: 'gray' };
    return map[s] || 'gray';
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
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (row) => <Badge color={statusColor(row.status)}>{row.status}</Badge>,
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
      width: '160px',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/hospitals/${row.id || row._id}`)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditingHospital(row); setFormOpen(true); }}
            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
            title="Toggle Status"
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(row)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-base text-gray-600 dark:text-slate-400">Manage all registered hospitals</p>
        <Button icon={Plus} onClick={() => { setEditingHospital(null); setFormOpen(true); }}>
          Add Hospital
        </Button>
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
