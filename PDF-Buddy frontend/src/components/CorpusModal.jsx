import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CorpusModal({
  isOpen,
  onClose,
  activeFilename,
  onSelectSampleCorpus,
  onOpenUpload
}) {
  if (!isOpen) return null;

  const sampleDocs = [
    {
      filename: 'financial_annual_report_2024.pdf',
      size: '48.9 KB',
      mode: 'RAG',
      chunks: 28,
      desc: 'Consolidated FY24 earnings, Q1-Q4 net revenue expansion, Capex, and East Asian semiconductor risk disclosures.'
    },
    {
      filename: 'semiconductor_supply_chain_2024.pdf',
      size: '32.4 KB',
      mode: 'RAG',
      chunks: 19,
      desc: 'Detailed foundry lead time breakdown, wafer allocations, dual-sourcing restrictions, and FX volatility impacts.'
    },
    {
      filename: 'executive_board_memo_q4.pdf',
      size: '6.2 KB',
      mode: 'FULL-CONTEXT',
      chunks: 1,
      desc: 'Concise executive management directive (< 8,000 chars, directly routed to full-context window without vectorization).'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl p-6 rounded-2xl bg-[#0c1017] border border-[#e5a93b]/30 shadow-2xl space-y-5"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#e5a93b]" />
              <h3 className="text-base font-semibold text-white font-['Space_Grotesk']">
                Select Active Ingested Corpus
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white text-xs font-mono cursor-pointer"
            >
              [ESC / ✕]
            </button>
          </div>

          <div className="space-y-3">
            {sampleDocs.map((doc, idx) => {
              const isSelected = activeFilename === doc.filename;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectSampleCorpus(doc);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#121a27] border-[#e5a93b] shadow-[0_0_15px_rgba(229,169,59,0.15)]'
                      : 'bg-[#080b10] border-white/[0.06] hover:border-white/[0.15] hover:bg-[#0e141f]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-zinc-200 truncate max-w-[280px]">
                      {doc.filename}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        doc.mode === 'RAG'
                          ? 'bg-[#e5a93b]/10 text-[#e5a93b] border border-[#e5a93b]/20'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                      }`}
                    >
                      {doc.mode} ({doc.chunks} {doc.chunks === 1 ? 'Chunk' : 'Chunks'})
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {doc.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/[0.06]">
            <button
              onClick={() => {
                onClose();
                onOpenUpload();
              }}
              className="px-4 py-2 rounded-xl bg-[#e5a93b] text-black font-semibold text-xs hover:bg-[#f3ba4f] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>+ Upload New PDF File</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.04] text-zinc-300 hover:text-white text-xs font-mono transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
