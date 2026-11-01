import React, { useState, useMemo } from 'react';
import { CONVERSION_MATRIX, SUPPORTED_FORMATS, FormatCategory } from '../services/conversionRegistry';
import { Search, ArrowRight, FileText, Image, Table, Code, Layers, Sparkles } from 'lucide-react';

interface ConversionPair {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  category: FormatCategory;
  description: string;
}

export const AllConversionsView: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Build full list of verified conversion pairs
  const allPairs: ConversionPair[] = useMemo(() => {
    const list: ConversionPair[] = [];
    Object.entries(CONVERSION_MATRIX).forEach(([fromKey, targets]) => {
      const fromFmt = SUPPORTED_FORMATS[fromKey];
      if (!fromFmt) return;

      targets.forEach((targetKey) => {
        const toFmt = SUPPORTED_FORMATS[targetKey];
        if (!toFmt) return;

        list.push({
          from: fromKey.toUpperCase(),
          to: targetKey.toUpperCase(),
          fromName: fromFmt.name,
          toName: toFmt.name,
          category: fromFmt.category,
          description: `Convert ${fromFmt.name} (.${fromKey}) directly to ${toFmt.name} (.${targetKey}) with preserved layout and high visual fidelity.`
        });
      });
    });
    return list;
  }, []);

  const filteredPairs = useMemo(() => {
    return allPairs.filter((pair) => {
      const matchesSearch =
        searchQuery === '' ||
        pair.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.fromName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pair.toName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = activeCategory === 'all' || pair.category === activeCategory;

      return matchesSearch && matchesCat;
    });
  }, [allPairs, searchQuery, activeCategory]);

  const categories = [
    { id: 'all', label: 'All Pairs', count: allPairs.length, icon: Layers },
    { id: 'image', label: 'Images', icon: Image },
    { id: 'spreadsheet', label: 'Spreadsheets', icon: Table },
    { id: 'document', label: 'Documents & Word', icon: FileText },
    { id: 'data', label: 'Data & Formats', icon: Code }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Title & Introduction */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
          <Sparkles className="w-3.5 h-3.5" />
          <span>40+ Verified Client-Side Conversion Pipelines</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          All Supported File Conversions
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300">
          Every conversion listed is powered by authentic browser-side WebAssembly, Canvas, and OpenXML compilers.
          Zero mock conversions, zero external paid APIs, and zero file retention.
        </p>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversions (e.g. PDF to Word, XLSX to CSV)..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((c) => {
            const Icon = c.icon;
            const isActive = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Conversion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPairs.map((pair, idx) => (
          <div
            key={idx}
            onClick={() => onNavigate('/convert')}
            className="group cursor-pointer p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 transition-all hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                    {pair.from}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-500 group-hover:translate-x-1 transition-transform" />
                  <span className="px-2 py-1 rounded-md text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                    {pair.to}
                  </span>
                </div>

                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  {pair.category}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                {pair.from} to {pair.to} Converter
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {pair.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
              <span>Convert Now</span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>

      {filteredPairs.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          No conversions matched "{searchQuery}". Try searching for another format like "PDF", "JPG", or "XLSX".
        </div>
      )}
    </div>
  );
};
