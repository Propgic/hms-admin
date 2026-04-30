import { Pencil, Trash2 } from 'lucide-react';

const EDIT_CLS = 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-primary-500/40 dark:hover:bg-primary-500/10 dark:hover:text-primary-300';
const DELETE_CLS = 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10';

// Pencil + trash icon buttons for a DataTable actions column. Both buttons stop
// propagation so they don't trigger the row's onRowClick.
export default function RowActions({ onEdit, onDelete, editLabel = 'Edit', deleteLabel = 'Delete' }) {
  if (!onEdit && !onDelete) return null;

  return (
    <div className="flex items-center justify-end gap-2">
      {onEdit && (
        <button
          type="button"
          title={editLabel}
          aria-label={editLabel}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className={EDIT_CLS}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          title={deleteLabel}
          aria-label={deleteLabel}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className={DELETE_CLS}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
