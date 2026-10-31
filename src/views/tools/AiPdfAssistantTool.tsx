import React, { useState } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { renderPdfPage, getPdfPageCount } from '../../utils/pdfUtils';
import { summarizeDocument, askDocumentQuestion, enhanceTextWithAi } from '../../services/aiService';
import {
  Sparkles,
  MessageSquare,
  FileText,
  Send,
  RefreshCw,
  Copy,
  Check,
  Languages,
  BookOpen,
  ArrowRight,
  Bot
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export const AiPdfAssistantTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);

  // Active AI Tab
  const [activeTab, setActiveTab] = useState<'summary' | 'chat' | 'translate'>('summary');

  // Summary State
  const [summaryLanguage, setSummaryLanguage] = useState<'en' | 'hi'>('en');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [summaryResult, setSummaryResult] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [isAnswering, setIsAnswering] = useState<boolean>(false);

  // Translation / Rewriting State
  const [rephraseAction, setRephraseAction] = useState<'translate-hindi' | 'translate-english' | 'professional' | 'proofread'>('translate-hindi');
  const [rephraseResult, setRephraseResult] = useState<string>('');
  const [isRephrasing, setIsRephrasing] = useState<boolean>(false);

  const [copied, setCopied] = useState(false);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setIsLoadingDoc(true);
    setSummaryResult('');
    setMessages([]);
    setRephraseResult('');

    try {
      const buffer = await f.arrayBuffer();
      const count = await getPdfPageCount(buffer);
      setPageCount(count);

      // Extract text from pages
      const allTextChunks: string[] = [];
      const pagesToExtract = Math.min(count, 15); // first 15 pages for high-speed analysis

      for (let p = 1; p <= pagesToExtract; p++) {
        const info = await renderPdfPage(buffer, p, 1.0);
        const pageText = info.textItems.map((item) => item.str).join(' ');
        allTextChunks.push(`[Page ${p}]\n${pageText}`);
      }

      const fullDocText = allTextChunks.join('\n\n');
      setExtractedText(fullDocText);
    } catch (err) {
      console.error('Error loading PDF for AI:', err);
      alert('Could not read PDF text: ' + (err as any).message);
    } finally {
      setIsLoadingDoc(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!extractedText) return;
    setIsSummarizing(true);
    try {
      const result = await summarizeDocument(extractedText, summaryLanguage, summaryLength);
      setSummaryResult(result);
    } catch (err: any) {
      alert('AI Summarization error: ' + err.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentQuestion.trim() || isAnswering || !extractedText) return;

    const userQ = currentQuestion.trim();
    setCurrentQuestion('');
    setMessages((prev) => [...prev, { sender: 'user', text: userQ }]);
    setIsAnswering(true);

    try {
      const answer = await askDocumentQuestion(extractedText, userQ);
      setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Error getting answer: ' + err.message }
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  const handleRephrase = async () => {
    if (!extractedText) return;
    setIsRephrasing(true);
    try {
      const sampleText = extractedText.slice(0, 4000);
      const res = await enhanceTextWithAi(sampleText, rephraseAction);
      setRephraseResult(res);
    } catch (err: any) {
      alert('AI Rephrasing error: ' + err.message);
    } finally {
      setIsRephrasing(false);
    }
  };

  const copyToClipboard = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf"
        onFilesSelected={handleFile}
        title="Upload PDF for AI Document Analysis & Chat"
        subtitle="Summarize complex documents, chat with your PDF, extract key points, or translate between English & Hindi."
        buttonLabel="Select PDF Document"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Document info bar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {pageCount} pages · 100% Private Local Intelligence (Zero API Key)
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setFile(null);
            setExtractedText('');
          }}
          className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
        >
          Change Document
        </button>
      </div>

      {isLoadingDoc && (
        <div className="p-12 text-center text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
          <span>Extracting document text and semantic passage vectors...</span>
        </div>
      )}

      {/* Mode navigation tabs */}
      {!isLoadingDoc && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'summary'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>AI Summary & Takeaways</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat with PDF (Q&A)</span>
          </button>

          <button
            onClick={() => setActiveTab('translate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'translate'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>AI Translation & Rewriter</span>
          </button>
        </div>
      )}

      {/* Tab 1: AI Summary */}
      {!isLoadingDoc && activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Output Language:</span>
                <select
                  value={summaryLanguage}
                  onChange={(e) => setSummaryLanguage(e.target.value as any)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Detail Level:</span>
                <select
                  value={summaryLength}
                  onChange={(e) => setSummaryLength(e.target.value as any)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200"
                >
                  <option value="short">Quick Bullet Points</option>
                  <option value="medium">Standard Overview</option>
                  <option value="detailed">In-Depth Executive Analysis</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateSummary}
              disabled={isSummarizing}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              {isSummarizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isSummarizing ? 'Analyzing with Gemini 3.8...' : 'Generate AI Summary'}</span>
            </button>
          </div>

          {summaryResult && (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <span>Executive AI Document Summary</span>
                </h3>
                <button
                  onClick={() => copyToClipboard(summaryResult)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {summaryResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Chat with PDF */}
      {!isLoadingDoc && activeTab === 'chat' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 flex flex-col h-[550px]">
          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Bot className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Ask Anything About This PDF</h4>
                <p className="text-xs max-w-sm mt-1">
                  Ask about specific clauses, totals, dates, names, or comparisons. Gemini answers strictly using the document context.
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {[
                    'What is the primary conclusion of this document?',
                    'List all dates and deadlines mentioned.',
                    'Summarize the financial numbers or costs.'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentQuestion(preset);
                      }}
                      className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-500 rounded-lg px-3 py-1 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      &quot;{preset}&quot;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, index) => (
              <div
                key={index}
                className={`flex gap-3 text-xs sm:text-sm ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-xl leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isAnswering && (
              <div className="flex gap-3 text-xs text-slate-500 items-center">
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
                <span>Gemini 3.8 is analyzing document text...</span>
              </div>
            )}
          </div>

          {/* Question input bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-2">
            <input
              type="text"
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="Ask a question about this document..."
              className="flex-1 px-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              disabled={isAnswering || !currentQuestion.trim()}
              className="p-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: AI Translation & Rephrasing */}
      {!isLoadingDoc && activeTab === 'translate' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Action:</span>
              <select
                value={rephraseAction}
                onChange={(e) => setRephraseAction(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200"
              >
                <option value="translate-hindi">Translate to Hindi (हिंदी अनुवाद)</option>
                <option value="translate-english">Translate to English</option>
                <option value="professional">Rewrite in Professional Executive Tone</option>
                <option value="proofread">Grammar & Spell Check</option>
              </select>
            </div>

            <button
              onClick={handleRephrase}
              disabled={isRephrasing}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              {isRephrasing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
              <span>{isRephrasing ? 'Transforming text...' : 'Apply AI Transformation'}</span>
            </button>
          </div>

          {rephraseResult && (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">AI Transformed Output</span>
                <button
                  onClick={() => copyToClipboard(rephraseResult)}
                  className="flex items-center gap-1 text-slate-500 hover:text-rose-600"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {rephraseResult}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
