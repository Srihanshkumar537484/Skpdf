# SkPDF – All-in-One Online PDF Editor, Converter, OCR & Document Tools Platform

SkPDF is a high-performance, privacy-first web platform for editing existing PDF text, converting document formats (PDF to Word DOCX, Word to PDF, Images to PDF, PDF to Images), running multi-language neural OCR (English & Devanagari Hindi), compressing PDF files, permanent cryptographic redaction, and editing documents without server storage.

---

## 🚀 Key Features

### 1. Advanced Existing-Text PDF Editor
- **Direct in-browser text editing**: Double-click existing text spans to edit words or replace sentences while preserving layout and font sizing.
- **Electronic Signatures**: Draw freehand digital signatures or type signatures with handwritten script.
- **Visual Annotations & Shapes**: Draw rectangles, arrows, callouts, and translucent yellow highlights.
- **Watermarking**: Stamp text watermarks with custom rotation angle and opacity.

### 2. Bilingual Neural OCR (English & Hindi Devanagari)
- **Tesseract.js Engine**: High-accuracy recognition for both Latin scripts and Devanagari script (complex conjunct ligatures, Shirorekha, matras).
- **Dual-language mode**: Support for bilingual English + Hindi mixed documents.
- **Export directly to Word DOCX**: Exports recognized text with preserved paragraphs and headings into a genuine Microsoft Word (.docx) file.

### 3. File Conversions (Real Formats, Not Extensions)
- **PDF to Word (DOCX)**: Synthesizes genuine OpenXML `.docx` files using the `docx` library.
- **Word (DOCX) to PDF**: Parses `.docx` files using `mammoth` and renders vector-aligned PDF documents.
- **Images to PDF**: Compiles multi-image uploads (JPG, PNG, WebP) with adjustable margins and orientation (Portrait/Landscape).
- **PDF to JPG / PNG / WebP**: Extracts high-DPI canvas renderings; download individual pages or batch download in a ZIP archive.

### 4. PDF Organization & Manipulation
- **Merge PDF**: Lossless multi-file combiner with drag-and-drop reordering.
- **Split PDF**: Extract custom ranges (e.g., `1-3, 5, 8`) or split all pages into separate PDFs in a single ZIP.
- **Organize & Rotate**: Visual grid of all pages with rotate 90°, delete, duplicate, and reorder.
- **Compress PDF**: Fine-tuned presets (Extreme, Recommended, High Quality) with side-by-side original vs. optimized size comparison.

### 5. Security & Redaction
- **Permanent Cryptographic Redaction**: Burns blackout boxes into the PDF drawing layer and strips underlying vector text so sensitive data cannot be highlighted or extracted.
- **Password Protect & Unlock**: AES encryption for user and owner passwords, plus authorized restriction removal.
- **Metadata Sanitizer**: Inspect, edit, or wipe Title, Author, Subject, Keywords, and Producer tags.

### 6. Image Background Remover & Word Editor
- **Smart Image Background Removal**: Browser canvas color keying with tolerance and edge feathering.
- **Backdrop Replacer**: Transparent PNG, solid color, modern gradient, or custom background image.
- **DOCX Viewer & Editor**: WYSIWYG editor with headings, tables, bold, italic, and lists.

---

## 🌐 Advanced SEO & Search Engine Optimization

- **Technical SEO**:
  - `public/robots.txt` and `public/sitemap.xml` configured for all 18+ high-intent routes.
  - Dynamic canonical URL updates and Open Graph / Twitter Card social metadata.
  - Schema.org structured data embedded:
    - `WebApplication` & `Organization`
    - `FAQPage` on all tool pages and home
    - `Article` markup on all knowledge base blog guides
    - `BreadcrumbList` hierarchy microdata
- **Content SEO**:
  - Full educational blog with 4 in-depth guides covering PDF text editing, Hindi OCR, redaction security, and stream compression.

---

## 🛠️ Vercel Deployment Guide

SkPDF is built with a client-side WebAssembly architecture, making it lightweight and 100% deployable on Vercel without exceeding serverless execution limits.

### Step 1: Deploy to Vercel
```bash
# Push to GitHub
git add .
git commit -m "Deploy SkPDF"
git push origin main

# Deploy using Vercel CLI (or connect GitHub repo in Vercel dashboard)
vercel --prod
```

### Step 2: Configure Custom Domain & HTTPS
1. In Vercel Project Settings -> **Domains**, add `skpdf.com` (or your domain).
2. Configure DNS A record `@` pointing to `76.76.21.21` and CNAME `www` to `cname.vercel-dns.com`.

---

## 🔍 Google Search Console Setup

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add your domain property (`https://skpdf.com`).
3. Verify via DNS TXT or HTML tag.
4. Go to **Sitemaps** -> Submit `https://skpdf.com/sitemap.xml`.
5. Monitor Core Web Vitals (LCP, INP, CLS) and indexing status.

---

## 📱 Companion Android App Note
The SkPDF Android companion application is maintained separately for mobile device workflows, while the SkPDF web application provides complete desktop, tablet, and cross-platform browser support.
