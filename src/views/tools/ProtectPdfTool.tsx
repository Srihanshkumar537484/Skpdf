import React, { useState } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { protectPdf, triggerFileDownload } from '../../utils/pdfUtils';
import { Lock, Download, RefreshCw, Key, ShieldCheck } from 'lucide-react';

export const ProtectPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProtecting, setIsProtecting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setIsSuccess(false);
    }
  };

  const handleProtect = async () => {
    if (!file) return;
    if (!password) {
      alert('Please enter a password.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match. Please re-enter.');
      return;
    }

    setIsProtecting(true);
    try {
      const buffer = await file.arrayBuffer();
      const protectedBytes = await protectPdf(buffer, password);
      const outName = file.name.replace('.pdf', '_protected.pdf');
      triggerFileDownload(protectedBytes, outName);
      setIsSuccess(true);
    } catch (err) {
      console.error('Encryption error:', err);
      alert('Error protecting PDF: ' + (err as any).message);
    } finally {
      setIsProtecting(false);
    }
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf"
        onFilesSelected={handleFile}
        title="Upload PDF to Encrypt & Protect with Password"
        subtitle="Apply standard AES encryption to restrict opening, copying, and unauthorized printing."
        buttonLabel="Choose PDF File"
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
          }}
          className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
        >
          Change File
        </button>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Choose Document Password:
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Confirm Password:
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-rose-500"
            />
          </div>
        </div>

        {isSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Document encrypted and downloaded!</span>
          </div>
        )}

        <button
          onClick={handleProtect}
          disabled={isProtecting || !password}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {isProtecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          <span>Encrypt & Protect PDF</span>
        </button>
      </div>
    </div>
  );
};
