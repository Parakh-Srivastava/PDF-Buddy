import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function RetrievalChunks({ corpusData, onUpdateTopK, onOpenUpload }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChunk, setSelectedChunk] = useState(null);
  const hasDoc = !!corpusData.filename && (corpusData.chunksCount > 0);

  // Use the REAL chunks array returned by backend /upload
  const chunksList = (corpusData.chunks && corpusData.chunks.length > 0)
    ? corpusData.chunks
    : [];

  const filteredChunks = chunksList.filter(
    (c) =>
      c.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.section?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0c1017] border border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white font-['Space_Grotesk']">
              Chroma Vector Space Explorer
            </span>
            <span className="px-2 py-0.5 rounded bg-[#e5a93b]/10 text-[#e5a93b] border border-[#e5a93b]/20 text-[10px] font-mono">
              Cosine Similarity
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-400">
            {hasDoc ? (
              <>
                Document: <span className="text-zinc-200">{corpusData.filename}</span> • Total Chunks Processed:{' '}
                <span className="text-[#e5a93b] font-bold">{corpusData.chunksCount || chunksList.length}</span>
                {corpusData.processingTime && (
                  <>
                    <span className="text-zinc-600"> • </span>
                    <span className="text-emerald-400 font-semibold">⏱️ {corpusData.processingTime}</span>
                  </>
                )}
              </>
            ) : (
              <span className="text-zinc-500">No document processed yet</span>
            )}
          </p>

        </div>

        {/* Top-K Slider */}
        <div className="flex items-center gap-3 bg-[#080b10] px-4 py-2 rounded-xl border border-white/[0.06] text-xs font-mono">
          <span className="text-zinc-400">Top-K Depth:</span>
          <span className="text-[#e5a93b] font-bold text-sm">k = {corpusData.topK || 5}</span>
          <input
            type="range"
            min="1"
            max="10"
            value={corpusData.topK || 5}
            onChange={(e) => onUpdateTopK(parseInt(e.target.value, 10))}
            className="w-24 accent-[#e5a93b] cursor-pointer"
          />
        </div>
      </div>

      {!hasDoc || chunksList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-white/[0.06] bg-[#0b0f16]/60 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-1">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white">0 Chunks Indexed</h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            Upload a PDF document to trigger text extraction and view the real chunk partitions in ChromaDB.
          </p>
          <button
            onClick={onOpenUpload}
            className="mt-2 px-4 py-2 rounded-xl bg-[#e5a93b] text-black font-semibold text-xs hover:bg-[#f3ba4f] transition-all cursor-pointer"
          >
            + Upload PDF Document
          </button>
        </div>
      ) : (
        <>
          {/* Search Input for Chunks */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search through actual chunk text, keywords, or chunk ID..."
              className="w-full bg-[#0b1017] border border-white/[0.08] rounded-xl px-4 py-3 pl-10 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#e5a93b]/40 font-mono"
            />
            <svg
              className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Chunks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChunks.map((chunk, idx) => {
              const isSelected = selectedChunk?.id === chunk.id;
              const chunkText = chunk.text || chunk.content || '';
              const tokenCount = chunk.token_count || Math.round(chunkText.split(/\s+/).length);
              const charCount = chunk.char_count || chunkText.length;

              return (
                <motion.div
                  key={chunk.id || idx}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedChunk(isSelected ? null : chunk)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#131b28] border-[#e5a93b]/60 shadow-[0_0_20px_rgba(229,169,59,0.15)]'
                      : 'bg-[#0b1017] border-white/[0.07] hover:border-white/[0.15]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                      <span className="text-[#e5a93b] font-bold">{chunk.id || `chunk_${idx + 1}`}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-400">{tokenCount} words</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">{charCount} chars</span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4 font-mono bg-black/30 p-2.5 rounded border border-white/[0.03]">
                      {chunkText}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>Block #{chunk.index || idx + 1}</span>
                    <span className="text-[#e5a93b]">View Full Text →</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Selected Chunk Modal / Detailed Drawer */}
          {selectedChunk && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-[#0e1420] border border-[#e5a93b]/40 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-[#e5a93b]/10 text-[#e5a93b] font-mono text-xs font-bold">
                    {selectedChunk.id || 'Chunk Details'}
                  </span>
                  <h3 className="text-sm font-semibold text-white font-['Space_Grotesk']">
                    Actual Extracted Chunk Content
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedChunk(null)}
                  className="text-zinc-400 hover:text-white text-xs font-mono cursor-pointer"
                >
                  [Close ✕]
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono bg-black/30 p-3 rounded-xl border border-white/[0.04]">
                <div>
                  <span className="text-zinc-500 block">TOTAL CHARACTERS</span>
                  <span className="text-emerald-400">{(selectedChunk.char_count || selectedChunk.text?.length || 0)} chars</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">EST. WORD COUNT</span>
                  <span className="text-[#e5a93b]">{(selectedChunk.token_count || selectedChunk.text?.split(/\s+/).length || 0)} words</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">DOCUMENT SOURCE</span>
                  <span className="text-zinc-200 truncate block">{corpusData.filename}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Raw Chunk Text:
                </span>
                <pre className="p-4 rounded-xl bg-black/40 border border-white/[0.05] text-xs text-zinc-200 font-mono whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto">
                  {selectedChunk.text || selectedChunk.content}
                </pre>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}


