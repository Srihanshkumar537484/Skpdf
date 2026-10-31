import React, { useState } from 'react';
import { Search, FileText, ArrowRight, Home, HelpCircle } from 'lucide-react';
import { TOOLS } from '../data/toolsData';

interface NotFoundViewProps {
  onNavigate: (path: string) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');

  const popularTools = TOOLS.filter((t) => t.popular).slice(0, 6);

  const filteredTools = search.trim()
    ? TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.shortDescription.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 4)
    : [];

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
          Error 404
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
          The document tool or article you are searching for might have moved or the URL might be mistyped.
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-md mx-auto relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for any tool (e.g. 'merge', 'edit', 'ocr')..."
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-rose-500 shadow-xs"
        />

        {filteredTools.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-xl z-20 text-left">
            {filteredTools.map((t) => (
              <button
                key={t.id}
                onClick={() => onNavigate(`/${t.slug}`)}
                className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center justify-between"
              >
                <span>{t.name}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular Tools Grid */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-left">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 text-center">
          Popular PDF Tools You Might Be Looking For:
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {popularTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onNavigate(`/${tool.slug}`)}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-500 hover:shadow-xs transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                  {tool.name}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-rose-600 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {tool.shortDescription}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 flex items-center justify-center gap-3">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Back to Homepage</span>
        </button>
        <button
          onClick={() => onNavigate('/blog')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
        >
          <FileText className="w-4 h-4" />
          <span>Browse Blog & Guides</span>
        </button>
      </div>
    </div>
  );
};
