import { clsx } from 'clsx';

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={clsx('bg-white p-3 shadow-sm rounded-lg', className)}
      {...props}
    >
      {children}
    </div>
  );
}
