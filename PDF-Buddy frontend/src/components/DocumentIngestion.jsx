import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function DocumentIngestion({
  corpusData,
  onUploadSuccess,
  isUploading,
  uploadError
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeStage, setActiveStage] = useState(1);
  const fileInputRef = useRef(null);
  const hasDoc = !!corpusData.filename;

  // Live timer and stage cycler during ingestion
  useEffect(() => {
    let timer;
    let stageTimer;
    if (isUploading) {
      setElapsedSeconds(0);
      setActiveStage(1);
      const startTime = Date.now();

      timer = setInterval(() => {
        setElapsedSeconds(((Date.now() - startTime) / 1000).toFixed(1));
      }, 100);

      stageTimer = setInterval(() => {
        setActiveStage((prev) => (prev < 4 ? prev + 1 : prev));
      }, 700);
    }

    return () => {
      clearInterval(timer);
      clearInterval(stageTimer);
    };
  }, [isUploading]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        onUploadSuccess(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onUploadSuccess(file);
    }
  };

  const isRag = corpusData.mode === 'RAG';

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Upload Box */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all duration-200 text-center group ${
          isUploading
            ? 'border-[#e5a93b]/70 bg-[#0d131d] shadow-[0_0_35px_rgba(229,169,59,0.15)] cursor-wait'
            : isDragOver
            ? 'border-[#e5a93b] bg-[#e5a93b]/5 shadow-[0_0_30px_rgba(229,169,59,0.15)] cursor-pointer'
            : 'border-white/[0.12] bg-[#0c1017]/80 hover:border-[#e5a93b]/40 hover:bg-[#0e141f] cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          disabled={isUploading}
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e5a93b]/20 to-transparent border border-[#e5a93b]/30 flex items-center justify-center text-[#e5a93b] group-hover:scale-105 transition-transform duration-200">
            {isUploading ? (
              <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            ) : (
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              {isUploading
                ? `Chunking & Processing Document (${elapsedSeconds}s elapsed)...`
                : 'Drop your PDF here or click to browse'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
              {isUploading
                ? 'Parsing binary text, identifying repeated header boundaries, slicing semantic chunks, and building vector index...'
                : 'Automated multi-stage pipeline: PDF extraction, repeated header stripping, and dynamic Chroma VectorStore partitioning.'}
            </p>
          </div>

          {/* Time & Stage Progress Bar during Uploading */}
          {isUploading && (
            <div className="w-full max-w-md space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#e5a93b] flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#e5a93b] animate-ping" />
                  Stage {activeStage}/4: {
                    activeStage === 1 ? 'Extracting text streams' :
                    activeStage === 2 ? 'Stripping repeated headers' :
                    activeStage === 3 ? 'Chunking document' :
                    'Indexing into Chroma VectorStore'
                  }
                </span>
                <span className="text-emerald-400 font-bold bg-black/40 px-2 py-0.5 rounded border border-white/[0.08]">
                  ⏱️ {elapsedSeconds}s
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#e5a93b] to-emerald-400"
                  initial={{ width: '10%' }}
                  animate={{ width: `${Math.min(95, activeStage * 25 + Math.random() * 5)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {!isUploading && (
            <div className="flex items-center gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-zinc-400">
                Max file size: 50MB
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#e5a93b]/10 border border-[#e5a93b]/20 text-[11px] font-mono text-[#e5a93b]">
                POST /upload
              </span>
            </div>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{uploadError}</span>
        </div>
      )}

      {/* Pipeline Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Step 1 */}
        <div className={`p-4 rounded-xl border space-y-2 transition-all ${
          isUploading && activeStage === 1
            ? 'bg-[#151c2a] border-[#e5a93b] shadow-[0_0_15px_rgba(229,169,59,0.2)]'
            : 'bg-[#0b1017] border-white/[0.07]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400">STEP 01</span>
            <span className={`w-2 h-2 rounded-full ${hasDoc || (isUploading && activeStage >= 1) ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          </div>
          <h4 className="text-sm font-semibold text-white font-['Space_Grotesk']">PdfExtractor</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Extracts UTF-8 streams page-by-page from raw PDF binary.
          </p>
          <div className="text-[11px] font-mono text-zinc-300 pt-1">
            Status: <span className={hasDoc ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>{hasDoc ? 'Extracted' : isUploading && activeStage === 1 ? 'Running...' : 'Standby'}</span>
          </div>
        </div>

        {/* Step 2 */}
        <div className={`p-4 rounded-xl border space-y-2 transition-all ${
          isUploading && activeStage === 2
            ? 'bg-[#151c2a] border-[#e5a93b] shadow-[0_0_15px_rgba(229,169,59,0.2)]'
            : 'bg-[#0b1017] border-white/[0.07]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400">STEP 02</span>
            <span className={`w-2 h-2 rounded-full ${hasDoc || (isUploading && activeStage >= 2) ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          </div>
          <h4 className="text-sm font-semibold text-white font-['Space_Grotesk']">HeaderStripper</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Detects repeated page headers and purges recurring noise.
          </p>
          <div className="text-[11px] font-mono text-zinc-300 pt-1">
            Headers Stripped: <span className="text-[#e5a93b] font-semibold">{corpusData.repeatedHeadersStripped || 0}</span>
          </div>
        </div>

        {/* Step 3 */}
        <div className={`p-4 rounded-xl border space-y-2 transition-all ${
          isUploading && activeStage === 3
            ? 'bg-[#151c2a] border-[#e5a93b] shadow-[0_0_15px_rgba(229,169,59,0.2)]'
            : 'bg-[#0b1017] border-white/[0.07]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400">STEP 03</span>
            <span className={`w-2 h-2 rounded-full ${hasDoc ? (isRag ? 'bg-[#e5a93b]' : 'bg-cyan-400') : (isUploading && activeStage >= 3) ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          </div>
          <h4 className="text-sm font-semibold text-white font-['Space_Grotesk']">Route Classifier</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Threshold: 8,000 chars. Length: {(corpusData.charCount || 0).toLocaleString()} chars.
          </p>
          <div className="text-[11px] font-mono text-zinc-300 pt-1">
            Mode: <span className={`font-semibold ${isRag ? 'text-[#e5a93b]' : 'text-cyan-400'}`}>{corpusData.mode || 'Pending'}</span>
          </div>
        </div>

        {/* Step 4 */}
        <div className={`p-4 rounded-xl border space-y-2 transition-all ${
          isUploading && activeStage === 4
            ? 'bg-[#151c2a] border-[#e5a93b] shadow-[0_0_15px_rgba(229,169,59,0.2)]'
            : 'bg-[#0b1017] border-white/[0.07]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400">STEP 04</span>
            <span className={`w-2 h-2 rounded-full ${hasDoc || (isUploading && activeStage === 4) ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          </div>
          <h4 className="text-sm font-semibold text-white font-['Space_Grotesk']">Chroma VectorStore</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Chunk partitioning and vector embedding indexing.
          </p>
          <div className="text-[11px] font-mono text-zinc-300 pt-1">
            Chunks: <span className="text-emerald-400 font-bold">{corpusData.chunksCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Active Document Details Card with Ingestion Time */}
      {hasDoc && (
        <div className="p-6 rounded-2xl bg-[#0c1017] border border-white/[0.08] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e5a93b] animate-pulse" />
              <span className="text-sm font-semibold text-white font-['Space_Grotesk']">
                Active Corpus Metadata
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                ⏱️ Ingestion Time: {corpusData.processingTime || '1.24s'}
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-[#e5a93b]">
                {corpusData.collectionName || 'Chroma Vector Collection'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-zinc-500 block mb-1">FILE NAME</span>
              <span className="text-zinc-200 font-semibold truncate block">
                {corpusData.filename}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block mb-1">EXTRACTED LENGTH</span>
              <span className="text-zinc-200 font-semibold">
                {(corpusData.charCount || 0).toLocaleString()} chars
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block mb-1">TOTAL CHUNKS</span>
              <span className="text-[#e5a93b] font-bold text-sm">{corpusData.chunksCount || 0} Chunks</span>
            </div>
            <div>
              <span className="text-zinc-500 block mb-1">TIME PER CHUNK</span>
              <span className="text-emerald-400 font-semibold">
                {corpusData.chunksCount > 0
                  ? `${Math.round((parseFloat(corpusData.processingTime || '1.2') * 1000) / corpusData.chunksCount)}ms / chunk`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


