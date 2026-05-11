import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Render to document.body via portal. The RouteTransition wrapper around
  // every page uses `will-change: transform` for its fade animation, and per
  // the CSS spec that creates a new containing block for position:fixed
  // descendants — meaning a non-portaled modal inside the page would be
  // positioned relative to the page area, not the viewport. The portal
  // lifts the modal out so `fixed inset-0` covers the whole screen.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Softer, blurred backdrop. The previous bg-black/50 dimmed the whole
          page too aggressively; a lighter slate with backdrop-blur reads as
          "this is layered" without making the surrounding content feel
          dead. */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] dark:bg-black/50"
        onClick={onClose}
      />
      <div
        className={`relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col border border-transparent dark:border-slate-800`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* flex-1 min-h-0 is the key: inside a flex-col with a max-height,
            the body needs both to actually constrain itself and let
            overflow-y-auto engage. Without min-h-0 the body grows to its
            content size and never scrolls. */}
        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>,
    document.body
  );
}
