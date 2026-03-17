import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, X, Send, MessageSquare } from 'lucide-react';
import { getAIWatchCompanionResponse } from '../../lib/aiService';
import { cn } from '../../lib/utils';

export const AICompanion = ({ 
  mediaTitle, 
  chatHistory 
}: { 
  mediaTitle: string; 
  chatHistory: string[]; 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setResponse(null);
    try {
      const res = await getAIWatchCompanionResponse(mediaTitle, chatHistory, prompt);
      setResponse(res);
      setPrompt('');
    } catch (e) {
      setResponse("Oops, my movie knowledge bank is temporarily offline!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-[150]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-72 bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 bg-gradient-to-r from-[#0A84FF] to-[#0051FF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-white" />
                <span className="text-sm font-bold text-white">Watch Companion</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-60 overflow-y-auto no-scrollbar">
              {response ? (
                <div className="bg-white/5 rounded-2xl p-3 text-xs leading-relaxed">
                  <p className="text-gray-300 italic mb-2">"{mediaTitle}" Companion says:</p>
                  <p>{response}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Ask me anything about the show or get a summary of the chat!
                </p>
              )}
              {isLoading && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1.5 h-1.5 bg-[#0A84FF] rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-[#0A84FF] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-[#0A84FF] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>

            <div className="p-4 pt-0">
              <div className="relative">
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                  placeholder="Ask the Companion..."
                  className="w-full bg-black/40 border border-white/10 rounded-full py-2 pl-4 pr-10 text-[11px] focus:outline-none focus:border-[#0A84FF]"
                />
                <button 
                  onClick={handleAsk}
                  disabled={isLoading || !prompt.trim()}
                  className="absolute right-2 top-1.5 text-[#0A84FF] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90",
          isOpen ? "bg-white text-black" : "bg-[#0A84FF] text-white hover:scale-110"
        )}
      >
        {isOpen ? <MessageSquare className="w-6 h-6" /> : <Sparkles className="w-7 h-7" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
          </span>
        )}
      </button>
    </div>
  );
};
