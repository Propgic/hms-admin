import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function Spinner({ size = 'md', className = '' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <Loader2 className={clsx('animate-spin text-blue-600', sizeMap[size])} />
    </div>
  );
}
