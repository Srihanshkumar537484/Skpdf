import React, { useState } from 'react';
import { PDFTool } from '../types';
import { Breadcrumbs } from './Breadcrumbs';
import { TOOLS } from '../data/toolsData';
import { CheckCircle2, ChevronDown, ArrowRight, ShieldCheck, Zap, Lock } from 'lucide-react';

interface ToolPageLayoutProps {
  tool: PDFTool;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({ tool, onNavigate, children }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Find 4 related tools in same category or popular
  const relatedTools = TOOLS.filter((t) => t.id !== tool.id && (t.category === tool.category || t.popular)).slice(0, 4);

  // Schema.org FAQPage structured data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Inject Schema.org FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Tools', path: '/' },
          { label: tool.name }
        ]}
        onNavigate={onNavigate}
      />

      {/* Tool Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {tool.h1}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {tool.shortDescription}
        </p>

        {/* Quiet Trust Bar (Zero-Pill) */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>End-to-End Client Encryption</span>
          </div>
          <span aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>High-Speed Assembly</span>
          </div>
          <span aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-rose-500" />
            <span>No File Logging</span>
          </div>
        </div>
      </div>

      {/* Interactive Tool Processing Workspace */}
      <div className="mb-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-8 shadow-sm">
        {children}
      </div>

      {/* How It Works (Step-by-Step Guide) */}
      <div className="mb-16 border-t border-slate-200 dark:border-slate-800 pt-12">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
          How to {tool.name} in 4 Easy Steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {tool.howToSteps.map((step, idx) => (
            <div
              key={idx}
              className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 relative"
            >
              <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 mb-2">
                Step 0{idx + 1}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features & Key Benefits */}
      <div className="mb-16 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10">
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            Why Use SkPDF for {tool.name}?
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
            Engineered for professionals requiring precision, speed, and strict privacy compliance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tool.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 dark:text-slate-200 leading-snug">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions (SEO FAQ Section) */}
      {tool.faqs.length > 0 && (
        <div className="mb-16 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {tool.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-colors"
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
        </div>
      )}

      {/* Related Tools Recommendations */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-12">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Related PDF Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {relatedTools.map((rt) => (
            <button
              key={rt.id}
              onClick={() => onNavigate(`/${rt.slug}`)}
              className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 bg-white dark:bg-slate-900 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {rt.name}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {rt.shortDescription}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
