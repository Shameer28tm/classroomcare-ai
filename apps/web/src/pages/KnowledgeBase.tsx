import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Database,
  Upload,
  CheckCircle2,
  AlertCircle,
  Send,
  AlertTriangle
} from 'lucide-react';
import { api } from '../lib/api';
import { KnowledgeDocument, DocumentChunk, RAGQueryResponse } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { NIU_CONFIG } from '../config/institution';

export const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<RAGQueryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('OEM Manual');
  const [uploadContent, setUploadContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [docs, chks] = await Promise.all([
        api.getDocuments(),
        api.getChunks(),
      ]);
      setDocuments(docs);
      setChunks(chks);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to load knowledge documents.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setAnswering(true);
    setQueryError(null);
    try {
      const res = await api.queryRAGAssistant(query);
      setResponse(res);
    } catch (err: any) {
      setQueryError(err?.message || 'Failed to query technical knowledge assistant.');
    } finally {
      setAnswering(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadContent.trim()) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append('title', uploadTitle.trim());
      form.append('category', uploadCategory);
      form.append('content', uploadContent.trim());
      form.append('version', 'v1.0');

      await api.uploadDocument(form);
      setIsUploadOpen(false);
      setUploadTitle('');
      setUploadContent('');
      await loadDocs();
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload knowledge document.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Technical Knowledge & Grounded RAG</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {NIU_CONFIG.institutionName} · Hybrid pgvector retrieval, technical service manuals, and verified source citations
          </p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-2 border border-slate-200 shadow-xs transition-colors"
        >
          <Upload className="w-4 h-4 text-blue-600" />
          Upload Manual / SOP
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Database Communication Error: {error}</span>
          </div>
          <button
            onClick={loadDocs}
            className="px-3 py-1 bg-white hover:bg-red-100 text-red-700 border border-red-300 rounded font-semibold text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Interactive RAG Diagnostic Assistant Console */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 tracking-wide uppercase">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Interactive Grounded Diagnostic Assistant
        </div>

        <form onSubmit={handleQuery} className="flex gap-2">
          <div className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-xs focus-within:border-blue-600">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Ask an equipment diagnostic question or safety protocol..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none w-full"
            />
          </div>
          <button
            type="submit"
            disabled={answering}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm shrink-0 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {answering ? 'Searching...' : 'Ask Assistant'}
          </button>
        </form>

        {/* Sample Prompt Chips */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
          <span>Try quick queries:</span>
          <button
            type="button"
            onClick={() => setQuery('What is the high pressure cutout reset procedure for Trane Voyager?')}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-700 font-medium transition-colors"
          >
            Trane High Pressure Cutout
          </button>
          <button
            type="button"
            onClick={() => setQuery('What should be done when Panasonic projector filter indicator blinks orange?')}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-700 font-medium transition-colors"
          >
            Panasonic Filter Alert
          </button>
          <button
            type="button"
            onClick={() => setQuery('How do I repair a submarine nuclear propulsion valve?')}
            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md text-red-700 font-medium transition-colors"
          >
            Test Abstention Protocol (Unknown)
          </button>
        </div>

        {/* Query Error Display */}
        {queryError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{queryError}</span>
          </div>
        )}

        {/* Diagnostic Answer Display */}
        {response && (
          <div
            className={`p-5 rounded-xl border space-y-4 ${
              response.abstained
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold">
                {response.abstained ? (
                  <span className="flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Agent Abstention: Insufficient Grounded Context in Campus Documents
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Verified Technical Answer (Grounded in Campus Documentation)
                  </span>
                )}
              </div>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-blue-700 font-semibold shadow-xs">
                Confidence: {(response.confidence_score * 100).toFixed(0)}%
              </span>
            </div>

            <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
              {response.answer}
            </p>

            {/* Citations Box */}
            {response.citations && response.citations.length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  Source Passages ({response.citations.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {response.citations.map((c, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1 shadow-xs">
                      <div className="flex items-center justify-between text-blue-700 font-bold text-[11px]">
                        <span>{c.document_title}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{c.chunk_id}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] font-mono line-clamp-3">
                        {c.text_snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Campus Document Library & Chunks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents Registry */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Approved Equipment Manuals & Safety SOPs ({documents.length})
          </h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{doc.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Category: <span className="text-slate-700 font-medium">{doc.category}</span> · Version: {doc.version} · {doc.chunk_count} Chunks
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono rounded font-semibold">
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Indexed Chunks Stream */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 max-h-[500px] overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-blue-600" />
            Live pgvector Chunks ({chunks.length})
          </h3>
          <div className="space-y-2">
            {chunks.map((chk) => (
              <div key={chk.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-blue-700 font-bold">{chk.id}</span>
                  <span className="text-slate-500">{chk.document_title}</span>
                </div>
                <p className="text-slate-700 text-[11px] font-mono line-clamp-2">{chk.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Manual Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl p-6 relative">
            <h2 className="text-base font-bold text-slate-900 mb-3">Upload Technical Document / Manual</h2>
            {uploadError && (
              <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Daikin VRV Central Chiller Maintenance Guide"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 outline-none shadow-xs focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 outline-none shadow-xs focus:border-blue-600"
                >
                  <option value="OEM Manual">OEM Manual</option>
                  <option value="Campus Safety SOP">Campus Safety SOP</option>
                  <option value="Resolution Playbook">Resolution Playbook</option>
                  <option value="Electrical Code">Electrical Code</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Text Content *</label>
                <textarea
                  rows={4}
                  placeholder="Paste manual specifications, troubleshooting steps, or safety lockout instructions..."
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg p-2.5 outline-none font-mono shadow-xs focus:border-blue-600"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {uploading ? 'Ingesting...' : 'Ingest Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
