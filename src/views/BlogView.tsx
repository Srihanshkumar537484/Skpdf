import React, { useState } from 'react';
import { BLOG_POSTS, getBlogPostBySlug } from '../data/blogData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Calendar, Clock, User, ArrowLeft, ArrowRight, Tag, BookOpen } from 'lucide-react';

interface BlogViewProps {
  slug?: string;
  onNavigate: (path: string) => void;
}

export const BlogView: React.FC<BlogViewProps> = ({ slug, onNavigate }) => {
  const currentPost = slug ? getBlogPostBySlug(slug) : null;
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // If viewing an individual article
  if (currentPost) {
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: currentPost.title,
      description: currentPost.summary,
      author: {
        '@type': 'Person',
        name: currentPost.author.name,
        jobTitle: currentPost.author.role
      },
      datePublished: '2026-10-28',
      dateModified: '2026-10-30',
      publisher: {
        '@type': 'Organization',
        name: 'SkPDF',
        logo: {
          '@type': 'ImageObject',
          url: 'https://skpdf.com/logo.png'
        }
      }
    };

    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />

        <Breadcrumbs
          items={[
            { label: 'Blog', path: '/blog' },
            { label: currentPost.title }
          ]}
          onNavigate={onNavigate}
        />

        <button
          onClick={() => onNavigate('/blog')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Articles</span>
        </button>

        <article className="space-y-6">
          <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-6">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              {currentPost.category}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {currentPost.title}
            </h1>

            {/* Zero-Pill Author & Date metadata */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2">
              <span className="font-semibold text-slate-900 dark:text-white">{currentPost.author.name}</span>
              <span aria-hidden="true">·</span>
              <span>{currentPost.author.role}</span>
              <span aria-hidden="true">·</span>
              <span>{currentPost.date}</span>
              <span aria-hidden="true">·</span>
              <span>{currentPost.readTime}</span>
            </div>
          </div>

          {/* Article prose formatted */}
          <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-4">
            {currentPost.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('# ')) {
                return null; // Already rendered in H1
              }
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-3">
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-2">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('- ') || paragraph.startsWith('1. ')) {
                return (
                  <div key={index} className="pl-4 border-l-2 border-rose-500/30 my-2 text-xs sm:text-sm">
                    {paragraph}
                  </div>
                );
              }
              return (
                <p key={index} className="text-slate-700 dark:text-slate-300">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Tags */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Filed under:</span>
            {currentPost.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg"
              >
                #{tag}
              </span>
            ))}
          </div>
        </article>
      </div>
    );
  }

  // Blog Listing View
  const allTags = ['all', ...Array.from(new Set(BLOG_POSTS.flatMap((p) => p.tags)))];
  const filteredPosts =
    selectedTag === 'all'
      ? BLOG_POSTS
      : BLOG_POSTS.filter((p) => p.tags.includes(selectedTag));

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Knowledge Base & Tutorials</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          SkPDF Document Guides & Engineering Blog
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          In-depth tutorials on PDF text vector reconstruction, Hindi & English neural OCR, permanent redaction cryptography, and document optimization.
        </p>
      </div>

      {/* Filter tags */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
              selectedTag === tag
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-rose-500'
            }`}
          >
            {tag === 'all' ? 'All Guides' : `#${tag}`}
          </button>
        ))}
      </div>

      {/* Article Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            onClick={() => onNavigate(`/blog/${post.slug}`)}
            className="cursor-pointer border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 hover:border-rose-500 dark:hover:border-rose-500 hover:shadow-xl transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-semibold mb-3">
                <span>{post.category}</span>
                <span className="text-slate-400 font-normal">{post.readTime}</span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors leading-snug">
                {post.title}
              </h2>

              <p className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                {post.summary}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">By {post.author.name}</span>
              <span className="text-rose-600 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Read article</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
