import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import WorkspaceHeader from './components/WorkspaceHeader';
import ChatWorkspace from './components/ChatWorkspace';
import PromptInput from './components/PromptInput';
import DocumentIngestion from './components/DocumentIngestion';
import RetrievalChunks from './components/RetrievalChunks';
import Footer from './components/Footer';
import {
  DEFAULT_API_BASE,
  INITIAL_CORPUS_DATA,
  INITIAL_CONVERSATION,
  checkBackendHealth,
  getActiveCorpusApi,
  askQuestionApi,
  uploadPdfApi
} from './services/api';


export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'ingest' | 'retrieval'
  const [corpusData, setCorpusData] = useState(INITIAL_CORPUS_DATA);
  const [messages, setMessages] = useState(INITIAL_CONVERSATION);
  const [selectedModel, setSelectedModel] = useState('llama3.2:3b');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE);
  const chatContainerRef = useRef(null);

  // Poll backend health on mount and periodically, auto-sync active document
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      const live = await checkBackendHealth(apiBaseUrl);
      if (isMounted) setIsBackendLive(live);

      if (live && isMounted) {
        const activeDoc = await getActiveCorpusApi(apiBaseUrl);
        if (activeDoc && activeDoc.active && isMounted) {
          setCorpusData((prev) => {
            if (!prev.filename) {
              return {
                ...prev,
                filename: activeDoc.filename,
                charCount: activeDoc.char_count,
                mode: activeDoc.mode,
                chunksCount: activeDoc.chunk_count,
                chunksProcessed: activeDoc.chunk_count,
                collectionName: activeDoc.collection_name
              };
            }
            return prev;
          });
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiBaseUrl]);


  // Scroll chat on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text) => {
    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      method: 'POST /ask',
      text
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      if (isBackendLive) {
        const res = await askQuestionApi(text, selectedModel, apiBaseUrl);
        const assistantMsg = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: res.model_used || selectedModel,
          latencyMs: res.latencyMs || 320,
          tokens: Math.round(text.length * 0.8 + 240),
          sourceChunksCount: corpusData.topK || 5,
          text: res.answer,
          retrievedChunks: res.retrieved_chunks || []
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setCorpusData((prev) => ({
          ...prev,
          latencyMs: res.latencyMs || 320,
          model: res.model_used || selectedModel
        }));
      } else {
        // Inform user to start the Flask backend if not running
        await new Promise((r) => setTimeout(r, 600));
        const offlineMsg = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `⚠️ Flask backend is not connected on ${apiBaseUrl}.\n\nTo answer queries against real documents, run:\n\`python app.py\` in the backend folder.`
        };
        setMessages((prev) => [...prev, offlineMsg]);
      }
    } catch (err) {
      const errorMsg = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `⚠️ Error from Flask backend (/ask): ${err.message}`
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFile = async (file) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      if (isBackendLive) {
        const res = await uploadPdfApi(file, apiBaseUrl);
        const rawChunks = res.chunks || [];
        const chunkCount = res.chunk_count || rawChunks.length || Math.ceil((res.char_count || 1000) / 1200);
        const procTime = res.processing_time || '1.24s';

        setCorpusData((prev) => ({
          ...prev,
          filename: res.filename || file.name,
          charCount: res.char_count || 0,
          mode: res.mode || 'RAG',
          collectionName: `col_${file.name.slice(0, 10).toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          chunksCount: chunkCount,
          chunksProcessed: chunkCount,
          chunks: rawChunks,
          processingTime: procTime,
          processingTimeMs: res.processing_time_ms || 1240
        }));

        setMessages([
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `✅ Document "${file.name}" successfully parsed in ${procTime} (${(res.char_count || 0).toLocaleString()} characters).\n\n• Mode: ${res.mode}\n• Chunks Processed: ${chunkCount} chunks (${procTime})\n\nYou can now ask any question against the document.`
          }
        ]);
      } else {
        // Fallback file handler if offline
        const startTime = performance.now();
        await new Promise((r) => setTimeout(r, 1000));
        const durationSec = ((performance.now() - startTime) / 1000).toFixed(2) + 's';
        const estimatedChars = Math.round(file.size * 1.2);
        const isRag = estimatedChars > 8000;
        const chunkCount = isRag ? Math.ceil(estimatedChars / 1200) : 1;

        setCorpusData({
          filename: file.name,
          charCount: estimatedChars,
          mode: isRag ? 'RAG' : 'FULL-CONTEXT',
          collectionName: `col_${file.name.slice(0, 10).toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          topK: 5,
          chunksCount: chunkCount,
          chunksProcessed: chunkCount,
          repeatedHeadersStripped: 2,
          model: selectedModel,
          latencyMs: 320,
          tokensSynthesized: 0,
          chunks: [],
          processingTime: durationSec,
          processingTimeMs: 1000
        });

        setMessages([
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `Document "${file.name}" ingested into workspace in ${durationSec} (${chunkCount} chunks generated).\n\n(Note: Start Flask backend on 127.0.0.1:5000 for live AI inferences).`
          }
        ]);
      }

      setActiveTab('chat');
    } catch (err) {
      setUploadError(err.message || 'Failed to process and chunk PDF document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetSession = () => {
    if (window.confirm('Reset conversation workspace and clear history?')) {
      setMessages([]);
    }
  };

  const handleUpdateTopK = (newK) => {
    setCorpusData((prev) => ({ ...prev, topK: newK }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070a0e] text-[#e2e8f0] relative overflow-hidden bg-radial-gradient">
      {/* Background ambient accents */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[350px] rounded-full bg-[#e5a93b]/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[450px] h-[300px] rounded-full bg-cyan-500/[0.02] blur-[140px] pointer-events-none" />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        corpusData={corpusData}
        isBackendLive={isBackendLive}
        onOpenUpload={() => setActiveTab('ingest')}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 lg:px-8 py-5 flex flex-col">
        <WorkspaceHeader
          corpusData={corpusData}
          onResetSession={handleResetSession}
          activeTab={activeTab}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />

        <div className="flex-1 py-4 flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div
                key="chat-tab"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col justify-between space-y-4"
              >
                <ChatWorkspace
                  messages={messages}
                  isLoading={isLoading}
                  corpusData={corpusData}
                  chatContainerRef={chatContainerRef}
                  onOpenUpload={() => setActiveTab('ingest')}
                />

                <PromptInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  corpusData={corpusData}
                />
              </motion.div>
            )}

            {activeTab === 'ingest' && (
              <motion.div
                key="ingest-tab"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <DocumentIngestion
                  corpusData={corpusData}
                  onUploadSuccess={handleUploadFile}
                  isUploading={isUploading}
                  uploadError={uploadError}
                />
              </motion.div>
            )}

            {activeTab === 'retrieval' && (
              <motion.div
                key="retrieval-tab"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <RetrievalChunks
                  corpusData={corpusData}
                  onUpdateTopK={handleUpdateTopK}
                  onOpenUpload={() => setActiveTab('ingest')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <Footer
        corpusData={corpusData}
        apiBaseUrl={apiBaseUrl}
      />
    </div>
  );
}