import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWorkspace({
  messages,
  isLoading,
  corpusData,
  chatContainerRef,
  onOpenUpload
}) {
  const [openCitations, setOpenCitations] = useState({});
  const hasDoc = !!corpusData.filename;

  const toggleCitations = (msgId) => {
    setOpenCitations((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const renderAssistantContent = (msg) => {
    // If structured executive synthesis format
    if (msg.metrics || msg.risks || msg.citations) {
      return (
        <div className="space-y-5">
          {msg.summary && (
            <p className="text-zinc-200 text-sm sm:text-[15px] leading-relaxed">
              {msg.summary}
            </p>
          )}

          {/* Metric KPI Cards */}
          {msg.metrics && msg.metrics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              {msg.metrics.map((metric, idx) => {
                const isGold = metric.color === 'gold' || idx === 0;
                const isCyan = metric.color === 'cyan' || idx === 1;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className={`p-4 rounded-xl border bg-[#0b1017]/90 backdrop-blur-sm relative overflow-hidden transition-all duration-200 ${
                      isGold
                        ? 'border-[#e5a93b]/30 shadow-[0_0_15px_rgba(229,169,59,0.08)]'
                        : isCyan
                        ? 'border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]'
                        : 'border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.05)]'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold mb-1">
                      {metric.label}
                    </div>
                    <div
                      className={`text-xl sm:text-2xl font-bold tracking-tight font-['Space_Grotesk'] ${
                        isGold
                          ? 'text-[#e5a93b]'
                          : isCyan
                          ? 'text-cyan-300'
                          : 'text-rose-400'
                      }`}
                    >
                      {metric.value}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 font-mono">
                      {metric.delta}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Structured Risks / Highlights */}
          {msg.risks && msg.risks.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-mono font-bold tracking-widest text-[#e5a93b]/90 uppercase mb-3 flex items-center gap-2">
                <span>{msg.riskSectionTitle || 'PRIMARY TAKEAWAYS & DISCLOSURES:'}</span>
              </div>
              <ul className="space-y-2.5">
                {msg.risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e5a93b] mt-2 shrink-0" />
                    <div>
                      <strong className="text-zinc-100 font-semibold">{risk.title}:</strong>{' '}
                      <span className="text-zinc-300">{risk.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Source Citations Accordion */}
          {((msg.retrievedChunks && msg.retrievedChunks.length > 0) || (msg.citations && msg.citations.length > 0)) && (
            <div className="pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => toggleCitations(msg.id)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-mono text-zinc-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-[#e5a93b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>
                    Retrieved Source Chunks ({(msg.retrievedChunks || msg.citations).length} Ingested Chunks)
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                    openCitations[msg.id] ? 'rotate-180 text-[#e5a93b]' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <AnimatePresence>
                {openCitations[msg.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-2 space-y-2"
                  >
                    {(msg.retrievedChunks || msg.citations).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#090d14] border border-white/[0.05] text-xs font-mono space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span className="text-[#e5a93b] font-semibold flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#e5a93b]" />
                            {item.id || `Chunk #${idx + 1}`} {item.heading ? `— ${item.heading}` : ''}
                          </span>
                          {item.distance !== undefined ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                              dist: {item.distance.toFixed(3)}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                              {item.similarity || 'match'}
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-300/90 text-xs font-mono leading-relaxed bg-black/30 p-2.5 rounded border border-white/[0.03] whitespace-pre-wrap">
                          {item.text || item.excerpt}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      );
    }

    // Default raw answer (if string from live backend)
    return (
      <div className="space-y-4">
        <div className="text-zinc-200 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap font-sans">
          {msg.answer || msg.text}
        </div>

        {/* Real Retrieved Chunks Accordion */}
        {msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
          <div className="pt-3 border-t border-white/[0.06]">
            <button
              onClick={() => toggleCitations(msg.id)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-mono text-zinc-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-[#e5a93b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>
                  Retrieved Chunks ({msg.retrievedChunks.length} Top-K Chunks Grounded)
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                  openCitations[msg.id] ? 'rotate-180 text-[#e5a93b]' : ''
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <AnimatePresence>
              {openCitations[msg.id] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-2 space-y-2"
                >
                  {msg.retrievedChunks.map((chunk, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#090d14] border border-white/[0.05] text-xs font-mono space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="text-[#e5a93b] font-semibold flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-[#e5a93b]" />
                          Retrieved Source Block #{idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          distance: {chunk.distance?.toFixed(3) || '0.000'}
                        </span>
                      </div>
                      <pre className="text-zinc-300 text-xs font-mono leading-relaxed bg-black/40 p-2.5 rounded border border-white/[0.03] whitespace-pre-wrap">
                        {chunk.text}
                      </pre>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto pr-1 space-y-6 min-h-[360px] max-h-[58vh] lg:max-h-[62vh]"
    >
      {/* Clean Minimalist Empty State */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[340px] text-center p-8 rounded-2xl border border-white/[0.06] bg-[#0b0f16]/60 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e5a93b]/30 to-transparent" />
          
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e5a93b]/20 to-transparent border border-[#e5a93b]/30 flex items-center justify-center text-[#e5a93b] mb-4 gold-glow-sm">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>

          {hasDoc ? (
            <div className="space-y-2 max-w-md">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e5a93b]/10 border border-[#e5a93b]/30 text-xs font-mono text-[#e5a93b]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e5a93b] animate-pulse" />
                <span>{corpusData.filename}</span>
                <span>•</span>
                <span>{corpusData.chunksCount || 0} Chunks Ready</span>
              </div>
              <h3 className="text-lg font-semibold text-white font-['Space_Grotesk']">
                Corpus Ready for Executive Inquiries
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Type your question below or click any of the suggestion chips to synthesize answers from the indexed vector chunks.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-w-md">
              <h3 className="text-lg font-semibold text-white font-['Space_Grotesk']">
                No PDF Document Ingested
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Upload your document to run text extraction, repeated header stripping, and Chroma vector chunking.
              </p>
              
              <div className="pt-2">
                <button
                  onClick={onOpenUpload}
                  className="px-4 py-2 rounded-xl bg-[#e5a93b] text-black font-semibold text-xs hover:bg-[#f3ba4f] transition-all cursor-pointer inline-flex items-center gap-2 shadow-[0_0_15px_rgba(229,169,59,0.25)] active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <span>Ingest PDF Document</span>
                </button>
              </div>
            </div>
          )}

          {/* Workflow Pipeline Pills */}
          <div className="mt-8 pt-6 border-t border-white/[0.04] flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-[11px] font-mono text-zinc-500">
            <span className="text-zinc-400">Pipeline:</span>
            <span className="px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-zinc-300">
              1. PdfExtractor
            </span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-zinc-300">
              2. HeaderStripper
            </span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-[#e5a93b]">
              3. Vector Chunks
            </span>
          </div>
        </div>
      )}

      {/* Message Stream */}
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {/* User Message */}
          {msg.role === 'user' && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 mb-1 text-[11px] font-mono text-zinc-500">
                <span className="text-zinc-400">{msg.method || 'POST /ask'}</span>
                <span>•</span>
                <span>{msg.timestamp || 'Just now'}</span>
              </div>
              <div className="max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl rounded-tr-sm bg-[#121824] border border-white/[0.09] text-zinc-100 text-sm leading-relaxed shadow-lg">
                {msg.text}
              </div>
            </div>
          )}

          {/* Assistant Executive Synthesis */}
          {msg.role === 'assistant' && (
            <div className="flex flex-col items-start w-full">
              {/* ContextFlow Synthesis Header Badge */}
              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 mb-2">
                <span className="text-[#e5a93b] flex items-center gap-1 font-semibold">
                  <svg className="w-3.5 h-3.5 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                  ContextFlow Synthesis
                </span>
                <span>•</span>
                <span>k-{msg.sourceChunksCount || corpusData.topK || 5} source chunks</span>
                {msg.latencyMs && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400">{msg.latencyMs}ms</span>
                  </>
                )}
              </div>

              {/* Main Executive Answer Card */}
              <div className="w-full p-5 sm:p-6 rounded-2xl bg-[#0c1017]/95 border border-[#e5a93b]/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#e5a93b]/40 to-transparent" />
                {renderAssistantContent(msg)}
              </div>
            </div>
          )}
        </motion.div>
      ))}

      {/* Loading Shimmer State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#e5a93b]">
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <span>Querying Chroma VectorStore & Synthesizing response...</span>
          </div>

          <div className="w-full p-5 rounded-2xl bg-[#0c1017]/90 border border-white/[0.08] space-y-4 animate-pulse">
            <div className="h-4 bg-white/[0.06] rounded w-3/4" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="h-20 bg-white/[0.04] rounded-xl border border-white/[0.04]" />
              <div className="h-20 bg-white/[0.04] rounded-xl border border-white/[0.04]" />
              <div className="h-20 bg-white/[0.04] rounded-xl border border-white/[0.04]" />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

