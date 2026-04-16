import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import endpoints from '../../api/endpoints';
import DataTable from '../../components/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FAQForm from './FAQForm';
import FAQCategoryForm from './FAQCategoryForm';

export default function FAQList() {
  const [activeTab, setActiveTab] = useState('faqs');
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [faqFormOpen, setFaqFormOpen] = useState(false);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.faqs.list, { params: { page, limit: 10, search } });
      const d = res.data.data || res.data;
      setFaqs(d.faqs || d.rows || d.items || (Array.isArray(d) ? d : []));
      setTotalPages(d.totalPages || d.pagination?.totalPages || 1);
    } catch {
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.faqCategories.list, { params: { page, limit: 10, search } });
      const d = res.data.data || res.data;
      setCategories(d.categories || d.rows || d.items || (Array.isArray(d) ? d : []));
      setTotalPages(d.totalPages || d.pagination?.totalPages || 1);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    setPage(1);
    setSearch('');
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'faqs') fetchFaqs();
    else fetchCategories();
  }, [activeTab, fetchFaqs, fetchCategories]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const id = deleteConfirm.id || deleteConfirm._id;
      if (deleteConfirm._type === 'category') {
        await api.delete(endpoints.faqCategories.delete(id));
        toast.success('Category deleted');
        fetchCategories();
      } else {
        await api.delete(endpoints.faqs.delete(id));
        toast.success('FAQ deleted');
        fetchFaqs();
      }
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const faqColumns = [
    {
      header: 'Question',
      accessor: 'question',
      cell: (row) => <span className="font-medium text-gray-900 line-clamp-1">{row.question}</span>,
    },
    {
      header: 'Category',
      accessor: 'category',
      cell: (row) => row.categoryName || row.category?.name || '-',
    },
    {
      header: 'Status',
      accessor: 'isPublished',
      cell: (row) => (
        <Badge color={row.isPublished !== false ? 'success' : 'gray'}>
          {row.isPublished !== false ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      header: 'Order',
      accessor: 'sortOrder',
      cell: (row) => row.sortOrder ?? 0,
    },
    {
      header: 'Actions',
      id: 'actions',
      width: '100px',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditingFaq(row); setFaqFormOpen(true); }} className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteConfirm(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const catColumns = [
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
    },
    {
      header: 'Slug',
      accessor: 'slug',
    },
    {
      header: 'FAQ Count',
      accessor: 'faqCount',
      cell: (row) => row.faqCount ?? 0,
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
      header: 'Actions',
      id: 'actions',
      width: '100px',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditingCat(row); setCatFormOpen(true); }} className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteConfirm({ ...row, _type: 'category' })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const tabs = [
    { key: 'faqs', label: 'FAQs' },
    { key: 'categories', label: 'Categories' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage frequently asked questions and categories</p>
        </div>
        <Button
          icon={Plus}
          onClick={() => {
            if (activeTab === 'faqs') { setEditingFaq(null); setFaqFormOpen(true); }
            else { setEditingCat(null); setCatFormOpen(true); }
          }}
        >
          Add {activeTab === 'faqs' ? 'FAQ' : 'Category'}
        </Button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={activeTab === 'faqs' ? faqColumns : catColumns}
        data={activeTab === 'faqs' ? faqs : categories}
        loading={loading}
        searchable
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={activeTab === 'faqs' ? 'Search FAQs...' : 'Search categories...'}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyTitle={activeTab === 'faqs' ? 'No FAQs found' : 'No categories found'}
        emptyMessage={activeTab === 'faqs' ? 'Create your first FAQ.' : 'Create your first category.'}
      />

      <FAQForm
        isOpen={faqFormOpen}
        onClose={() => { setFaqFormOpen(false); setEditingFaq(null); }}
        faq={editingFaq}
        onSuccess={fetchFaqs}
      />

      <FAQCategoryForm
        isOpen={catFormOpen}
        onClose={() => { setCatFormOpen(false); setEditingCat(null); }}
        category={editingCat}
        onSuccess={fetchCategories}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={deleteConfirm?._type === 'category' ? 'Delete Category' : 'Delete FAQ'}
        message={`Are you sure you want to delete this ${deleteConfirm?._type === 'category' ? 'category' : 'FAQ'}?`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
