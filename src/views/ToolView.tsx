import React from 'react';
import { getToolBySlug } from '../data/toolsData';
import { ToolPageLayout } from '../components/ToolPageLayout';
import { EditPdfTool } from './tools/EditPdfTool';
import { MergePdfTool } from './tools/MergePdfTool';
import { SplitPdfTool } from './tools/SplitPdfTool';
import { CompressPdfTool } from './tools/CompressPdfTool';
import { PdfToWordTool } from './tools/PdfToWordTool';
import { WordToPdfTool } from './tools/WordToPdfTool';
import { OcrPdfTool } from './tools/OcrPdfTool';
import { PdfToImagesTool } from './tools/PdfToImagesTool';
import { ImagesToPdfTool } from './tools/ImagesToPdfTool';
import { OrganizePdfTool } from './tools/OrganizePdfTool';
import { ProtectPdfTool } from './tools/ProtectPdfTool';
import { UnlockPdfTool } from './tools/UnlockPdfTool';
import { RedactPdfTool } from './tools/RedactPdfTool';
import { ImageBackgroundTool } from './tools/ImageBackgroundTool';
import { RemovePdfBackgroundTool } from './tools/RemovePdfBackgroundTool';
import { DocxEditorTool } from './tools/DocxEditorTool';
import { MetadataPdfTool } from './tools/MetadataPdfTool';
import { AiPdfAssistantTool } from './tools/AiPdfAssistantTool';

interface ToolViewProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const ToolView: React.FC<ToolViewProps> = ({ slug, onNavigate }) => {
  const tool = getToolBySlug(slug);

  if (!tool) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tool Not Found</h1>
        <p className="text-sm text-slate-500 mt-2">The requested PDF tool could not be located.</p>
        <button
          onClick={() => onNavigate('/')}
          className="mt-6 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to All Tools
        </button>
      </div>
    );
  }

  const renderToolEngine = () => {
    switch (tool.slug) {
      case 'ai-pdf-assistant':
        return <AiPdfAssistantTool />;
      case 'edit-pdf':
        return <EditPdfTool />;
      case 'merge-pdf':
        return <MergePdfTool />;
      case 'split-pdf':
        return <SplitPdfTool />;
      case 'compress-pdf':
        return <CompressPdfTool />;
      case 'pdf-to-word':
        return <PdfToWordTool />;
      case 'word-to-pdf':
        return <WordToPdfTool />;
      case 'pdf-ocr':
      case 'scanned-pdf-to-word':
        return <OcrPdfTool />;
      case 'pdf-to-jpg':
        return <PdfToImagesTool />;
      case 'jpg-to-pdf':
        return <ImagesToPdfTool />;
      case 'organize-pdf':
        return <OrganizePdfTool />;
      case 'protect-pdf':
        return <ProtectPdfTool />;
      case 'unlock-pdf':
        return <UnlockPdfTool />;
      case 'redact-pdf':
        return <RedactPdfTool />;
      case 'remove-pdf-background':
        return <RemovePdfBackgroundTool />;
      case 'change-image-background':
        return <ImageBackgroundTool />;
      case 'docx-editor':
        return <DocxEditorTool />;
      case 'pdf-metadata':
        return <MetadataPdfTool />;
      default:
        return <EditPdfTool />;
    }
  };

  return (
    <ToolPageLayout tool={tool} onNavigate={onNavigate}>
      {renderToolEngine()}
    </ToolPageLayout>
  );
};
