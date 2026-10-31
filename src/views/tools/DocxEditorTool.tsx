import React, { useState, useRef } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { extractFromDocx, createWordDocumentFromText, convertDocxToPdf } from '../../utils/docxUtils';
import { triggerFileDownload } from '../../utils/pdfUtils';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Table as TableIcon,
  Download,
  FileText,
  FileDown,
  Plus
} from 'lucide-react';

export const DocxEditorTool: React.FC = () => {
  const [docTitle, setDocTitle] = useState('Untitled Document');
  const [isLoaded, setIsLoaded] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setDocTitle(f.name.replace('.docx', ''));

    try {
      const buffer = await f.arrayBuffer();
      const extracted = await extractFromDocx(buffer);
      if (editorRef.current) {
        editorRef.current.innerHTML = extracted.html || '<p>Start typing...</p>';
      }
      setIsLoaded(true);
    } catch (err) {
      console.error('Error opening DOCX:', err);
      alert('Could not open document: ' + (err as any).message);
    }
  };

  const handleCreateNew = () => {
    setDocTitle('New Document');
    if (editorRef.current) {
      editorRef.current.innerHTML = `
        <h1>Document Title</h1>
        <p>Start writing your text here. You can format headings, bold words, or create tables.</p>
      `;
    }
    setIsLoaded(true);
  };

  const formatText = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertTable = () => {
    const tableHtml = `
      <table style="width:100%; border-collapse:collapse; margin: 16px 0;">
        <thead>
          <tr>
            <th style="border: 1px solid #cbd5e1; padding: 8px; background: #f8fafc;">Header 1</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; background: #f8fafc;">Header 2</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; background: #f8fafc;">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">Data 1</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">Data 2</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px;">Data 3</td>
          </tr>
        </tbody>
      </table>
      <p></p>
    `;
    document.execCommand('insertHTML', false, tableHtml);
  };

  const handleSaveDocx = async () => {
    if (!editorRef.current) return;
    const innerText = editorRef.current.innerText;
    const paragraphs = innerText.split('\n').filter((l) => l.trim().length > 0);

    const blob = await createWordDocumentFromText(docTitle, paragraphs);
    triggerFileDownload(blob, `${docTitle}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <Dropzone
          acceptedTypes=".docx"
          onFilesSelected={handleFile}
          title="Open Microsoft Word (.docx) Document"
          subtitle="View and edit Word documents directly in your web browser with rich formatting."
          buttonLabel="Select Word File"
        />

        <div className="text-center">
          <span className="text-xs text-slate-400">or</span>
          <div className="mt-2">
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 hover:border-rose-500 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 transition-colors"
            >
              <Plus className="w-4 h-4 text-rose-600" />
              <span>Create New Blank Word Document</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Document Title & Export Bar */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            className="text-sm font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-rose-500 focus:outline-none text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLoaded(false)}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Close
          </button>

          <button
            onClick={handleSaveDocx}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download DOCX</span>
          </button>
        </div>
      </div>

      {/* Editor Formatting Ribbon */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300">
        <button
          onClick={() => formatText('bold')}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('italic')}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('underline')}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        <button
          onClick={() => formatText('formatBlock', '<h1>')}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('formatBlock', '<h2>')}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        <button
          onClick={() => formatText('insertUnorderedList')}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('insertOrderedList')}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <span className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        <button
          onClick={insertTable}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Insert Table"
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Insert Table</span>
        </button>
      </div>

      {/* Document Page Canvas Canvas/Paper */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 flex justify-center min-h-[600px]">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="w-full max-w-3xl min-h-[500px] bg-white text-slate-900 p-8 sm:p-12 shadow-md rounded-lg focus:outline-none font-serif text-base leading-relaxed"
          style={{ minHeight: '842px' }}
        />
      </div>
    </div>
  );
};
