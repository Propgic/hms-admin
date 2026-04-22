import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function Spinner({ size = 'md', className = '', fullPage = false }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const effectiveSize = fullPage && size === 'md' ? 'lg' : size;
  return (
    <div
      className={clsx(
        'flex items-center justify-center w-full',
        fullPage && 'min-h-[calc(100vh-10rem)]',
        className,
      )}
    >
      <Loader2 className={clsx('animate-spin text-blue-600', sizeMap[effectiveSize])} />
    </div>
  );
}
