import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { HomeView } from './views/HomeView';
import { ToolView } from './views/ToolView';
import { BlogView } from './views/BlogView';
import { LegalView } from './views/LegalViews';
import { getToolBySlug } from './data/toolsData';
import { getBlogPostBySlug } from './data/blogData';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  // Dynamically update document title and meta description based on route for SEO
  useEffect(() => {
    const cleanPath = currentPath.replace(/^\//, '');

    if (!cleanPath) {
      document.title = 'SkPDF – All-in-One Online PDF Editor, Converter, OCR & Document Tools';
      return;
    }

    if (cleanPath.startsWith('blog/')) {
      const blogSlug = cleanPath.replace('blog/', '');
      const post = getBlogPostBySlug(blogSlug);
      if (post) {
        document.title = `${post.title} | SkPDF Blog`;
        return;
      }
    }

    if (cleanPath === 'blog') {
      document.title = 'SkPDF Guides & Engineering Blog – PDF Tutorials & OCR Insights';
      return;
    }

    if (cleanPath === 'privacy') {
      document.title = 'Privacy Policy – Zero Cloud Storage Guarantee | SkPDF';
      return;
    }
    if (cleanPath === 'terms') {
      document.title = 'Terms of Service | SkPDF';
      return;
    }
    if (cleanPath === 'about') {
      document.title = 'About SkPDF – The Modern Privacy-First Document Platform';
      return;
    }
    if (cleanPath === 'contact') {
      document.title = 'Contact SkPDF Support & Inquiries';
      return;
    }
    if (cleanPath === 'seo-deployment-guide') {
      document.title = 'Vercel Deployment & SEO Setup Guide | SkPDF';
      return;
    }

    // Check if it's a tool route
    const tool = getToolBySlug(cleanPath);
    if (tool) {
      document.title = tool.seoTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', tool.metaDescription);
      }
    }
  }, [currentPath]);

  // Route dispatcher
  const renderCurrentView = () => {
    const cleanPath = currentPath.replace(/^\//, '');

    if (!cleanPath) {
      return <HomeView onNavigate={navigateTo} onOpenSearch={() => setIsSearchOpen(true)} />;
    }

    if (cleanPath.startsWith('blog/')) {
      const blogSlug = cleanPath.replace('blog/', '');
      return <BlogView slug={blogSlug} onNavigate={navigateTo} />;
    }

    if (cleanPath === 'blog') {
      return <BlogView onNavigate={navigateTo} />;
    }

    if (['privacy', 'terms', 'about', 'contact', 'seo-deployment-guide'].includes(cleanPath)) {
      return <LegalView page={cleanPath as any} onNavigate={navigateTo} />;
    }

    // Default to tool view
    return <ToolView slug={cleanPath} onNavigate={navigateTo} />;
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
