import React from 'react';
import { motion } from 'framer-motion';

export default function Navbar({
  activeTab,
  setActiveTab,
  corpusData,
  isBackendLive,
  onOpenUpload
}) {
  const tabs = [
    {
      id: 'chat',
      label: 'Ask & Query',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 9h8" strokeLinecap="round" />
          <path d="M8 13h5" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: 'ingest',
      label: 'Document & Ingestion',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      )
    },
    {
      id: 'retrieval',
      label: 'Retrieval & Chunks',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      )
    }
  ];

  const hasDoc = !!corpusData.filename;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#070a0e]/90 backdrop-blur-md px-4 lg:px-6 py-2.5">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        
        {/* Brand & Corpus Info */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('chat')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e5a93b]/20 to-transparent border border-[#e5a93b]/40 flex items-center justify-center text-[#e5a93b] gold-glow-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-base tracking-tight text-white font-['Space_Grotesk']">
                ContextFlow
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#e5a93b] font-bold uppercase opacity-90">
                EXECUTIVE
              </span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

          {/* Active Corpus Pill with dynamic Chunks */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${hasDoc ? 'bg-[#e5a93b]' : 'bg-zinc-500'}`} />
            <span className="text-zinc-400">Corpus:</span>
            <span className="font-mono text-zinc-200 truncate max-w-[160px] lg:max-w-[220px]">
              {hasDoc ? corpusData.filename : 'No document loaded'}
            </span>
            
            {hasDoc ? (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-[#e5a93b]/10 text-[#e5a93b] text-[10px] font-mono border border-[#e5a93b]/20 font-semibold flex items-center gap-1">
                <span>{corpusData.chunksCount || 0} Chunks</span>
                {corpusData.processingTime && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span className="text-emerald-400">{corpusData.processingTime}</span>
                  </>
                )}
              </span>
            ) : (
              <button
                onClick={onOpenUpload}
                className="ml-1 text-[11px] text-[#e5a93b] hover:text-[#f8d488] hover:underline font-medium cursor-pointer transition-colors"
              >
                + Upload PDF
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Center */}
        <nav className="flex items-center gap-1 bg-[#0d121a]/80 p-1 rounded-xl border border-white/[0.06] overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-[#e5a93b]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute inset-0 rounded-lg bg-[#e5a93b]/10 border border-[#e5a93b]/30"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0e141f] border border-white/[0.06] text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendLive
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                  : 'bg-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
              }`}
            />
            <span className="text-zinc-400">Flask 5000</span>
            <span className="text-zinc-600">•</span>
            <span className={isBackendLive ? 'text-emerald-400 font-semibold' : 'text-amber-300'}>
              {isBackendLive ? 'OK' : 'READY'}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}

