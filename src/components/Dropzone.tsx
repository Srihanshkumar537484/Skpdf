import React, { useRef, useState, DragEvent } from 'react';
import { UploadCloud, File, AlertCircle } from 'lucide-react';

interface DropzoneProps {
  acceptedTypes?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  acceptedTypes = '.pdf',
  multiple = false,
  onFilesSelected,
  title = 'Select PDF files',
  subtitle = 'or drag and drop your files directly here',
  buttonLabel = 'Choose Files'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMessage(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      processFiles(filesArray);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      processFiles(filesArray);
    }
  };

  const processFiles = (files: File[]) => {
    if (!multiple && files.length > 1) {
      setErrorMessage('Please select only 1 file for this operation.');
      return;
    }

    // Validation
    const invalidFile = files.find((f) => {
      if (acceptedTypes === '.pdf') return !f.name.toLowerCase().endsWith('.pdf');
      if (acceptedTypes === '.docx') return !f.name.toLowerCase().endsWith('.docx');
      if (acceptedTypes === 'image/*') {
        return !f.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name);
      }
      return false;
    });

    if (invalidFile) {
      setErrorMessage(`Invalid file format: "${invalidFile.name}". Expected ${acceptedTypes}.`);
      return;
    }

    onFilesSelected(files);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
          isDragging
            ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 scale-[0.99]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-rose-500 dark:hover:border-rose-500 hover:bg-slate-50/50 dark:hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto mb-4 flex items-center justify-center shadow-sm">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">{subtitle}</p>

        <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-rose-600/30 transition-colors">
          <File className="w-4 h-4" />
          <span>{buttonLabel}</span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <span>Supported: {acceptedTypes}</span>
          <span aria-hidden="true">·</span>
          <span>Zero file size limits</span>
          <span aria-hidden="true">·</span>
          <span>100% Private</span>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
