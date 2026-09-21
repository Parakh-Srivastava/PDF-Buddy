import React from 'react';

export default function Footer({ corpusData, apiBaseUrl }) {
  const cleanApiHost = apiBaseUrl.replace(/^https?:\/\//, '');
  const hasDoc = !!corpusData.filename;

  return (
    <footer className="w-full border-t border-white/[0.06] bg-[#070a0e]/95 px-4 lg:px-6 py-2.5 text-[11px] font-mono text-zinc-500">
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e5a93b]" />
          <span className="text-zinc-400">ContextFlow Enterprise Suite</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">Obsidian & Gold Edition</span>
        </div>

        <div className="flex items-center gap-4 text-zinc-400">
          <div>
            Flask API:{' '}
            <span className="text-zinc-200">{cleanApiHost}</span>
          </div>
          <div className="hidden sm:inline text-zinc-600">•</div>
          <div className="truncate max-w-[280px]">
            Active File:{' '}
            <span className={hasDoc ? 'text-[#e5a93b] font-medium' : 'text-zinc-500'}>
              {hasDoc ? `${corpusData.filename} (${corpusData.chunksCount || 0} Chunks)` : 'No document loaded'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

