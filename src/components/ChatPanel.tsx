/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { translations, Language } from '../translations';
import { Send, User, Shield, MessageCircle, X, Sparkles, Utensils } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string; // ID of logged-in entity ('admin' or a staff user id)
  activeChatUserId: string; // In staff portal: 'admin'. In admin portal: the selected user id.
  activeChatUserName: string;
  onSendMessage: (text: string, receiverId: string) => void;
  lang: Language;
  variant?: 'inline' | 'floating';
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  activeChatUserId,
  activeChatUserName,
  onSendMessage,
  lang,
  variant = 'inline',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  // Filter messages relevant to this conversation
  const conversationMessages = messages.filter(
    (m) =>
      (m.senderId === currentUserId && m.receiverId === activeChatUserId) ||
      (m.senderId === activeChatUserId && m.receiverId === currentUserId)
  );

  // Unread messages count for floating bubble (messages sent by the other party)
  const incomingMessages = conversationMessages.filter(m => m.senderId !== currentUserId);
  const lastIncomingId = incomingMessages.length > 0 ? incomingMessages[incomingMessages.length - 1].id : '';
  const [lastViewedMsgId, setLastViewedMsgId] = useState('');
  const lastMsgId = conversationMessages.length > 0 ? conversationMessages[conversationMessages.length - 1].id : '';

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      if (lastIncomingId) {
        setLastViewedMsgId(lastIncomingId);
      }
    }
  }, [lastMsgId, isOpen, lastIncomingId]);

  const unreadCount = incomingMessages.filter(m => m.id !== lastViewedMsgId && m.timestamp > (localStorage.getItem('chat_last_read') || '')).length;

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && lastIncomingId) {
      setLastViewedMsgId(lastIncomingId);
      localStorage.setItem('chat_last_read', new Date().toISOString());
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), activeChatUserId);
    setInputText('');
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const content = (
    <div 
      id="live-chat-panel-content" 
      className={`flex flex-col bg-white/95 backdrop-blur-xl border border-orange-100 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
        variant === 'floating' 
          ? 'w-[360px] max-w-[calc(100vw-32px)] h-[500px] fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-5' 
          : 'h-[450px] w-full'
      }`}
    >
      {/* Header with Food-Themed Gold/Orange Gradient */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 px-4 py-3.5 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-3">
          {activeChatUserId === 'admin' ? (
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner animate-pulse">
              <Shield className="w-5 h-5 text-amber-100" id="admin-chat-shield" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold shadow-inner">
              <User className="w-5 h-5 text-orange-100" id="user-chat-icon" />
            </div>
          )}
          <div>
            <h4 className="font-extrabold text-sm tracking-tight flex items-center gap-1">
              {activeChatUserId === 'admin' ? t.chatWithAdmin : activeChatUserName}
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            </h4>
            <span className="text-[10px] text-amber-100 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
              {lang === 'bn' ? 'মেস হেল্পডেস্ক অনলাইন' : 'Mess Helpdesk Active'}
            </span>
          </div>
        </div>

        {variant === 'floating' && (
          <button 
            onClick={handleToggle}
            className="p-1.5 hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto bg-orange-50/20 space-y-4">
        {conversationMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 mb-3">
              <Utensils className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
              {lang === 'bn'
                ? 'খাবার বা মেস সংক্রান্ত যেকোনো প্রয়োজনে অ্যাডমিনকে মেসেজ দিন। অ্যাডমিন দ্রুত সাড়া দেবেন!'
                : 'Send a message to the Admin regarding food demands or issues. Admin will reply soon!'}
            </p>
          </div>
        ) : (
          conversationMessages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[9px] text-slate-400 mb-1 px-1">
                  {isMe ? (lang === 'bn' ? 'আপনি' : 'You') : msg.senderName}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-md transition-all ${
                    isMe
                      ? 'bg-gradient-to-br from-orange-600 to-amber-500 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-orange-100/50 rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed break-words whitespace-pre-wrap font-medium">{msg.text}</p>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form with Premium Styling */}
      <form onSubmit={handleSend} className="p-3 border-t border-orange-50 bg-white flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t.writeMessage}
          className="flex-1 bg-orange-50/30 border border-orange-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition"
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white p-2.5 rounded-xl flex items-center justify-center shadow-lg hover:shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Send className="w-4 h-4" id="send-chat-btn" />
        </button>
      </form>
    </div>
  );

  if (variant === 'inline') {
    return content;
  }

  return (
    <>
      {/* Floating Circular Badge Button */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-tr from-orange-600 to-amber-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-orange-500/30 active:scale-95 transition-all hover:scale-105 cursor-pointer border border-white/20`}
        title={lang === 'bn' ? 'অ্যাডমিন সাপোর্ট চ্যাট' : 'Chat with Admin'}
      >
        {isOpen ? (
          <X className="w-6 h-6 animate-spin-once" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-2.5 -right-2.5 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce border-2 border-white">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Floating Chat Box Overlay */}
      {isOpen && content}
    </>
  );
};
