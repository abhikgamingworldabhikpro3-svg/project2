import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border-2 border-dashed border-indigo-200/60 bg-gradient-to-b from-white/80 to-indigo-50/20 backdrop-blur-md my-4 shadow-xs">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-pink-500/10 text-indigo-600 flex items-center justify-center mb-4 shadow-sm ring-8 ring-indigo-50/50">
        <Icon className="w-8 h-8 stroke-[1.75]" />
      </div>
      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">{title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed font-medium">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
          >
            {actionLabel}
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200/90 bg-white/90 hover:bg-white text-slate-700 font-bold text-xs sm:text-sm shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
