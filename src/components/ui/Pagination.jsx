import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems,
}) {
  const getPages = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const showSizePicker = typeof pageSize === 'number' && typeof onPageSizeChange === 'function';
  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        {showSizePicker && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="appearance-none pl-2 pr-6 py-1 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark] dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
        {totalItems != null && (
          <p className="text-sm text-gray-500">
            {totalItems === 0
              ? 'No results'
              : `Showing ${startItem}–${endItem} of ${totalItems}`}
          </p>
        )}
        {totalItems == null && (
          <p className="text-sm text-gray-500">
            Page {currentPage} of {Math.max(totalPages, 1)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPages().map((page, idx) =>
          page === '...' ? (
            <span key={`dots-${idx}`} className="px-2 text-gray-400 text-sm">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={clsx(
                'min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors',
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
