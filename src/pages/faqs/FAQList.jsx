import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import RowActions from "../../components/RowActions";
import toast from "react-hot-toast";
import api from "../../api/axios";
import endpoints from "../../api/endpoints";
import DataTable from "../../components/DataTable";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import FAQForm from "./FAQForm";
import FAQCategoryForm from "./FAQCategoryForm";

export default function FAQList() {
  const [activeTab, setActiveTab] = useState("faqs");
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [faqFormOpen, setFaqFormOpen] = useState(false);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.faqs.list, {
        params: { page, limit: pageSize, search },
      });
      const d = res.data.data || res.data;
      const list = d.faqs || d.rows || d.items || (Array.isArray(d) ? d : []);
      setFaqs(list);
      setTotalPages(d.totalPages || d.pagination?.totalPages || 1);
      setTotalItems(d.total ?? d.pagination?.total ?? list.length);
    } catch {
      setFaqs([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.faqCategories.list, {
        params: { page, limit: pageSize, search },
      });
      const d = res.data.data || res.data;
      const list =
        d.categories || d.rows || d.items || (Array.isArray(d) ? d : []);
      setCategories(list);
      setTotalPages(d.totalPages || d.pagination?.totalPages || 1);
      setTotalItems(d.total ?? d.pagination?.total ?? list.length);
    } catch {
      setCategories([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "faqs") fetchFaqs();
    else fetchCategories();
  }, [activeTab, fetchFaqs, fetchCategories]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const id = deleteConfirm.id || deleteConfirm._id;
      if (deleteConfirm._type === "category") {
        await api.delete(endpoints.faqCategories.delete(id));
        toast.success("Category deleted");
        fetchCategories();
      } else {
        await api.delete(endpoints.faqs.delete(id));
        toast.success("FAQ deleted");
        fetchFaqs();
      }
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const faqColumns = [
    {
      header: "Order",
      accessor: "sortOrder",
      align: "center",
      cell: (row) => row.sortOrder ?? 0,
    },
    {
      header: "Question",
      accessor: "question",
      cell: (row) => (
        <span className="font-medium text-gray-900 line-clamp-1">
          {row.question}
        </span>
      ),
    },
    {
      header: "Category",
      accessor: "category",
      cell: (row) => row.categoryName || row.category?.name || "-",
    },
    {
      header: "Status",
      accessor: "isActive",
      cell: (row) => (
        <Badge color={row.isActive !== false ? "success" : "gray"}>
          {row.isActive !== false ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      width: "110px",
      cell: (row) => (
        <RowActions
          onEdit={() => { setEditingFaq(row); setFaqFormOpen(true); }}
          onDelete={() => setDeleteConfirm(row)}
        />
      ),
    },
  ];

  const catColumns = [
    {
      header: "Sort Order",
      accessor: "sortOrder",
      align: "center",
      cell: (row) => row.sortOrder ?? 0,
    },
    {
      header: "Name",
      accessor: "name",
      cell: (row) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      header: "Slug",
      accessor: "slug",
    },
    {
      header: "FAQ Count",
      accessor: "faqCount",
      align: "center",
      cell: (row) => row.faqCount ?? 0,
    },
    {
      header: "Status",
      accessor: "isActive",
      cell: (row) => (
        <Badge color={row.isActive !== false ? "success" : "gray"}>
          {row.isActive !== false ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      width: "110px",
      cell: (row) => (
        <RowActions
          onEdit={() => { setEditingCat(row); setCatFormOpen(true); }}
          onDelete={() => setDeleteConfirm({ ...row, _type: "category" })}
        />
      ),
    },
  ];

  const tabs = [
    { key: "faqs", label: "FAQs" },
    { key: "categories", label: "Categories" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-base text-gray-600 dark:text-slate-400">
          Manage frequently asked questions and categories
        </p>
        <Button
          icon={Plus}
          onClick={() => {
            if (activeTab === "faqs") {
              setEditingFaq(null);
              setFaqFormOpen(true);
            } else {
              setEditingCat(null);
              setCatFormOpen(true);
            }
          }}
        >
          Add {activeTab === "faqs" ? "FAQ" : "Category"}
        </Button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={activeTab === "faqs" ? faqColumns : catColumns}
        data={activeTab === "faqs" ? faqs : categories}
        loading={loading}
        searchable
        searchValue={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder={
          activeTab === "faqs" ? "Search FAQs..." : "Search categories..."
        }
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        totalItems={totalItems}
        emptyTitle={
          activeTab === "faqs" ? "No FAQs found" : "No categories found"
        }
        emptyMessage={
          activeTab === "faqs"
            ? "Create your first FAQ."
            : "Create your first category."
        }
      />

      <FAQForm
        isOpen={faqFormOpen}
        onClose={() => {
          setFaqFormOpen(false);
          setEditingFaq(null);
        }}
        faq={editingFaq}
        onSuccess={fetchFaqs}
      />

      <FAQCategoryForm
        isOpen={catFormOpen}
        onClose={() => {
          setCatFormOpen(false);
          setEditingCat(null);
        }}
        category={editingCat}
        onSuccess={fetchCategories}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={
          deleteConfirm?._type === "category" ? "Delete Category" : "Delete FAQ"
        }
        message={`Are you sure you want to delete this ${deleteConfirm?._type === "category" ? "category" : "FAQ"}?`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
