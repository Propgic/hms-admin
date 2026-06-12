import { useState, useEffect } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Pagination from './ui/Pagination';
import EmptyState from './ui/EmptyState';
import HeartRateLoader from './ui/HeartRateLoader';

const SEARCH_DEBOUNCE_MS = 400;

function SkeletonRow({ colCount }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function DataTable({
  columns,
  data = [],
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search...',
  onSearch,
  searchValue = '',
  totalPages = 1,
  currentPage = 1,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems,
  sortField,
  sortOrder,
  onSort,
  emptyTitle,
  emptyMessage,
  emptyIllustration,
  headerActions,
  onRowClick,
}) {
  // Input text shown in the box — updated immediately for responsive typing.
  const [inputValue, setInputValue] = useState(searchValue);

  // Sync local input when parent resets searchValue externally (e.g. filter change).
  useEffect(() => {
    setInputValue(searchValue);
  }, [searchValue]);

  // Debounce: only fire onSearch after the user pauses typing.
  useEffect(() => {
    if (!onSearch) return undefined;
    if (inputValue === searchValue) return undefined;
    const t = setTimeout(() => onSearch(inputValue), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [inputValue, onSearch, searchValue]);

  const filteredData = onSearch
    ? data
    : data.filter((row) => {
        if (!inputValue) return true;
        return columns.some((col) => {
          const val = col.accessor ? row[col.accessor] : '';
          return String(val).toLowerCase().includes(inputValue.toLowerCase());
        });
      });

  const handleSort = (col) => {
    if (!col.sortable || !onSort) return;
    const field = col.accessor;
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(field, order);
  };

  const renderSortIcon = (col) => {
    if (!col.sortable) return null;
    if (sortField !== col.accessor) return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600" />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-[calc(100vh-14rem)]">
      {(searchable || headerActions) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          {searchable && (
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      <div className="relative overflow-x-auto flex-1">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col) => {
                const align = col.align || 'left';
                const alignText = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
                const alignFlex = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';
                return (
                  <th
                    key={col.accessor || col.id}
                    className={`px-4 py-3 ${alignText} text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                      col.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''
                    }`}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => handleSort(col)}
                  >
                    <div className={`flex items-center gap-1 ${alignFlex}`}>
                      {col.header}
                      {renderSortIcon(col)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-gray-100 transition-opacity duration-200 ${
              loading && filteredData.length > 0 ? 'opacity-60' : ''
            }`}
          >
            {loading && filteredData.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} colCount={columns.length} />
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8">
                  <EmptyState
                    illustration={emptyIllustration}
                    title={emptyTitle}
                    message={emptyMessage}
                  />
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIdx) => (
                <tr
                  key={row.id || row._id || rowIdx}
                  onClick={onRowClick ? (e) => { if (!e.target.closest('a, button, input, select, [role="button"]')) onRowClick(row); } : undefined}
                  className={`hover:bg-gray-50 text-sm ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => {
                    const align = col.align || 'left';
                    const alignText = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
                    return (
                      <td key={col.accessor || col.id} className={`px-4 py-3 text-gray-700 ${alignText}`}>
                        {col.cell ? col.cell(row, rowIdx) : row[col.accessor] ?? '-'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {loading && filteredData.length > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-10">
            <HeartRateLoader inline size="sm" />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
}
