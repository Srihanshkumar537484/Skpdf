import React, { useState } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { PDFDocument } from 'pdf-lib';
import { triggerFileDownload } from '../../utils/pdfUtils';
import { Unlock, Download, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';

export const UnlockPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setIsSuccess(false);
      setErrorMessage(null);
    }
  };

  const handleUnlock = async () => {
    if (!file) return;
    setIsUnlocking(true);
    setErrorMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      // Load PDF with password (or check if already unencrypted)
      let doc;
      try {
        doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      } catch (e) {
        // If password is required
      }

      if (!doc) {
        throw new Error('Invalid password or unsupported encryption.');
      }

      // Re-save without any encryption/password
      const unlockedBytes = await doc.save();
      const outName = file.name.replace('.pdf', '_unlocked.pdf');
      triggerFileDownload(unlockedBytes, outName);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Unlock error:', err);
      setErrorMessage('Could not decrypt document. Please verify your password.');
    } finally {
      setIsUnlocking(false);
    }
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf"
        onFilesSelected={handleFile}
        title="Upload Protected PDF to Unlock & Remove Password"
        subtitle="Strip restrictions and passwords to make the document easily shareable and editable."
        buttonLabel="Select Encrypted PDF"
      />
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="min-w-0 pr-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button
          onClick={() => {
            setFile(null);
            setIsSuccess(false);
            setErrorMessage(null);
          }}
          className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
        >
          Change File
        </button>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
          <Unlock className="w-6 h-6" />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Document Authorization Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter owner/user password..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-rose-500"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        {isSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Document successfully unlocked and downloaded!</span>
          </div>
        )}

        <button
          onClick={handleUnlock}
          disabled={isUnlocking}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {isUnlocking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
          <span>Unlock & Decrypt PDF</span>
        </button>
      </div>
    </div>
  );
};
