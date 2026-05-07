// 404 page — confused-nurse illustration so wrong URLs feel on-brand.

import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import EmptyIllustration from '../components/ui/EmptyIllustration';
import Button from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <EmptyIllustration name="notFound" size={260} />
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-600">
        404 · Page not found
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
        That page wandered off
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
        The page you tried to open doesn't exist, was moved, or is part of a feature you don't have access to.
      </p>
      <div className="mt-6 flex items-center gap-2">
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Link to="/">
          <Button icon={Home}>Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
