import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import DataTable from '../../components/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PlanForm from './PlanForm';

export default function PlanList() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.plans.list, { params: { page, limit: 10, search } });
      const d = res.data.data || res.data;
      setPlans(d.plans || d.rows || d.items || (Array.isArray(d) ? d : []));
      setTotalPages(d.totalPages || d.pagination?.totalPages || 1);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.delete(endpoints.plans.delete(deleteConfirm.id || deleteConfirm._id));
      toast.success('Plan deleted');
      setDeleteConfirm(null);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Plan Name',
      accessor: 'name',
      cell: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
    },
    {
      header: 'Price',
      accessor: 'price',
      cell: (row) => `$${row.price || 0}/mo`,
    },
    {
      header: 'Duration',
      accessor: 'durationInDays',
      cell: (row) => `${row.durationInDays || 30} days`,
    },
    {
      header: 'Max Users',
      accessor: 'maxUsers',
      cell: (row) => row.maxUsers || 'Unlimited',
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (row) => (
        <Badge color={row.isActive !== false ? 'success' : 'gray'}>
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Hospitals',
      accessor: 'hospitalCount',
      cell: (row) => row.hospitalCount ?? 0,
    },
    {
      header: 'Actions',
      id: 'actions',
      width: '100px',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setEditingPlan(row); setFormOpen(true); }}
            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(row)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500 mt-1">Manage subscription plans and pricing</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditingPlan(null); setFormOpen(true); }}>
          Add Plan
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={plans}
        loading={loading}
        searchable
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search plans..."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle="No plans found"
        emptyMessage="Create your first subscription plan."
      />

      <PlanForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingPlan(null); }}
        plan={editingPlan}
        onSuccess={fetchPlans}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Plan"
        message={`Delete "${deleteConfirm?.name}"? Hospitals on this plan will need to be migrated.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
