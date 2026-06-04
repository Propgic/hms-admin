import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// App-level error boundary. Without this, any uncaught render error blanks the
// entire SPA (white screen). Here we catch it, show a recoverable fallback, and
// keep the error in the console for debugging. Must be a class component —
// React only supports error boundaries via getDerivedStateFromError /
// componentDidCatch, which have no hook equivalent.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Uncaught render error:', error, info?.componentStack);
  }

  handleReload = () => {
    // Full reload is the safest reset for an unknown render fault.
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="max-w-md w-full text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            An unexpected error occurred while rendering this page. You can reload to recover — your session stays signed in.
          </p>
          {this.state.error?.message && (
            <pre className="mt-3 max-h-28 overflow-auto rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2 text-left text-[11px] text-slate-500 dark:text-slate-400">
              {String(this.state.error.message)}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            <RefreshCw className="h-4 w-4" /> Reload page
          </button>
        </div>
      </div>
    );
  }
}
