import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  badgeText,
}) => {
  const iconColors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  }[variant];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </p>
        </div>
        <div className={`p-2.5 rounded-lg border ${iconColors} shrink-0`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>
      {(subtitle || badgeText) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{subtitle}</span>
          {badgeText && (
            <span className="font-semibold text-slate-700">{badgeText}</span>
          )}
        </div>
      )}
    </div>
  );
};
