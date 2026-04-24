import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import DataTable from '../../components/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CouponForm from './CouponForm';

function discountLabel(c) {
  if (!c) return '—';
  if (c.discountType === 'percent') return `${Number(c.discountValue)}%`;
  return `${c.currency || 'INR'} ${Number(c.discountValue).toFixed(2)} flat`;
}

function usageLabel(c) {
  const used = c.usedCount ?? c._count?.redemptions ?? 0;
  if (c.maxRedemptions) return `${used} / ${c.maxRedemptions}`;
  return `${used} / ∞`;
}

function statusOf(c) {
  if (!c.isActive) return { label: 'Inactive', color: 'gray' };
  if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { label: 'Expired', color: 'danger' };
  if (c.maxRedemptions && c.usedCount >= c.maxRedemptions) return { label: 'Exhausted', color: 'warning' };
  return { label: 'Active', color: 'success' };
}

export default function CouponList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.coupons.list, { params: { page, limit: pageSize, search } });
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

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await api.delete(endpoints.coupons.delete(deleteConfirm.id));
      toast.success('Coupon deleted');
      setDeleteConfirm(null);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Code',
      accessor: 'code',
      cell: (row) => <span className="font-mono font-semibold text-gray-900 dark:text-slate-100">{row.code}</span>,
    },
    {
      header: 'Discount',
      accessor: 'discountValue',
      cell: (row) => discountLabel(row),
    },
    {
      header: 'Usage',
      accessor: 'usedCount',
      cell: (row) => usageLabel(row),
    },
    {
      header: 'Expires',
      accessor: 'expiresAt',
      cell: (row) => row.expiresAt ? dayjs(row.expiresAt).format('MMM D, YYYY') : '—',
    },
    {
      header: 'Plans',
      accessor: 'appliesTo',
      cell: (row) => Array.isArray(row.appliesTo) && row.appliesTo.length ? `${row.appliesTo.length} plan(s)` : 'All',
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (row) => {
        const s = statusOf(row);
        return <Badge color={s.color}>{s.label}</Badge>;
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      width: '100px',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setEditing(row); setFormOpen(true); }}
            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(row)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
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
        <p className="text-base text-gray-600 dark:text-slate-400">Create and manage promotional discount codes</p>
        <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
          New Coupon
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        searchable
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search coupons..."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        totalItems={totalItems}
        emptyTitle="No coupons yet"
        emptyMessage="Create your first promotional discount code."
      />

      <CouponForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        coupon={editing}
        onSuccess={fetchList}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Coupon"
        message={`Delete coupon "${deleteConfirm?.code}"? Existing redemption records will also be removed.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
