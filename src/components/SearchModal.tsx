import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { TOOLS } from '../data/toolsData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (slug: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectTool }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent can toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();
  const filteredTools = normalizedQuery
    ? TOOLS.filter(
        (tool) =>
          tool.name.toLowerCase().includes(normalizedQuery) ||
          tool.shortDescription.toLowerCase().includes(normalizedQuery) ||
          tool.keywords.some((k) => k.toLowerCase().includes(normalizedQuery)) ||
          tool.category.toLowerCase().includes(normalizedQuery)
      )
    : TOOLS.slice(0, 8); // show popular initial items

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Box */}
        <div className="relative flex items-center border-b border-slate-200 dark:border-slate-800 px-4 py-3.5">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all PDF tools (e.g. 'merge', 'edit text', 'hindi ocr', 'compress')..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] text-slate-400 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  onSelectTool(tool.slug);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
              >
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {tool.name}
                    </span>
                    {tool.badge && (
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold uppercase">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {tool.shortDescription}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))
          ) : (
            <div className="py-12 text-center">
              <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">No tools found matching &quot;{query}&quot;</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for &quot;edit&quot;, &quot;word&quot;, &quot;ocr&quot;, or &quot;compress&quot;</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Pro tip: Press ⌘K anywhere on the site</span>
          <span>{filteredTools.length} tools available</span>
        </div>
      </div>
    </div>
  );
};
