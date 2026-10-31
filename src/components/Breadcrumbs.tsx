import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (path: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate }) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <li>
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </li>
              <li>
                {isLast || !item.path ? (
                  <span className="font-semibold text-slate-900 dark:text-white" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <button
                    onClick={() => onNavigate(item.path!)}
                    className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
