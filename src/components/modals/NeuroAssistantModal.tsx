import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Gamepad2,
  Key,
  Building2,
  Armchair,
  Video,
  Shirt,
  Loader2,
  RotateCcw,
  Minus,
  MessageSquare,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  model?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  currentRoomName?: string;
  isGuest?: boolean;
}

export const NeuroAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpen,
  currentRoomName = 'Kantor Virtual',
  isGuest = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Halo! Saya **NEURO AI Assistant**, pemandu pintar kantor virtual **NEUROSIM PRO**.\n\n${
        isGuest
          ? 'Kamu saat ini sedang berada di **Public Lobby** sebagai Tamu. Kamu bebas menguji pergerakan analog/keyboard, ganti pakaian karakter, dan coba fasilitas kantor!'
          : `Kamu terhubung di **${currentRoomName}**.`
      }\n\nAda yang ingin ditanyakan seputar cara gerak, fasilitas duduk, atau kode kantor perusahaan?`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      model: 'Gemini AI',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          messages: messages.concat(userMsg).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text,
          })),
        }),
      });

      const data = await response.json();
      const reply = data.reply || 'Maaf, terjadi kendala saat memproses jawaban. Silakan coba kembali.';

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        model: data.model ? `Gemini (${data.model})` : 'Gemini AI',
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: 'Tidak dapat terhubung ke server AI saat ini. Kamu tetap bisa mengendalikan karakter dengan tombol WASD/Panah atau Analog Virtual!',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          model: 'Offline Fallback',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_QUESTIONS = [
    { label: 'Kontrol & Analog Mobile', icon: Gamepad2, query: 'Bagaimana cara bergerak dan mengendalikan karakter di desktop dan mobile?' },
    { label: 'Duduk & Interaksi [SPASI]', icon: Armchair, query: 'Bagaimana cara duduk di meja kerja workstation dan berdiri kembali?' },
    { label: 'Ganti Baju & Karakter', icon: Shirt, query: 'Bagaimana cara membuka kustomisasi karakter dan mengganti pakaian?' },
    { label: 'Public Lobby vs Private Office', icon: Building2, query: 'Apa perbedaan antara Public Lobby dan Private Company Office?' },
    { label: 'Cara Pakai Kode Akses', icon: Key, query: 'Bagaimana cara menggunakan Kode Akses Perusahaan (Role Boss, Humas, Staff)?' },
    { label: 'Kamera, Mic & Layar', icon: Video, query: 'Bagaimana cara menggunakan kamera, mikrofon, dan berbagi layar di kantor?' },
  ];

  return (
    <>
      {/* 1. FLOATING LAUNCHER BUTTON IN BOTTOM-RIGHT (POJOK KANAN BAWAH) */}
      {!isOpen && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 select-none">
          <button
            type="button"
            onClick={() => {
              if (onOpen) onOpen();
            }}
            className="group relative flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-500 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-teal-200"
            title="Buka Chatbot NEURO AI Assistant (Panduan Kantor)"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <span className="font-extrabold tracking-tight">Tanya AI</span>
            <span className="hidden sm:inline-block text-[10px] bg-slate-950/20 text-slate-950 px-1.5 py-0.5 rounded font-mono font-bold">
              Gemini
            </span>
          </button>
        </div>
      )}

      {/* 2. FLOATING POPUP CHAT WINDOW ANCHORED AT BOTTOM-RIGHT */}
      {isOpen && (
        <div className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[400px] max-w-[420px] h-[75vh] max-h-[570px] bg-[#0b1329]/95 backdrop-blur-md border-2 border-teal-500/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in slide-in-from-bottom-5 duration-200 select-none">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900/90 border-b border-teal-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/20 border border-teal-300/40 shrink-0">
                <Bot className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-wide text-white leading-tight">
                    NEURO AI
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    <Sparkles className="w-2.5 h-2.5 text-teal-400 animate-pulse" />
                    Gemini API
                  </span>
                </div>
                <span className="text-[10px] text-teal-400 block leading-tight font-medium">
                  {isGuest ? 'Mode Panduan Tamu' : currentRoomName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setMessages([
                    {
                      id: 'reset',
                      sender: 'assistant',
                      text: 'Percakapan telah direset. Silakan tanyakan hal seputar kontrol, fasilitas, atau kode akses!',
                      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                      model: 'Gemini AI',
                    },
                  ]);
                }}
                title="Reset Percakapan"
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                title="Tutup Chat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  <span className="text-[10px] font-mono text-slate-400">
                    {msg.sender === 'user' ? 'Anda' : 'NEURO AI'}
                  </span>
                  <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                  {msg.model && (
                    <span className="text-[8px] font-mono text-teal-400/80 border border-teal-500/20 px-1 rounded">
                      {msg.model}
                    </span>
                  )}
                </div>

                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  <span className="text-[10px] font-mono text-slate-400">NEURO AI</span>
                  <span className="text-[9px] text-teal-400 font-mono">Mengetik...</span>
                </div>
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-slate-400 text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                  <span>Memproses jawaban dengan Gemini...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-1.5 bg-slate-900/60 border-t border-slate-800/80 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            {QUICK_QUESTIONS.map((q, idx) => {
              const Icon = q.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q.query)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/90 hover:bg-teal-900/40 text-slate-300 hover:text-teal-200 border border-slate-700 hover:border-teal-500/40 whitespace-nowrap transition-all shrink-0 cursor-pointer"
                >
                  <Icon className="w-3 h-3 text-teal-400" />
                  <span>{q.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input Bar */}
          <div className="p-2.5 sm:p-3 bg-slate-900 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tanya cara main, kontrol analog, dll..."
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kirim</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
