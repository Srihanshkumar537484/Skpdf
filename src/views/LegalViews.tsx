import React, { useState } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ShieldCheck, Lock, Server, FileText, CheckCircle2, Send, Terminal, Cloud, HelpCircle } from 'lucide-react';

interface LegalViewProps {
  page: 'privacy' | 'terms' | 'about' | 'contact' | 'seo-guide';
  onNavigate: (path: string) => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ page, onNavigate }) => {
  const [contactSubmitted, setContactSubmitted] = useState(false);

  if (page === 'privacy') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs items={[{ label: 'Privacy Policy' }]} onNavigate={onNavigate} />

        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Privacy Policy & Document Safety</h1>
          <p className="text-xs text-slate-500 mt-2">Effective Date: October 30, 2026 · SkPDF Technologies Inc.</p>
        </div>

        <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm space-y-6 leading-relaxed">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200">
              <strong>Core Privacy Guarantee:</strong> SkPDF executes PDF editing, conversions, OCR, and document optimization client-side within your browser sandbox using WebAssembly. Your files are not uploaded to remote cloud storage or retained on our servers.
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Information We Do Not Collect</h2>
          <p>
            When you use SkPDF tools (such as Edit PDF, Merge PDF, Hindi & English OCR, or PDF to Word):
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>We do NOT store or inspect the contents of your uploaded documents.</li>
            <li>We do NOT train machine learning models on your documents or personal data.</li>
            <li>We do NOT sell, lease, or share document metadata with third parties.</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Temporary Memory Processing</h2>
          <p>
            All file buffers exist solely in volatile browser RAM while your active session is open. When you close or refresh the web page, the memory allocations are purged immediately by the browser garbage collector.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Cryptographic Password Security</h2>
          <p>
            When utilizing our Protect PDF or Unlock PDF features, encryption keys and passwords are processed locally. Passwords are never sent across network lines or recorded in system logs.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Analytics & Telemetry</h2>
          <p>
            We may gather aggregated, non-personally identifiable telemetry (e.g. browser platform type, total page visits) solely to optimize website loading speeds and ensure mobile responsiveness.
          </p>
        </div>
      </div>
    );
  }

  if (page === 'terms') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs items={[{ label: 'Terms of Service' }]} onNavigate={onNavigate} />

        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Terms of Service</h1>
          <p className="text-xs text-slate-500 mt-2">Last Updated: October 30, 2026</p>
        </div>

        <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm space-y-6 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the SkPDF website and services, you agree to be bound by these terms. If you disagree with any portion of these terms, please discontinue use immediately.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Permitted Use</h2>
          <p>
            You are granted a worldwide, non-exclusive license to use SkPDF for lawful personal and commercial document editing, conversion, and OCR extraction. You agree not to use the service for illegal document forgery or unauthorized copyright infringement.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Disclaimer of Warranties</h2>
          <p>
            SkPDF is provided &quot;as is&quot; without warranties of any kind. While our PDF parsing algorithms and OCR neural engines aim for maximum fidelity, users should verify legal documents prior to official submission.
          </p>
        </div>
      </div>
    );
  }

  if (page === 'about') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs items={[{ label: 'About Us' }]} onNavigate={onNavigate} />

        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">About SkPDF</h1>
          <p className="text-xs text-slate-500 mt-2">Empowering seamless, privacy-first document productivity worldwide.</p>
        </div>

        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <p>
            SkPDF was founded with a straightforward mission: eliminate the frustrating monthly paywalls and privacy concerns that plague traditional PDF software.
          </p>
          <p>
            Most legacy tools force users to upload sensitive tax forms, legal contracts, and medical records to unverified cloud servers just to perform simple edits or mergers. SkPDF is built on client-side WebAssembly, vector extraction, and modern open-source OCR engines, enabling you to process documents at blazing speeds without compromising your privacy.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Privacy First</h3>
              <p className="text-xs text-slate-500">100% in-browser processing with zero server document storage.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Hindi + English OCR</h3>
              <p className="text-xs text-slate-500">Specialized neural recognition for Devanagari and Latin scripts.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Companion Mobile App</h3>
              <p className="text-xs text-slate-500">A dedicated Android companion application exists separately for mobile workflows.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'contact') {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs items={[{ label: 'Contact Us' }]} onNavigate={onNavigate} />

        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Contact SkPDF Support</h1>
          <p className="text-xs text-slate-500 mt-2">Have a question, feedback, or enterprise inquiry? We respond within 24 hours.</p>
        </div>

        {contactSubmitted ? (
          <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Message Dispatched Successfully</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Thank you for reaching out to the SkPDF team. An engineer will follow up via email shortly.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setContactSubmitted(true);
            }}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm"
          >
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Your Full Name</label>
              <input
                required
                type="text"
                placeholder="John Doe"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
              <input
                required
                type="email"
                placeholder="john@example.com"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Subject / Inquiry Type</label>
              <select className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-rose-500">
                <option>Technical Question & PDF Processing</option>
                <option>Hindi OCR Model Feedback</option>
                <option>Feature Request</option>
                <option>Partnership & API</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Message</label>
              <textarea
                required
                rows={4}
                placeholder="Describe your inquiry or document question..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-rose-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </div>
    );
  }

  // SEO & Vercel Deployment Guide
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Vercel Deployment & SEO Setup Guide' }]} onNavigate={onNavigate} />

      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Vercel Deployment & Google Search Console Guide</h1>
        <p className="text-xs text-slate-500 mt-2">Production Deployment Manual for SkPDF Platform</p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <Terminal className="w-4 h-4" />
            <span>Vercel 1-Click Deployment Configuration</span>
          </div>
          <p className="text-slate-300 font-sans">
            SkPDF is engineered with client-side WebAssembly execution so the entire website deploys directly to Vercel without requiring complex heavyweight backend servers.
          </p>
          <pre className="bg-slate-950 p-3 rounded-lg overflow-x-auto text-[11px] text-emerald-400">
{`# 1. Push code to your GitHub Repository
git add .
git commit -m "Deploy SkPDF platform"
git push origin main

# 2. Deploy to Vercel
vercel --prod`}
          </pre>
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Google Search Console Verification & Sitemap Submission</h2>
        <ol className="list-decimal pl-5 space-y-2 text-xs">
          <li>
            <strong>Add Property:</strong> Go to <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-rose-600 underline">Google Search Console</a> and add <code>https://skpdf.com</code> (or your custom domain).
          </li>
          <li>
            <strong>Verify Ownership:</strong> Use HTML tag verification or DNS TXT record with your domain registrar.
          </li>
          <li>
            <strong>Submit XML Sitemap:</strong> Under the &quot;Sitemaps&quot; tab in the left sidebar, enter <code>sitemap.xml</code> (which maps to <code>https://skpdf.com/sitemap.xml</code>) and click Submit.
          </li>
          <li>
            <strong>Index Status:</strong> Google crawlers will discover all 18+ high-intent tool landing pages, Schema.org WebApplication markup, and educational blog tutorials.
          </li>
        </ol>
      </div>
    </div>
  );
};
