import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { QUICK_PROMPTS } from '../services/api';

export default function PromptInput({
  onSendMessage,
  isLoading,
  corpusData
}) {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef(null);
  const hasDoc = !!corpusData.filename;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePromptClick = (prompt) => {
    const query = prompt.replace(/^[\p{Emoji}\s]+/u, '').trim();
    const targetDoc = corpusData.filename ? ` against ${corpusData.filename}` : '';
    const fullQuery = `Provide an executive assessment of ${query.toLowerCase()}${targetDoc}.`;
    setInputText(fullQuery);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Quick Prompts Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[10px] font-mono tracking-wider text-zinc-500 font-semibold uppercase shrink-0">
          PROMPTS:
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(prompt)}
              className="px-2.5 py-1 rounded-lg bg-[#0e131d] hover:bg-[#151c2a] border border-white/[0.06] hover:border-[#e5a93b]/40 text-zinc-300 hover:text-white transition-all cursor-pointer font-sans whitespace-nowrap text-xs flex items-center gap-1.5 active:scale-95"
            >
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Box */}
      <form
        onSubmit={handleSubmit}
        className="relative rounded-2xl bg-[#0a0e14]/90 border border-white/[0.09] focus-within:border-[#e5a93b]/50 focus-within:shadow-[0_0_20px_rgba(229,169,59,0.1)] transition-all overflow-hidden"
      >
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            hasDoc
              ? `Ask a targeted question against ${corpusData.filename} (POST /ask)...`
              : 'Upload a PDF document first or ask a question...'
          }
          rows={2}
          disabled={isLoading}
          className="w-full bg-transparent px-4 py-3.5 text-sm sm:text-[15px] text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none font-sans leading-relaxed"
        />

        {/* Input Card Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#080b10]/80 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
            <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-400">
              k={corpusData.topK || 5} Chroma
            </span>
            <span>•</span>
            <span className="hidden sm:inline">⌘ + Enter to execute</span>
            <span className="sm:hidden">Ctrl+Enter</span>
          </div>

          <motion.button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            whileTap={{ scale: 0.97 }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              inputText.trim() && !isLoading
                ? 'bg-[#e5a93b] text-black hover:bg-[#f3ba4f] shadow-[0_0_15px_rgba(229,169,59,0.3)]'
                : 'bg-white/[0.05] text-zinc-500 cursor-not-allowed border border-white/[0.04]'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <span>Processing</span>
              </>
            ) : (
              <>
                <span>Execute</span>
                <span className="text-sm font-bold">↑</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}

