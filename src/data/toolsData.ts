import { PDFTool, ToolCategory } from '../types';

export const TOOLS: PDFTool[] = [
  // --- AI PDF TOOLS ---
  {
    id: 'ai-pdf-assistant',
    slug: 'ai-pdf-assistant',
    name: 'AI PDF Assistant (Summarize & Chat)',
    shortDescription: 'Chat with documents, generate executive summaries, and translate between English and Hindi using Gemini 3.8 Flash.',
    category: 'ai',
    popular: true,
    badge: 'Gemini AI',
    seoTitle: 'AI PDF Assistant – Summarize & Chat with PDF Documents | SkPDF',
    metaDescription: 'Ask questions to your PDF, generate bulleted executive summaries, translate between English & Hindi, and rewrite clauses using Gemini 3.8 Flash AI.',
    h1: 'AI PDF Assistant – Chat with Documents & Summarize',
    keywords: ['ai pdf', 'chat with pdf', 'ai pdf summarizer', 'ask pdf', 'gemini pdf', 'summarize pdf online free'],
    features: [
      'Interactive Chat: Ask any question about contracts, reports, or research papers',
      'Instant Executive Summaries with bullet points and action items',
      'Bilingual Translation: Accurate translation between English and Hindi',
      'Clause Rewriting: Proofread and convert text into professional business tone',
      'Powered by high-throughput Gemini 3.8 Flash'
    ],
    howToSteps: [
      'Upload your PDF document into the drop zone.',
      'Select "AI Summary" for an instant overview or "Chat with PDF" to ask questions.',
      'Ask specific questions or select pre-made analysis prompts.',
      'Copy the generated insights or export formatted answers.'
    ],
    faqs: [
      {
        question: 'How does the AI analyze my PDF document?',
        answer: 'SkPDF extracts page text and analyzes it securely using Google Gemini 3.8 Flash to synthesize summaries and answer specific questions strictly based on the provided document text.'
      },
      {
        question: 'Can I chat in Hindi or ask for Hindi summaries?',
        answer: 'Yes! You can toggle between English and Hindi for both document summarization and interactive questions.'
      }
    ],
    acceptedFileTypes: '.pdf'
  },
  // --- PDF EDITING ---
  {
    id: 'edit-pdf',
    slug: 'edit-pdf',
    name: 'Edit PDF',
    shortDescription: 'Click and edit existing text, add annotations, signatures, shapes, and images.',
    category: 'edit',
    popular: true,
    badge: 'Popular',
    seoTitle: 'Free Online PDF Editor – Edit Existing Text & Add Content | SkPDF',
    metaDescription: 'Edit PDF text directly in your browser. Click to edit words, replace sentences, add annotations, draw signatures, insert shapes, and modify page backgrounds.',
    h1: 'Online PDF Editor – Edit Existing Text & Documents',
    keywords: ['edit pdf', 'edit existing pdf text', 'pdf editor online', 'free pdf editor', 'change text in pdf'],
    features: [
      'Direct in-browser editing of existing PDF text blocks',
      'Replace words and sentences while preserving position and layout',
      'Add custom text, change font sizes, colors, and alignments',
      'Draw freehand or type electronic signatures',
      'Add geometric shapes (rectangles, circles, arrows, highlights)',
      'Add custom watermarks with adjustable opacity and angles'
    ],
    howToSteps: [
      'Upload your PDF file using the drop zone or browse button.',
      'Click on any existing text span to edit words or select tools from the top bar.',
      'Add signatures, shapes, or watermark annotations as needed.',
      'Click "Export & Download PDF" to save your edited file instantly.'
    ],
    faqs: [
      {
        question: 'Can I really edit existing words in my PDF with SkPDF?',
        answer: 'Yes! SkPDF extracts the exact positioning, font sizes, and layout of your PDF text elements, allowing you to click on text blocks, replace or modify existing words, and compile the result cleanly.'
      },
      {
        question: 'Are my uploaded documents secure during editing?',
        answer: 'All editing operations take place client-side right inside your browser sandbox. Your files are never uploaded to foreign cloud storage or retained without your permission.'
      },
      {
        question: 'Does this editor work on scanned PDFs?',
        answer: 'For scanned or image-only documents, use our "PDF OCR" or "Scanned PDF to Word" tool first to generate high-accuracy selectable and editable text.'
      }
    ],
    acceptedFileTypes: '.pdf'
  },
  {
    id: 'merge-pdf',
    slug: 'merge-pdf',
    name: 'Merge PDF',
    shortDescription: 'Combine multiple PDF files into a single unified document in seconds.',
    category: 'organize',
    popular: true,
    badge: 'Most Used',
    seoTitle: 'Merge PDF Files Online – Combine PDFs for Free | SkPDF',
    metaDescription: 'Combine multiple PDF files into one single document. Reorder pages, rotate documents, and merge PDF files in seconds with SkPDF.',
    h1: 'Merge Multiple PDF Files Online',
    keywords: ['merge pdf', 'combine pdf', 'join pdf files', 'merge pdf online free', 'pdf combiner'],
    features: [
      'Drag and drop reordering of uploaded PDF documents',
      'Individual file rotation before merging',
      'Fast client-side assembly with zero file size limits',
      'Preserves original bookmarks, high-res images, and vector outlines'
    ],
    howToSteps: [
      'Select or drag-and-drop 2 or more PDF files.',
      'Rearrange documents by clicking the move arrows to set desired order.',
      'Click "Merge PDFs" to assemble into a single document.',
      'Download your consolidated PDF file immediately.'
    ],
    faqs: [
      {
        question: 'How many PDF files can I merge at once?',
        answer: 'You can merge dozens of PDF files simultaneously in your browser without artificial page or file limits.'
      },
      {
        question: 'Will merging reduce the quality of my images and vectors?',
        answer: 'No. SkPDF uses lossless stream merging, keeping your vector fonts, signatures, and photographic assets at their original resolution.'
      }
    ],
    acceptedFileTypes: '.pdf',
    multipleFiles: true
  },
  {
    id: 'split-pdf',
    slug: 'split-pdf',
    name: 'Split PDF',
    shortDescription: 'Separate one page or a whole set for easy conversion into independent PDF files.',
    category: 'organize',
    popular: true,
    seoTitle: 'Split PDF Online – Extract Pages from PDF for Free | SkPDF',
    metaDescription: 'Split a PDF into separate files. Extract page ranges (e.g. 1-5, 8-10) or split every page into a standalone PDF with SkPDF.',
    h1: 'Split PDF and Extract Pages Online',
    keywords: ['split pdf', 'extract pdf pages', 'separate pdf', 'split pdf online free'],
    features: [
      'Visual page preview grid with page numbers',
      'Split by page ranges (e.g., 1-3, 5, 8-10)',
      'Extract all pages into separate individual PDFs in a ZIP archive',
      'Instant client-side processing without server delays'
    ],
    howToSteps: [
      'Upload the PDF you wish to split.',
      'Choose between "Extract Custom Ranges" or "Split Every Page".',
      'Specify page ranges or select pages visually from the preview.',
      'Click "Split PDF" and download your target files.'
    ],
    faqs: [
      {
        question: 'Can I extract non-consecutive pages like pages 1, 4, and 7?',
        answer: 'Yes, simply enter "1, 4, 7" in the range field and SkPDF will produce a single clean PDF containing only those chosen pages.'
      }
    ],
    acceptedFileTypes: '.pdf'
  },
  {
    id: 'compress-pdf',
    slug: 'compress-pdf',
    name: 'Compress PDF',
    shortDescription: 'Reduce PDF file size while optimizing for maximal quality and fast web delivery.',
    category: 'organize',
    popular: true,
    badge: 'Popular',
    seoTitle: 'Compress PDF Online – Reduce PDF File Size for Free | SkPDF',
    metaDescription: 'Compress PDF files online while maintaining high document and image quality. Choose from Extreme, Recommended, or High-Quality presets.',
    h1: 'Compress PDF Documents Online',
    keywords: ['compress pdf', 'reduce pdf size', 'shrink pdf', 'pdf compressor online free'],
    features: [
      'Three fine-tuned compression presets (Extreme, Recommended, High Quality)',
      'Smart image stream re-encoding and vector stream consolidation',
      'Side-by-side original vs. compressed file size comparison metrics',
      'Preserves text clarity, hyperlinks, and document structure'
    ],
    howToSteps: [
      'Upload your large PDF file.',
      'Select your preferred compression level (Recommended yields 60-80% savings).',
      'Click "Compress PDF" to run stream optimization.',
      'Review your exact space savings and download the optimized PDF.'
    ],
    faqs: [
      {
        question: 'Does compressing a PDF make the text blurry?',
        answer: 'No. Vector fonts and typographic paths remain infinitely sharp. Compression specifically optimizes embedded raster photography and strips redundant metadata.'
      }
    ],
    acceptedFileTypes: '.pdf'
  },
  {
    id: 'pdf-to-word',
    slug: 'pdf-to-word',
    name: 'PDF to Word',
    shortDescription: 'Convert your PDF files to editable Microsoft Word DOCX documents.',
    category: 'convert-from',
    popular: true,
    badge: 'Top Converter',
    seoTitle: 'PDF to Word Converter – Convert PDF to DOCX Online | SkPDF',
    metaDescription: 'Convert PDF to Word DOCX documents with preserved formatting, headings, paragraphs, and tables. 100% free and editable in Microsoft Word.',
    h1: 'Convert PDF to Editable Word (DOCX)',
    keywords: ['pdf to word', 'convert pdf to docx', 'pdf to word converter free', 'pdf to word editable'],
    features: [
      'Generates genuine Microsoft Word (.docx) files',
      'Preserves paragraphs, bullet points, font weights, and spacing',
      'Extracts embedded tables into genuine Word table grids',
      'Fully editable in Microsoft Word, Google Docs, and LibreOffice'
    ],
    howToSteps: [
      'Upload your PDF document.',
      'Click "Convert to Word DOCX".',
      'Wait for paragraph extraction and document synthesis.',
      'Download your fully editable DOCX document.'
    ],
    faqs: [
      {
        question: 'Is the downloaded Word document fully editable?',
        answer: 'Yes! It generates standard OpenXML (.docx) paragraphs, runs, and tables that you can edit immediately in Microsoft Word or Google Docs.'
      }
    ],
    acceptedFileTypes: '.pdf'
  },
  {
    id: 'word-to-pdf',
    slug: 'word-to-pdf',
    name: 'Word to PDF',
    shortDescription: 'Convert Microsoft Word DOCX documents into clean, professional PDF files.',
    category: 'convert-to',
    popular: true,
    seoTitle: 'Word to PDF Converter – Convert DOCX to PDF Online | SkPDF',
    metaDescription: 'Convert DOCX Word documents to PDF files quickly and accurately. Preserves styles, typography, and page formatting.',
    h1: 'Convert Word Documents (DOCX) to PDF',
    keywords: ['word to pdf', 'convert docx to pdf', 'word to pdf online free', 'doc to pdf'],
    features: [
      'Fast parsing of Microsoft Word DOCX files',
      'Preserves headings, bold/italic stylings, lists, and tables',
      'Generates standard ISO-compliant PDF documents',
      'Perfect for resumes, contracts, agreements, and official paperwork'
    ],
    howToSteps: [
      'Upload your Microsoft Word (.docx) file.',
      'Review document preview and configuration.',
      'Click "Convert to PDF".',
      'Download your crisp, print-ready PDF file.'
    ],
    faqs: [
      {
        question: 'Are my headers, footers, and margins preserved?',
        answer: 'Yes, SkPDF accurately translates document margins, typography hierarchy, and paragraph breaks into the resulting PDF.'
      }
    ],
    acceptedFileTypes: '.docx'
  },
  {
    id: 'pdf-ocr',
    slug: 'pdf-ocr',
    name: 'PDF OCR (English & Hindi)',
    shortDescription: 'Extract text from scanned PDFs & images with English and Hindi OCR engines.',
    category: 'ocr',
    popular: true,
    badge: 'Hindi + English',
    seoTitle: 'PDF OCR Online – Scanned PDF to Text with Hindi & English OCR | SkPDF',
    metaDescription: 'Run high-accuracy optical character recognition (OCR) on scanned PDFs and images. Supports English, Hindi (Devanagari), and bilingual documents.',
    h1: 'PDF OCR – Extract Text from Scanned Documents',
    keywords: ['pdf ocr', 'scanned pdf to text', 'hindi ocr online', 'hindi pdf ocr', 'english hindi ocr', 'tesseract pdf ocr'],
    features: [
      'High-precision neural OCR using Tesseract engine',
      'Dedicated support for Hindi (Devanagari script), English, and bilingual documents',
      'Confidence score metrics per paragraph and word',
      'Export directly to Searchable Text (.txt), Word (.docx), or Clipboard',
      'Visual bounding-box overlay showing recognized text coordinates'
    ],
    howToSteps: [
      'Upload a scanned PDF or document image (JPG, PNG).',
      'Select recognition language: English, Hindi, or English + Hindi.',
      'Click "Run OCR Recognition".',
      'Review detected text with confidence scores and export as TXT or Word DOCX.'
    ],
    faqs: [
      {
        question: 'Does SkPDF support Hindi (Devanagari) font recognition?',
        answer: 'Yes! SkPDF is specifically configured with Hindi language neural models that accurately detect Devanagari script, conjuncts, matras, and bilingual Hindi-English text.'
      },
      {
        question: 'Can I export the scanned text directly to Microsoft Word?',
        answer: 'Yes, with one click you can export the recognized text into a formatted .docx file with proper line breaks and paragraph spacing.'
      }
    ],
    acceptedFileTypes: '.pdf,image/*'
  },
  {
    id: 'scanned-pdf-to-word',
    slug: 'scanned-pdf-to-word',
    name: 'Scanned PDF to Word',
    shortDescription: 'Transform non-selectable scanned documents directly into editable Word files.',
    category: 'ocr',
    seoTitle: 'Scanned PDF to Word Online – Convert Scanned Documents to DOCX | SkPDF',
    metaDescription: 'Convert scanned image-based PDFs into fully editable Microsoft Word documents using automated OCR technology.',
    h1: 'Convert Scanned PDFs to Editable Word DOCX',
    keywords: ['scanned pdf to word', 'convert scanned pdf to docx', 'ocr pdf to word free'],
    features: [
      'Automatic page image extraction and multi-column OCR',
      'Reconstructs editable paragraphs directly inside DOCX format',
      'Eliminates the need to manually retype scanned contracts or old printouts'
    ],
    howToSteps: [
      'Upload your scanned PDF document.',
      'Choose OCR language preference (English or English + Hindi).',
      'Click "Convert Scanned PDF to Word".',
      'Download your editable Microsoft Word file.'
    ],
    faqs: [
      {
        question: 'What image quality is recommended for best results?',
        answer: 'Documents scanned at 200 DPI or higher with clear contrast deliver over 98% OCR accuracy.'
      }
    ],
    acceptedFileTypes: '.pdf'
  },
  {
    id: 'pdf-to-jpg',
    slug: 'pdf-to-jpg',
    name: 'PDF to JPG / PNG',
    shortDescription: 'Convert PDF pages into high-resolution JPG or PNG images or download as ZIP.',
    category: 'convert-from',
    popular: true,
    seoTitle: 'PDF to JPG Converter – Convert PDF Pages to Images Online | SkPDF',
    metaDescription: 'Convert each PDF page into high-resolution JPG, PNG, or WebP images. Download individual pages or download all pages in a single ZIP file.',
    h1: 'Convert PDF Pages to JPG & PNG Images',
    keywords: ['pdf to jpg', 'pdf to image', 'convert pdf to png', 'pdf to jpg converter free'],
    features: [
      'High-DPI rendering (up to 300 DPI equivalent) for razor-sharp images',
      'Supports JPG, PNG (lossless with transparent backgrounds), and WebP formats',
      'Batch download all pages together in a compressed ZIP archive',
      'Selective page download with instant visual previews'
    ],
    howToSteps: [
      'Upload your PDF document.',
      'Choose your preferred image format (JPG, PNG, or WebP) and quality setting.',
      'Click "Convert Pages to Images".',
      'Download specific pages individually or grab the entire ZIP archive.'
    ],
    faqs: [
      {
        question: 'Can I extract high-resolution 300 DPI images?',
        answer: 'Yes, SkPDF renders PDF vector coordinates onto high-density canvas buffers, providing print-quality imagery.'
      }
    ],
    acceptedFileTypes: '.pdf'
  },
  {
    id: 'jpg-to-pdf',
    slug: 'jpg-to-pdf',
    name: 'JPG / Images to PDF',
    shortDescription: 'Convert JPG, PNG, and WebP images into a single professional PDF document.',
    category: 'convert-to',
    popular: true,
    seoTitle: 'JPG to PDF Converter – Convert Images to PDF Online | SkPDF',
    metaDescription: 'Convert JPG, PNG, GIF, and WebP images into a clean PDF document. Reorder images, customize margins, and pick page orientation.',
    h1: 'Convert Images (JPG, PNG, WebP) to PDF',
    keywords: ['jpg to pdf', 'image to pdf', 'png to pdf', 'convert multiple images to pdf'],
    features: [
      'Combine multiple image files into one single PDF',
      'Adjustable page orientation (Portrait, Landscape, or Auto)',
      'Custom margin settings (None, Small, Large)',
      'Drag-and-drop image reordering'
    ],
    howToSteps: [
      'Upload one or more image files (JPG, PNG, WebP).',
      'Reorder images and customize page orientation and margins.',
      'Click "Generate PDF Document".',
      'Download your clean PDF file.'
    ],
    faqs: [
      {
        question: 'Can I merge photos taken on my smartphone into one PDF?',
        answer: 'Yes! You can upload photos taken on iPhone or Android, reorder them, and produce an organized PDF document.'
      }
    ],
    acceptedFileTypes: 'image/*',
    multipleFiles: true
  },
  {
    id: 'organize-pdf',
    slug: 'organize-pdf',
    name: 'Organize & Rearrange PDF',
    shortDescription: 'Rotate, reorder, duplicate, delete, and insert blank pages visually.',
    category: 'organize',
    seoTitle: 'Organize PDF Pages – Reorder, Rotate & Delete Pages Online | SkPDF',
    metaDescription: 'Reorder PDF pages visually with drag-and-drop. Rotate individual pages, delete unwanted pages, duplicate pages, and insert blank sheets.',
    h1: 'Organize, Reorder & Rotate PDF Pages',
    keywords: ['organize pdf', 'reorder pdf pages', 'rotate pdf', 'delete pages from pdf', 'rearrange pdf'],
    features: [
      'Interactive visual thumbnail grid showing every page',
      'Rotate individual or all pages 90°, 180°, or 270°',
      'Drag-and-drop or one-click page reordering',
      'Delete unwanted pages with instant preview',
      'Duplicate pages or insert clean blank pages anywhere'
    ],
    howToSteps: [
      'Upload the PDF you want to organize.',
      'Drag page cards or use directional buttons to reorder.',
      'Use rotate or delete buttons on individual page thumbnails.',
      'Click "Save Organized PDF" and download.'
    ],
    faqs: [
      {
        question: 'Can I rotate just one upside-down page without rotating the whole PDF?',
        answer: 'Yes, each page thumbnail has its own rotate button, so you can rotate single pages individually.'
      }
    ],
    acceptedFileTypes: '.pdf'
  },
  {
    id: 'protect-pdf',
    slug: 'protect-pdf',
    name: 'Protect PDF (Add Password)',
    shortDescription: 'Encrypt your PDF with standard password protection and permission locks.',
    category: 'security',
    seoTitle: 'Protect PDF – Add Password to PDF Online | SkPDF',
    metaDescription: 'Add strong password protection and AES encryption to your PDF documents. Prevent unauthorized viewing, copying, and printing.',
    h1: 'Protect PDF with Password & Encryption',
    keywords: ['protect pdf', 'encrypt pdf', 'add password to pdf', 'password protect pdf online'],
    features: [
      'Industry-standard PDF encryption algorithm',
      'User password (required to open and read document)',
      'Owner password (controls printing and content copying permissions)',
      'Zero storage: your password and document stay private in your browser'
    ],
    howToSteps: [
      'Upload the PDF you want to password protect.',
      'Enter and confirm your chosen password.',
      'Click "Protect PDF Document".',
      'Download your encrypted PDF file.'
    ],
    faqs: [
      {
        question: 'Does SkPDF store my password or decrypted document?',
        answer: 'Never. Encryption occurs client-side in your browser. We never log or store your passwords or files.'
      }
    ],
    acceptedFileTypes: '.pdf'
  },
  {
    id: 'unlock-pdf',
    slug: 'unlock-pdf',
    name: 'Unlock PDF',
    shortDescription: 'Remove password and restrictions from protected PDF documents.',
    category: 'security',
    seoTitle: 'Unlock PDF – Remove PDF Password Online | SkPDF',
    metaDescription: 'Remove password protection and printing restrictions from your PDF files with authorization.',
    h1: 'Unlock Password-Protected PDF Files',
    keywords: ['unlock pdf', 'remove password from pdf', 'decrypt pdf', 'pdf password remover'],
    features: [
      'Authorized decryption and restriction removal',
      'Produces a clean, unlocked PDF suitable for editing and sharing',
      'Fast client-side unlocking'
    ],
    howToSteps: [
      'Upload your password-protected PDF.',
      'Enter the correct authorization password.',
      'Click "Unlock & Decrypt PDF".',
      'Download your unlocked PDF file.'
    ],
    faqs: [
      {
        question: 'Can I unlock a PDF without knowing the password?',
        answer: 'No. Modern PDF encryption requires the legitimate password for decryption. SkPDF helps you remove the password permanently once authenticated.'
      }
    ],
    acceptedFileTypes: '.pdf'
  },
  {
    id: 'redact-pdf',
    slug: 'redact-pdf',
    name: 'Permanent PDF Redaction',
    shortDescription: 'Permanently remove and blackout sensitive text and data from your documents.',
    category: 'security',
    seoTitle: 'Redact PDF Online – Permanently Blackout Sensitive Text | SkPDF',
    metaDescription: 'Permanently redact sensitive text, social security numbers, and private info from PDF documents. Removes underlying vector data.',
    h1: 'Permanently Redact Sensitive PDF Information',
    keywords: ['redact pdf', 'blackout pdf text', 'pdf redaction tool', 'remove sensitive info from pdf'],
    features: [
      'Draw opaque blackout redaction boxes over sensitive text or images',
      'True redaction: burns boxes into the rendered stream and strips underlying text vectors',
      'Prevents text copying, searching, or extraction of redacted content'
    ],
    howToSteps: [
      'Upload the PDF containing sensitive information.',
      'Use the redaction tool to draw blackout boxes over private text or data.',
      'Click "Apply Permanent Redaction".',
      'Download your securely sanitized PDF.'
    ],
    faqs: [
      {
        question: 'Is this a real redaction or just a black box drawn on top?',
        answer: 'SkPDF performs true permanent redaction by rasterizing the redacted zones into flattened non-extractable pixels, ensuring nobody can highlight or copy text underneath.'
      }
    ],
    acceptedFileTypes: '.pdf'
  },
  {
    id: 'remove-pdf-background',
    slug: 'remove-pdf-background',
    name: 'Change / Remove PDF Background',
    shortDescription: 'Customize PDF page backgrounds with colors, images, or clean white tints.',
    category: 'image-word',
    seoTitle: 'Change PDF Page Background Online – Replace or Remove Background | SkPDF',
    metaDescription: 'Change or remove background colors and watermarks from PDF pages. Apply solid colors, brand patterns, or clean white backgrounds.',
    h1: 'Change or Remove PDF Page Backgrounds',
    keywords: ['remove pdf background', 'change pdf background', 'pdf background color', 'add background to pdf'],
    features: [
      'Change background color (Solid color, Soft tint, Dark mode theme)',
      'Apply custom background image or corporate letterhead',
      'Select target pages: First Page, All Pages, or Specific Page Range',
      'Instant live preview before downloading'
    ],
    howToSteps: [
      'Upload your PDF document.',
      'Choose background style (Solid color, Subtle tint, or Upload custom background).',
      'Select whether to apply to all pages or specific page numbers.',
      'Click "Apply Background" and download your updated PDF.'
    ],
    faqs: [
      {
        question: 'Can I apply a custom letterhead background image to every page?',
        answer: 'Yes! Simply upload your letterhead image, select "Apply to All Pages", and SkPDF inserts it as the background layer behind your text.'
      }
    ],
    acceptedFileTypes: '.pdf'
  },
  {
    id: 'change-image-background',
    slug: 'change-image-background',
    name: 'Image Background Remover & Editor',
    shortDescription: 'Remove image backgrounds, apply solid colors, gradients, or new backdrops.',
    category: 'image-word',
    seoTitle: 'Image Background Remover Online – Change Background to Color or Gradient | SkPDF',
    metaDescription: 'Remove image backgrounds instantly. Replace with solid colors, modern gradients, custom photos, or transparent PNGs. Convert directly to PDF.',
    h1: 'Remove & Change Image Backgrounds Online',
    keywords: ['image background remover', 'remove background from image', 'change photo background', 'transparent background maker'],
    features: [
      'Smart background removal with adjustable color sensitivity and edge feathering',
      'Replace background with Transparent, Solid Color, Gradient, or Custom Image',
      'Built-in image filters: Brightness, Contrast, Saturation, Crop, and Rotate',
      'Export as transparent PNG image or compile directly into a clean PDF'
    ],
    howToSteps: [
      'Upload any photo or document image (JPG, PNG, WebP).',
      'Click "Remove Background" or click on the background to sample color.',
      'Pick a replacement style: Transparent, Solid Color, Gradient, or New Photo.',
      'Download as PNG image or generate a ready-to-print PDF.'
    ],
    faqs: [
      {
        question: 'Is this tool free and does it require sign up?',
        answer: 'It is 100% free with no account required. All processing runs directly in your browser.'
      }
    ],
    acceptedFileTypes: 'image/*'
  },
  {
    id: 'docx-editor',
    slug: 'docx-editor',
    name: 'Word DOCX Viewer & Editor',
    shortDescription: 'View, edit, and create Word documents online without installing software.',
    category: 'image-word',
    seoTitle: 'Online Word DOCX Editor – View & Edit Microsoft Word Documents | SkPDF',
    metaDescription: 'Edit Microsoft Word DOCX files directly in your browser. Format text, add tables, headings, and download as DOCX or PDF.',
    h1: 'Online Word DOCX Document Editor',
    keywords: ['word editor online', 'docx editor', 'view docx online', 'edit word document online free'],
    features: [
      'Full WYSIWYG document editing for Microsoft Word (.docx) files',
      'Format headings, paragraphs, bold, italic, underline, and lists',
      'Insert tables, blockquotes, and dividers',
      'Export document as genuine Word (.docx) or download as PDF'
    ],
    howToSteps: [
      'Upload an existing DOCX file or click "Create Blank Document".',
      'Edit your text and apply desired formatting styles.',
      'Click "Save as Word DOCX" or "Export as PDF".',
      'Download your document immediately.'
    ],
    faqs: [
      {
        question: 'Can I use this without Microsoft 365 or Word installed?',
        answer: 'Yes! SkPDF runs entirely in modern web browsers on desktop, tablet, and mobile.'
      }
    ],
    acceptedFileTypes: '.docx'
  },
  {
    id: 'pdf-metadata',
    slug: 'pdf-metadata',
    name: 'PDF Metadata Editor',
    shortDescription: 'View, modify, or strip hidden metadata (Author, Title, Producer, Date).',
    category: 'security',
    seoTitle: 'PDF Metadata Editor Online – View & Remove Hidden PDF Metadata | SkPDF',
    metaDescription: 'View, edit, or wipe PDF document metadata. Clean author name, software creator, creation date, and title before sharing publicly.',
    h1: 'Edit or Remove PDF Document Metadata',
    keywords: ['pdf metadata editor', 'remove pdf metadata', 'view pdf metadata', 'clean pdf properties'],
    features: [
      'Inspect Title, Author, Subject, Keywords, Creator, and Producer tags',
      'Edit property values with custom descriptions',
      '1-Click "Sanitize & Strip All Metadata" for maximum anonymity and privacy',
      'Instant download of sanitized PDF'
    ],
    howToSteps: [
      'Upload your PDF file.',
      'Inspect the detected metadata properties.',
      'Edit desired fields or click "Clear All Metadata".',
      'Download your clean PDF file.'
    ],
    faqs: [
      {
        question: 'Why should I remove PDF metadata before publishing?',
        answer: 'PDFs often embed private information like your computer user account name, original file path, organization, and software versions. Removing metadata protects your privacy.'
      }
    ],
    acceptedFileTypes: '.pdf'
  }
];

export const CATEGORIES: { id: ToolCategory; label: string; count?: number }[] = [
  { id: 'all', label: 'All Tools' },
  { id: 'ai', label: '✨ AI Tools' },
  { id: 'organize', label: 'Organize PDF' },
  { id: 'edit', label: 'Edit PDF' },
  { id: 'convert-from', label: 'Convert From PDF' },
  { id: 'convert-to', label: 'Convert To PDF' },
  { id: 'ocr', label: 'OCR & Scanned' },
  { id: 'security', label: 'Security & Redact' },
  { id: 'image-word', label: 'Image & Word' }
];

export function getToolBySlug(slug: string): PDFTool | undefined {
  return TOOLS.find((t) => t.slug === slug || t.id === slug);
}
