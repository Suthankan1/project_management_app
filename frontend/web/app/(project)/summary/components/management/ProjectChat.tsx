'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useChat } from '@/hooks/chat/useChat';
import { motion } from 'framer-motion';

import { ChatMessage } from '@/app/(project)/project/[id]/chat/components/chat';

/**
 * A real-time chat widget for project team members.
 * Fetches recent messages and allows sending new ones directly from the summary.
 */
export function ProjectChat({ projectId }: { projectId: number | string }) {
  const { messages, sendMessage, currentUser } = useChat(projectId.toString());
  const [inputValue, setInputValue] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the chat container whenever new messages arrive
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full min-h-[340px]">
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-cu-bg-secondary" ref={scrollContainerRef}>
         {messages && messages.length > 0 ? messages.slice(-50).map((msg: ChatMessage, i: number) => {
           const isMe = msg.sender === currentUser;
           return (
             <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
               {!isMe && <span className="text-[10px] font-semibold text-cu-text-muted mb-1 ml-1">{msg.sender}</span>}
               <div className={`px-3 py-2 text-[13px] break-words ${isMe ? 'bg-cu-primary text-white rounded-2xl rounded-tr-sm' : 'bg-cu-bg border border-cu-border text-cu-text-primary rounded-2xl rounded-tl-sm shadow-cu-sm'}`} style={{ maxWidth: '85%' }}>
                 {msg.content}
               </div>
             </div>
           )
         }) : (
           <div className="h-full flex flex-col items-center justify-center text-cu-text-muted">
             <MessageSquare size={24} className="mb-2 opacity-30" />
             <p className="text-[13px]">No team messages yet</p>
           </div>
         )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-cu-border bg-cu-bg shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2 relative">
           <input 
             type="text" 
             value={inputValue}
             onChange={e => setInputValue(e.target.value)}
             placeholder="Type a message to team..."
             className="w-full text-[13px] rounded-lg border border-cu-border bg-cu-bg-secondary text-cu-text-primary placeholder:text-cu-text-muted px-3 py-2 pr-10 focus:outline-none focus:border-cu-primary focus:ring-1 focus:ring-cu-primary/20 transition-all"
           />
           <button type="submit" disabled={!inputValue.trim()} className="absolute right-1 p-1.5 rounded-md text-cu-primary hover:bg-cu-primary/10 disabled:opacity-40 transition-colors">
             <Send size={15} />
           </button>
        </form>
      </div>
    </motion.div>
  )
}
