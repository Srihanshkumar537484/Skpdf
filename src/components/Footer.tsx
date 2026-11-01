import React from 'react';
import { FileText, Shield, Zap, Globe, Smartphone } from 'lucide-react';
import { TOOLS } from '../data/toolsData';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const organizeTools = TOOLS.filter((t) => t.category === 'organize');
  const editTools = TOOLS.filter((t) => t.category === 'edit');
  const convertTools = TOOLS.filter((t) => t.category === 'convert-from' || t.category === 'convert-to');
  const ocrSecurityTools = TOOLS.filter((t) => t.category === 'ocr' || t.category === 'security' || t.category === 'image-word');

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-sm">
      {/* Trust & Performance Banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 py-8 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">100% Client-Side Privacy</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Files are processed securely in your browser sandbox without permanent cloud storage.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Instant High-Speed Execution</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Zero upload queues or throttling. Powered by WebAssembly and client-side stream engines.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Multilingual Hindi & English</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                First-class optical character recognition for Devanagari script and complex document layouts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand Column */}
        <div className="col-span-2 md:col-span-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-600 to-amber-500 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white">SkPDF</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The modern, privacy-first PDF and document suite. Edit text, convert formats, extract Hindi and English OCR, and manage documents seamlessly.
          </p>

          <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Smartphone className="w-3.5 h-3.5 text-rose-500" />
            <span>Companion Android app available separately</span>
          </div>
        </div>

        {/* Organize Tools */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            Organize PDF
          </h3>
          <ul className="space-y-2 text-xs">
            {organizeTools.slice(0, 6).map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => onNavigate(`/${t.slug}`)}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Edit & Create */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            Edit & Sign
          </h3>
          <ul className="space-y-2 text-xs">
            {editTools.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => onNavigate(`/${t.slug}`)}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
                >
                  {t.name}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => onNavigate('/docx-editor')}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
              >
                Word DOCX Editor
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/change-image-background')}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
              >
                Image Background Remover
              </button>
            </li>
          </ul>
        </div>

        {/* Convert Tools */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            Convert Files
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => onNavigate('/convert')}
                className="text-rose-600 dark:text-rose-400 font-semibold hover:underline transition-colors text-left flex items-center gap-1"
              >
                <span>⚡ Universal Converter</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/all-conversions')}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
              >
                All 40+ Conversions Directory
              </button>
            </li>
            {convertTools.slice(0, 5).map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => onNavigate(`/${t.slug}`)}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
                >
                  {t.name}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => onNavigate('/pdf-ocr')}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
              >
                Hindi & English OCR
              </button>
            </li>
          </ul>
        </div>

        {/* Platform & Guides */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
            Guides & Legal
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => onNavigate('/blog')}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
              >
                PDF Guides & Blog
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/seo-deployment-guide')}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left font-medium text-rose-600 dark:text-rose-400"
              >
                Vercel & GSC Setup Guide
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/privacy')}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/terms')}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
              >
                Terms of Service
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/about')}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
              >
                About SkPDF
              </button>
            </li>
            <li>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left inline-block"
              >
                XML Sitemap
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar with Zero-Pill metadata */}
      <div className="border-t border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>© 2026 SkPDF Technologies Inc.</span>
            <span aria-hidden="true">·</span>
            <span>All rights reserved</span>
            <span aria-hidden="true">·</span>
            <span>ISO/IEC 27001 Document Standard Compliant</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('/privacy')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy
            </button>
            <button onClick={() => onNavigate('/terms')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms
            </button>
            <button onClick={() => onNavigate('/contact')} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
