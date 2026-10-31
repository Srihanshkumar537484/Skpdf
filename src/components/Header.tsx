import React, { useState, useEffect } from 'react';
import { Search, Moon, Sun, FileText, ChevronDown } from 'lucide-react';
import { CATEGORIES, TOOLS } from '../data/toolsData';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate, onOpenSearch }) => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('skpdf_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('skpdf_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('skpdf_theme', 'light');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-rose-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Sk<span className="text-rose-600 dark:text-rose-500">PDF</span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <div className="relative">
            <button
              onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
              className="flex items-center gap-1.5 py-1 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <span>All Tools</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isToolsDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsToolsDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-80 max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 z-20 grid grid-cols-1 gap-1">
                  {TOOLS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onNavigate(`/${t.slug}`);
                        setIsToolsDropdownOpen(false);
                      }}
                      className="text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                    >
                      <span className="truncate">{t.name}</span>
                      {t.badge && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold uppercase">
                          {t.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => onNavigate('/edit-pdf')}
            className={`py-1 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              currentPath === '/edit-pdf' ? 'text-rose-600 dark:text-rose-500 font-semibold' : ''
            }`}
          >
            Edit PDF
          </button>

          <button
            onClick={() => onNavigate('/pdf-to-word')}
            className={`py-1 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              currentPath === '/pdf-to-word' ? 'text-rose-600 dark:text-rose-500 font-semibold' : ''
            }`}
          >
            PDF to Word
          </button>

          <button
            onClick={() => onNavigate('/pdf-ocr')}
            className={`py-1 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              currentPath === '/pdf-ocr' ? 'text-rose-600 dark:text-rose-500 font-semibold' : ''
            }`}
          >
            Hindi & English OCR
          </button>

          <button
            onClick={() => onNavigate('/blog')}
            className={`py-1 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              currentPath.startsWith('/blog') ? 'text-rose-600 dark:text-rose-500 font-semibold' : ''
            }`}
          >
            Blog
          </button>
        </nav>

        {/* Zone 3: Primary Action & Utilities */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenSearch}
            aria-label="Search tools"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search tools...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onNavigate('/edit-pdf')}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-rose-600/20"
          >
            Start Editing
          </button>
        </div>
      </div>
    </header>
  );
};
