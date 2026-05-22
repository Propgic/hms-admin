import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import RowActions from '../../components/RowActions';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import DataTable from '../../components/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PlanForm from './PlanForm';
import { formatCurrency } from '../../utils/formatters';

export default function PlanList() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize, search };
      if (statusFilter === 'active') params.isActive = true;
      else if (statusFilter === 'inactive') params.isActive = false;
      const res = await api.get(endpoints.plans.list, { params });
      const d = res.data.data || res.data;
      const list = d.plans || d.rows || d.items || (Array.isArray(d) ? d : []);
      setPlans(list);
      setTotalPages(d.totalPages || d.pagination?.totalPages || Math.max(1, Math.ceil((d.total ?? list.length) / pageSize)));
      setTotalItems(d.total ?? d.pagination?.total ?? list.length);
    } catch {
      setPlans([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

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
      cell: (row) => `${formatCurrency(row.price || 0)}/${row.billingCycle === 'yearly' ? 'yr' : 'mo'}`,
    },
    {
      header: 'Duration',
      accessor: 'durationInDays',
      cell: (row) => `${row.durationInDays ?? 30} days`,
    },
    {
      header: 'Max Users',
      accessor: 'maxUsers',
      cell: (row) => row.maxUsers || 'Unlimited',
    },
    {
      header: 'Max Admins',
      accessor: 'maxAdmins',
      cell: (row) => row.maxAdmins ?? 1,
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
      width: '110px',
      cell: (row) => (
        <RowActions
          onEdit={() => { setEditingPlan(row); setFormOpen(true); }}
          onDelete={() => setDeleteConfirm(row)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-base text-gray-600 dark:text-slate-400">Manage subscription plans and pricing</p>
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
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        totalItems={totalItems}
        emptyIllustration="invoices"
        emptyTitle="No plans found"
        emptyMessage="Create your first subscription plan."
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

      <PlanForm
        key={formOpen ? (editingPlan?.id || editingPlan?._id || 'new') : 'closed'}
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
