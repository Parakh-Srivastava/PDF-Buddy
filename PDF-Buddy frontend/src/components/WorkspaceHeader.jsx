import React from 'react';

export default function WorkspaceHeader({
  corpusData,
  onResetSession,
  activeTab,
  selectedModel,
  onSelectModel
}) {
  const hasDoc = !!corpusData.filename;

  const getSubtext = () => {
    if (!hasDoc) {
      return 'Awaiting document ingestion — Drop or upload a PDF to begin chunking and RAG querying.';
    }

    if (activeTab === 'chat') {
      if (corpusData.mode === 'RAG') {
        return `Dual-routed inference: Top-${corpusData.topK || 5} Vector Embeddings over ${corpusData.chunksCount || 0} chunks (${corpusData.collectionName || 'Chroma Collection'})`;
      }
      return `Direct Context Window: Full document stream (${(corpusData.charCount || 0).toLocaleString()} chars)`;
    }
    if (activeTab === 'ingest') {
      return 'Document ingestion pipeline: Text extraction, header stripping & dynamic RAG partitioning';
    }
    if (activeTab === 'retrieval') {
      return `ChromaDB vector partition: ${corpusData.chunksCount || 0} semantic chunks indexed (Top-k: ${corpusData.topK || 5})`;
    }
    return '';
  };

  const getTitle = () => {
    if (activeTab === 'chat') return 'Executive Inquiry Workspace';
    if (activeTab === 'ingest') return 'Document Ingestion & Pipeline';
    if (activeTab === 'retrieval') return 'Vector Retrieval & Chunk Inspector';
    return 'Inquiry Workspace';
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight font-['Space_Grotesk'] flex items-center gap-2">
          {getTitle()}
        </h1>
        <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1 flex items-center gap-1.5 flex-wrap">
          <span className="text-[#e5a93b]/90">⚡</span>
          <span>{getSubtext()}</span>
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
        {/* Model Selection Dropdown */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0e131d] border border-white/[0.08] text-xs font-mono">
          <span className="text-zinc-500">Model:</span>
          <select
            value={selectedModel || 'llama3.2:3b'}
            onChange={(e) => onSelectModel && onSelectModel(e.target.value)}
            className="bg-transparent text-[#e5a93b] font-medium focus:outline-none cursor-pointer text-xs"
          >
            <option value="llama3.2:3b" className="bg-[#0c1017] text-zinc-200">
              llama3.2:3b (Fast)
            </option>
            <option value="llama3.1:8b" className="bg-[#0c1017] text-zinc-200">
              llama3.1:8b (Accurate)
            </option>
            <option value="llama3.1:latest" className="bg-[#0c1017] text-zinc-200">
              llama3.1:latest
            </option>
          </select>
          {corpusData.latencyMs && (
            <>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400">{corpusData.latencyMs}ms</span>
            </>
          )}
        </div>

        {hasDoc && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e131d] border border-white/[0.08] text-xs font-mono">
            <span className="text-zinc-400">Chunks:</span>
            <span className="text-[#e5a93b] font-semibold">{corpusData.chunksCount || 0}</span>
            {corpusData.processingTime && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-300 font-mono">⏱️ {corpusData.processingTime}</span>
              </>
            )}
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-medium">{corpusData.mode || 'READY'}</span>
          </div>
        )}


        <button
          onClick={onResetSession}
          className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-zinc-300 hover:text-white transition-all cursor-pointer font-medium active:scale-95"
          title="Reset conversation state"
        >
          Reset
        </button>
      </div>
    </div>
  );
}


