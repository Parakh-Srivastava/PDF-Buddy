import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { askQuestionApi, uploadPdfApi } from '../services/api';

export default function BackendTelemetry({
  apiBaseUrl,
  setApiBaseUrl,
  isBackendLive,
  corpusData,
  onRefreshHealth
}) {
  const [testQuestion, setTestQuestion] = useState('Summarize the document key metrics');
  const [testResponse, setTestResponse] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestRoute = async () => {
    setIsTesting(true);
    try {
      const res = await askQuestionApi(testQuestion, apiBaseUrl);
      setTestResponse({
        status: 200,
        data: res
      });
    } catch (err) {
      setTestResponse({
        status: 500,
        error: err.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const pipelineFiles = [
    { name: 'app.py', role: 'Flask Orchestration & API Endpoints (/upload, /ask)' },
    { name: 'pdfScanner.py', role: 'PDF extraction via PdfExtractor.extract()' },
    { name: 'headerStripper.py', role: 'Repeated header detection & cleaning (min_occurrences=2)' },
    { name: 'chunker.py', role: 'Semantic sliding window chunking with overlaps' },
    { name: 'vectorDB.py', role: 'ChromaDB collection management & top-k queries' },
    { name: 'artificialIntelligence.py', role: 'AiWorker inference & context synthesis' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Backend Connection Card */}
      <div className="p-6 rounded-2xl bg-[#0c1017] border border-white/[0.08] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-semibold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <span>Flask API Runtime</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isBackendLive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {isBackendLive ? 'ONLINE' : 'STANDBY / OFFLINE'}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Active Server Target: <span className="text-zinc-200">{apiBaseUrl}</span>
            </p>
          </div>

          <button
            onClick={onRefreshHealth}
            className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <svg className="w-3.5 h-3.5 text-[#e5a93b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Ping Server</span>
          </button>
        </div>

        {/* API Base Input */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="sm:col-span-2">
            <label className="text-zinc-400 block mb-1 text-[11px]">FLASK BACKEND ENDPOINT URL</label>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-zinc-200 font-mono text-xs focus:outline-none focus:border-[#e5a93b]"
            />
          </div>
          <div>
            <label className="text-zinc-400 block mb-1 text-[11px]">RAG ROUTING LIMIT</label>
            <div className="px-3 py-2 rounded-lg bg-black/40 border border-white/[0.08] text-[#e5a93b] font-bold">
              8,000 Chars Threshold
            </div>
          </div>
        </div>
      </div>

      {/* Backend Components Architecture Map */}
      <div className="p-6 rounded-2xl bg-[#0c1017] border border-white/[0.08] space-y-4">
        <h3 className="text-sm font-semibold text-white font-['Space_Grotesk']">
          Python Backend Component Architecture (app.py)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pipelineFiles.map((file, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#080b10] border border-white/[0.05] flex items-start gap-3"
            >
              <span className="w-2 h-2 rounded-full bg-[#e5a93b] mt-1.5 shrink-0" />
              <div>
                <span className="text-xs font-mono font-bold text-zinc-200">{file.name}</span>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{file.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Route Debugger */}
      <div className="p-6 rounded-2xl bg-[#0c1017] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white font-['Space_Grotesk'] flex items-center gap-2">
            <span>Direct Route Probe: POST /ask</span>
          </h3>
          <span className="text-[11px] font-mono text-[#e5a93b]">JSON Payload Test</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={testQuestion}
            onChange={(e) => setTestQuestion(e.target.value)}
            className="flex-1 bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#e5a93b]"
          />
          <button
            onClick={handleTestRoute}
            disabled={isTesting}
            className="px-4 py-2 rounded-lg bg-[#e5a93b] text-black font-semibold text-xs hover:bg-[#f3ba4f] transition-all cursor-pointer shrink-0"
          >
            {isTesting ? 'Testing...' : 'Send Probe'}
          </button>
        </div>

        {testResponse && (
          <div className="p-3 rounded-xl bg-black/60 border border-white/[0.05] text-xs font-mono">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span>RESPONSE STATUS: {testResponse.status}</span>
              <span className="text-[#e5a93b]">{testResponse.data?.latencyMs || 0}ms</span>
            </div>
            <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(testResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
