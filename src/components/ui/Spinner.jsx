import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import HeartRateLoader from './HeartRateLoader';

export default function Spinner({ size = 'md', className = '', fullPage = false, label }) {
  if (fullPage) {
    return <HeartRateLoader fullPage label={label} />;
  }

  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={clsx('flex items-center justify-center w-full', className)}>
      <Loader2 className={clsx('animate-spin text-blue-600', sizeMap[size])} />
    </div>
  );
}
