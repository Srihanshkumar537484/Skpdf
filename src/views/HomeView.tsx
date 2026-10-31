import React, { useState } from 'react';
import { TOOLS, CATEGORIES } from '../data/toolsData';
import { ToolCategory } from '../types';
import {
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Layers,
  ChevronDown,
  CheckCircle2,
  FileCheck2,
  Type
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenSearch }) => {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const filteredTools = TOOLS.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const faqs = [
    {
      question: 'Is SkPDF really 100% free to use?',
      answer: 'Yes! All core tools—including the advanced existing-text PDF editor, Hindi & English OCR, file conversions, and mergers—are free with no mandatory account creation or hidden watermarks.'
    },
    {
      question: 'Are my uploaded documents safe and private?',
      answer: 'Absolutely. SkPDF performs document processing directly in your client browser sandbox using WebAssembly and modern canvas streaming. Your private files are not stored on foreign cloud servers.'
    },
    {
      question: 'Can I edit existing words inside an already compiled PDF?',
      answer: 'Yes! Unlike basic online tools that only draw a white box over text, SkPDF detects font metrics, glyph coordinates, and layout vectors, enabling you to click on existing words, modify spelling, replace sentences, and preserve formatting.'
    },
    {
      question: 'Does the OCR tool support Hindi (Devanagari) script accurately?',
      answer: 'Yes. SkPDF integrates specialized open-source neural LSTM models trained on Devanagari script, conjunct ligatures, matras, and bilingual Hindi-English documents.'
    },
    {
      question: 'Is there a companion Android application?',
      answer: 'Yes, a companion SkPDF Android application is developed separately for on-the-go smartphone productivity, while this web application provides full desktop and cross-platform editing.'
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative pt-8 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-400 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen WebAssembly & OCR Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight text-balance max-w-4xl mx-auto">
            All-in-One Online PDF Editor, Converter & <span className="text-rose-600 dark:text-rose-500">OCR Suite</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed text-balance">
            Edit existing text, convert PDF to Word, extract Devanagari Hindi & English text, compress without blur, and manage documents with zero server storage.
          </p>

          {/* Quick Search & Filter Bar */}
          <div className="mt-8 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-lg shadow-slate-200/50 dark:shadow-none">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 18+ tools (e.g., 'edit text', 'hindi ocr', 'pdf to word')..."
              className="w-full px-3 py-2 text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => onNavigate('/edit-pdf')}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-rose-600/30"
            >
              Start Editing
            </button>
          </div>

          {/* Quiet Trust Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>100% In-Browser Privacy</span>
            </div>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Zero Wait Times</span>
            </div>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-rose-500" />
              <span>Hindi & English OCR</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tools Catalog Section */}
      <section id="tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Tabs (Interactive Segmented Control) */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onNavigate(`/${tool.slug}`)}
              className="text-left p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 bg-white dark:bg-slate-900 hover:shadow-lg transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/60 group-hover:text-rose-600 transition-colors flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  {tool.badge && (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 px-2 py-0.5 rounded-full uppercase">
                      {tool.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tool.shortDescription}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 group-hover:text-rose-600 font-semibold">
                <span>Use tool</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">No tools found matching &quot;{searchQuery}&quot;</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-3 text-xs text-rose-600 font-bold hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      {/* Feature Spotlight: Advanced PDF Text Editor */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-semibold">
              <Type className="w-3.5 h-3.5" />
              <span>Priority Innovation</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              True In-Browser Existing Text Editing
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Forget clumsy text overlays that ruin document alignment. SkPDF analyzes embedded PDF font metrics and vector streams so you can double-click any word, fix typos, and replace sentences while preserving original layouts.
            </p>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Click directly on text lines to edit words in place</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Adjust font size, bold, italic, and color</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Add drawn electronic signatures and shape highlights</span>
              </li>
            </ul>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('/edit-pdf')}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Launch Advanced Text Editor
              </button>
            </div>
          </div>

          {/* Visual Interactive Preview Mock */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-3 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
              <span className="font-mono">sample_contract.pdf (Page 1)</span>
              <span className="text-[11px] text-emerald-400 font-semibold">Ready to Edit</span>
            </div>
            <div className="bg-white text-slate-900 p-6 rounded-xl space-y-3 text-xs leading-relaxed shadow-sm">
              <p className="font-bold text-sm text-slate-900 border-b pb-1">CONSULTING SERVICES AGREEMENT</p>
              <p>
                This Agreement is entered into on <span className="bg-amber-100 border border-amber-300 px-1 py-0.5 rounded font-medium text-slate-900">October 30, 2026</span> by and between the parties.
              </p>
              <p>
                The Consultant agrees to perform <span className="bg-rose-100 border border-rose-300 px-1 py-0.5 rounded font-medium text-rose-900">full-stack PDF engineering</span> as specified in Appendix A.
              </p>
              <div className="pt-4 flex items-center justify-between border-t border-slate-200 text-[11px]">
                <div className="font-serif italic text-slate-700 text-sm">Signed: Sameer Verma</div>
                <div className="text-slate-400">Status: Verified</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Spotlight 2: Hindi & English Neural OCR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
              <span>Hindi + English OCR Engine</span>
              <span className="font-mono text-emerald-600 font-bold">98.4% Confidence</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
              <p className="text-slate-900 dark:text-white font-medium">
                भारत सरकार के आधिकारिक दस्तावेज़ (Government of India Official Records)
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                यह प्रमाणित किया जाता है कि सभी नियम एवं शर्तें पूर्णतः सत्यापित हैं।
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Detected script: Devanagari + Latin-1 · Exportable to Word DOCX
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <Globe className="w-3.5 h-3.5" />
              <span>Bilingual Neural Recognition</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Accurate Hindi & English Document OCR
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Standard Western OCR systems fail on Devanagari matras, Shirorekha headline bars, and conjunct ligatures. SkPDF uses specialized neural models to extract both Hindi and English text simultaneously and export directly to Microsoft Word.
            </p>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('/pdf-ocr')}
                className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Try Hindi & English OCR
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How SkPDF Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-10">
          How SkPDF Works in 3 Steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono font-bold text-rose-600 block mb-2">01. Upload</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Select Your Files</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Drag and drop any PDF, Word document, or image into the dropzone. Files load directly in browser memory.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono font-bold text-rose-600 block mb-2">02. Process</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Edit, Convert, or OCR</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Apply existing-text changes, merge pages, run multi-language OCR, compress, or wipe metadata with high precision.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono font-bold text-rose-600 block mb-2">03. Download</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Instant Download</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Save your sanitized, edited, or converted file immediately. Zero queues and zero email gates.
            </p>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
