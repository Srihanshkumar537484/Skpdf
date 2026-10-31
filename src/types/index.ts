export type ToolCategory =
  | 'all'
  | 'organize'
  | 'edit'
  | 'convert-from'
  | 'convert-to'
  | 'ocr'
  | 'security'
  | 'image-word';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface PDFTool {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: ToolCategory;
  badge?: string;
  popular?: boolean;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  keywords: string[];
  features: string[];
  howToSteps: string[];
  faqs: FAQItem[];
  acceptedFileTypes: string; // e.g. ".pdf", ".docx", "image/*"
  multipleFiles?: boolean;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  date: string;
  readTime: string;
  tags: string[];
}
