import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  HelpCircle,
  Gamepad2,
  Key,
  Building2,
  Armchair,
  Video,
  Shirt,
  Loader2,
  RotateCcw,
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
  currentRoomName?: string;
  isGuest?: boolean;
}

export const NeuroAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentRoomName = 'Kantor Virtual',
  isGuest = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Halo! Saya **NEURO AI Assistant**, asisten resmi panduan gameplay & kantor virtual **NEUROSIM PRO**.\n\n${
        isGuest
          ? 'Saat ini kamu berada di **Public Lobby** sebagai Tamu. Kamu bisa bebas mencoba gerak, mengganti pakaian karakter, dan mencoba fasilitas kantor!'
          : `Saat ini kamu terhubung di **${currentRoomName}**.`
      }\n\nAda yang bisa saya bantu terkait kontrol, fasilitas, atau kode akses kantor perusahaan?`,
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

  if (!isOpen) return null;

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
    { label: 'Kamera, Mic & Screen Share', icon: Video, query: 'Bagaimana cara menggunakan kamera, mikrofon, dan berbagi layar di kantor?' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border-2 border-teal-500/50 rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[700px] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-teal-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-300/40">
              <Bot className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
                  NEURO AI Assistant
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    <Sparkles className="w-3 h-3 text-teal-400 animate-pulse" />
                    Gemini API
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Panduan Interaktif Virtual Office & Gameplay NEUROSIM PRO
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMessages([
                  {
                    id: 'reset',
                    sender: 'assistant',
                    text: 'Percakapan telah direset. Silakan tanyakan hal apa pun seputar permainan dan fasilitas kantor virtual!',
                    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    model: 'Gemini AI',
                  },
                ]);
              }}
              title="Reset Percakapan"
              className="p-2 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-mono text-slate-400">
                  {msg.sender === 'user' ? 'Anda' : 'NEURO AI'}
                </span>
                <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                {msg.model && (
                  <span className="text-[9px] font-mono text-teal-400/70 border border-teal-500/20 px-1 rounded">
                    {msg.model}
                  </span>
                )}
              </div>

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-md ${
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
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-mono text-slate-400">NEURO AI</span>
                <span className="text-[10px] text-teal-400 font-mono">Sedang berpikir...</span>
              </div>
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-tl-none px-4 py-3 text-slate-400 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                <span>Memproses panduan dengan model Gemini...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800 overflow-x-auto no-scrollbar flex items-center gap-2">
          {QUICK_QUESTIONS.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q.query)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-teal-900/40 text-slate-300 hover:text-teal-200 border border-slate-700/70 hover:border-teal-500/40 whitespace-nowrap transition-all"
              >
                <Icon className="w-3.5 h-3.5 text-teal-400" />
                <span>{q.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800">
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
              placeholder="Tanyakan cara bermain, kontrol analog, kode akses kantor..."
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

