import { Inbox } from 'lucide-react';
import EmptyIllustration from './EmptyIllustration';

// Empty state. Pass `illustration` (e.g. "patients", "invoices", "notFound")
// to render a custom hand-drawn SVG. Older callers pass `icon` / `message`
// — those still work.
export default function EmptyState({
  illustration,
  illustrationSize = 220,
  icon: Icon = Inbox,
  title = 'No data found',
  message = 'There are no items to display.',
  description, // alias for message — keeps DataTable callers consistent
  action,
}) {
  const subtitle = description || message;
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {illustration ? (
        <div className="mb-3">
          <EmptyIllustration name={illustration} size={illustrationSize} />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400 dark:text-slate-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mb-4">{subtitle}</p>
      {action}
    </div>
  );
}
