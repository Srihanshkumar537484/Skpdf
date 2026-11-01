import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { HomeView } from './views/HomeView';
import { ToolView } from './views/ToolView';
import { BlogView } from './views/BlogView';
import { LegalView } from './views/LegalViews';
import { NotFoundView } from './views/NotFoundView';
import { UniversalConverterView } from './views/UniversalConverterView';
import { AllConversionsView } from './views/AllConversionsView';
import { getToolBySlug } from './data/toolsData';
import { getBlogPostBySlug } from './data/blogData';
import { initGA, trackPageView } from './utils/analytics';

const BASE_URL = 'https://skpdf-mr7m.vercel.app';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Initialize privacy-friendly Google Analytics 4 (if configured)
  useEffect(() => {
    initGA();
  }, []);

  // Sync route on popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Dynamically update document title, canonical link, OG tags, and track pageview for SEO
  useEffect(() => {
    const cleanPath = currentPath.replace(/^\//, '');
    let pageTitle = 'SkPDF – All-in-One Online PDF Editor, Converter, OCR & Document Tools';
    let metaDescription = 'Free, secure online PDF editor, converter, OCR, merger, and document tools. Edit existing text, convert PDF to Word, perform Hindi & English OCR, and compress documents.';
    const canonicalUrl = `${BASE_URL}${currentPath === '/' ? '' : currentPath}`;

    if (!cleanPath) {
      pageTitle = 'SkPDF – All-in-One Online PDF Editor, Converter, OCR & Document Tools';
      metaDescription = 'Free, secure online PDF editor, converter, OCR, merger, and document tools. Edit existing text, convert PDF to Word, perform Hindi & English OCR, and compress documents.';
    } else if (cleanPath === 'convert') {
      pageTitle = 'Universal File Converter – Convert Images, Spreadsheets, Word & Data | SkPDF';
      metaDescription = 'Free client-side universal file converter. Convert between JPG, PNG, WebP, Excel XLSX, Word DOCX, CSV, PDF, and JSON securely in your browser.';
    } else if (cleanPath === 'all-conversions') {
      pageTitle = 'All File Conversions Directory – 40+ Format Pairs | SkPDF';
      metaDescription = 'Browse 40+ verified client-side file conversion tools across Images, Spreadsheets, Documents, Data formats, and Archives on SkPDF.';
    } else if (cleanPath.startsWith('blog/')) {
      const blogSlug = cleanPath.replace('blog/', '');
      const post = getBlogPostBySlug(blogSlug);
      if (post) {
        pageTitle = `${post.title} | SkPDF Blog`;
        metaDescription = post.summary;
      } else {
        pageTitle = 'Article Not Found | SkPDF Blog';
        metaDescription = 'The requested blog article could not be found.';
      }
    } else if (cleanPath === 'blog') {
      pageTitle = 'SkPDF Guides & Engineering Blog – PDF Tutorials & OCR Insights';
      metaDescription = 'In-depth engineering tutorials on PDF text vector reconstruction, Hindi & English neural OCR, permanent redaction cryptography, and document optimization.';
    } else if (cleanPath === 'privacy') {
      pageTitle = 'Privacy Policy – Zero Cloud Storage Guarantee | SkPDF';
      metaDescription = 'SkPDF processes documents client-side in your browser with zero remote cloud retention. Read our complete privacy and document safety policy.';
    } else if (cleanPath === 'terms') {
      pageTitle = 'Terms of Service | SkPDF';
      metaDescription = 'Terms and conditions for using SkPDF web application and document processing tools.';
    } else if (cleanPath === 'about') {
      pageTitle = 'About SkPDF – The Modern Privacy-First Document Platform';
      metaDescription = 'Learn how SkPDF eliminates paywalls and privacy risks by processing documents with modern WebAssembly and open-source neural OCR.';
    } else if (cleanPath === 'contact') {
      pageTitle = 'Contact SkPDF Support & Inquiries';
      metaDescription = 'Get in touch with the SkPDF engineering and support team for technical inquiries, feature suggestions, or business partnerships.';
    } else if (cleanPath === 'seo-deployment-guide') {
      pageTitle = 'Vercel Deployment & SEO Setup Guide | SkPDF';
      metaDescription = 'Production deployment guide for SkPDF on Vercel and Google Search Console indexing checklist.';
    } else {
      const tool = getToolBySlug(cleanPath);
      if (tool) {
        pageTitle = tool.seoTitle;
        metaDescription = tool.metaDescription;
      } else {
        pageTitle = '404 - Page Not Found | SkPDF';
        metaDescription = 'The requested document tool or page could not be found on SkPDF.';
      }
    }

    // 1. Update Document Title
    document.title = pageTitle;

    // 2. Update Meta Description
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', metaDescription);

    // 3. Update Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 4. Update OpenGraph Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', metaDescription);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);

    // 5. Update Twitter Card Tags
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', pageTitle);

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', metaDescription);

    // 6. Record Pageview in Analytics
    trackPageView(currentPath, pageTitle);
  }, [currentPath]);

  // Route dispatcher
  const renderCurrentView = () => {
    const cleanPath = currentPath.replace(/^\//, '');

    if (!cleanPath) {
      return <HomeView onNavigate={navigateTo} onOpenSearch={() => setIsSearchOpen(true)} />;
    }

    if (cleanPath === 'convert') {
      return <UniversalConverterView onNavigate={navigateTo} />;
    }

    if (cleanPath === 'all-conversions') {
      return <AllConversionsView onNavigate={navigateTo} />;
    }

    if (cleanPath.startsWith('blog/')) {
      const blogSlug = cleanPath.replace('blog/', '');
      const post = getBlogPostBySlug(blogSlug);
      if (!post) {
        return <NotFoundView onNavigate={navigateTo} />;
      }
      return <BlogView slug={blogSlug} onNavigate={navigateTo} />;
    }

    if (cleanPath === 'blog') {
      return <BlogView onNavigate={navigateTo} />;
    }

    if (['privacy', 'terms', 'about', 'contact', 'seo-deployment-guide'].includes(cleanPath)) {
      return <LegalView page={cleanPath as any} onNavigate={navigateTo} />;
    }

    // Check if valid tool route
    const tool = getToolBySlug(cleanPath);
    if (tool) {
      return <ToolView slug={cleanPath} onNavigate={navigateTo} />;
    }

    // Unmatched route -> Render dedicated 404
    return <NotFoundView onNavigate={navigateTo} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        currentPath={currentPath}
        onNavigate={navigateTo}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <main className="flex-1">
        {renderCurrentView()}
      </main>

      <Footer onNavigate={navigateTo} />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={(slug) => navigateTo(`/${slug}`)}
      />
    </div>
  );
}
