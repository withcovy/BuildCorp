import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useCompanyStore } from '../../stores/companyStore';
import type { Agent } from '../../../shared/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[]; // base64 images
  timestamp: string;
}

export function ChatPanel() {
  const { selectedAgentId, chatPanelOpen, toggleChatPanel } = useUIStore();
  const { agents } = useCompanyStore();
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]); // 첨부된 이미지 (base64)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState('');
  const [loading, setLoading] = useState(false);
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  let selectedAgent: Agent | undefined;
  for (const teamAgents of Object.values(agents)) {
    selectedAgent = teamAgents?.find((a) => a.id === selectedAgentId);
    if (selectedAgent) break;
  }

  useEffect(() => {
    if (!selectedAgentId) return;
    window.electronAPI.chatHistory(selectedAgentId).then((history) => {
      setMessages(history.map((h: any) => ({
        id: h.id,
        role: h.role,
        content: h.content,
        timestamp: h.timestamp,
      })));
    });
  }, [selectedAgentId]);

  useEffect(() => {
    if (!selectedAgentId) return;
    const unsubscribe = window.electronAPI.onChatStream((data) => {
      if (data.agentId !== selectedAgentId) return;
      if (data.type === 'text') {
        setStreaming((prev) => prev + data.content);
        setToolActivity(null);
      } else if (data.type === 'tool_call') {
        setToolActivity(`Using ${data.name}...`);
      } else if (data.type === 'tool_result') {
        setToolActivity(null);
      } else if (data.type === 'done') {
        setStreaming('');
        setLoading(false);
        window.electronAPI.chatHistory(selectedAgentId).then((history) => {
          setMessages(history.map((h: any) => ({
            id: h.id, role: h.role, content: h.content, timestamp: h.timestamp,
          })));
        });
      } else if (data.type === 'error') {
        setStreaming('');
        setLoading(false);
        setToolActivity(null);
      }
    });
    return unsubscribe;
  }, [selectedAgentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  if (!chatPanelOpen || !selectedAgentId || !selectedAgent) return null;

  const handleSend = async () => {
    if ((!message.trim() && images.length === 0) || loading) return;
    const userMsg = message.trim();
    const userImages = [...images];
    setMessage('');
    setImages([]);
    setLoading(true);
    setStreaming('');

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setMessages((prev) => [...prev, {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMsg,
      images: userImages,
      timestamp: new Date().toISOString(),
    }]);

    // 이미지가 있으면 메시지에 표시 추가
    let fullMsg = userMsg;
    if (userImages.length > 0) {
      fullMsg += `\n\n[${userImages.length} image(s) attached]`;
    }

    await window.electronAPI.chatSend(selectedAgentId, fullMsg);
  };

  // 클립보드에서 이미지 붙여넣기
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setImages((prev) => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleClearChat = async () => {
    await window.electronAPI.chatClear(selectedAgentId);
    setMessages([]);
    setStreaming('');
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-slate-700 rounded border border-slate-600 flex items-center justify-center font-pixel text-sm">
          {selectedAgent.status === 'working' ? '⌨️' : '💤'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-slate-300 text-sm font-medium truncate">{selectedAgent.name}</div>
          <div className="text-slate-600 text-[10px]">
            {selectedAgent.llmProvider} / {selectedAgent.llmModel}
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="text-slate-700 hover:text-rose-400 text-[10px] transition-colors"
          title="Clear chat"
        >
          Clear
        </button>
        <button
          onClick={() => toggleChatPanel(false)}
          className="text-slate-600 hover:text-slate-400 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && !streaming && (
          <div className="text-center text-slate-600 text-xs py-8">
            Start a conversation with {selectedAgent.name}
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} images={msg.images} />
        ))}
        {streaming && (
          <MessageBubble role="assistant" content={streaming} />
        )}
        {toolActivity && (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-indigo-400">
            <span className="animate-spin">⚙</span>
            {toolActivity}
          </div>
        )}
        {loading && !streaming && !toolActivity && (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500">
            <span className="animate-pulse">●</span>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="px-3 pt-2 flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img} className="w-16 h-16 object-cover rounded-lg border border-slate-700" />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-800">
        {loading ? (
          <button
            onClick={async () => {
              await window.electronAPI.chatStop(selectedAgentId);
              setLoading(false);
              setStreaming('');
              setToolActivity(null);
            }}
            className="w-full bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 text-sm py-2 rounded-lg transition-colors"
          >
            ■ Stop
          </button>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              onPaste={handlePaste}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
                const lineHeight = 20;
                const maxHeight = lineHeight * 10;
                el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
              }}
              placeholder={`Message ${selectedAgent.name}...`}
              rows={1}
              className="flex-1 bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-indigo-500 transition-colors placeholder-slate-600 resize-none overflow-y-auto"
              style={{ maxHeight: '200px' }}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() && images.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm px-3 py-2 rounded-lg transition-colors"
            >
              ↑
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ role, content, images }: { role: string; content: string; images?: string[] }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
          role === 'user'
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-800 text-slate-300'
        }`}
      >
        {images && images.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {images.map((img, i) => (
              <img key={i} src={img} className="max-w-[200px] max-h-[150px] rounded object-cover" />
            ))}
          </div>
        )}
        {content}
      </div>
    </div>
  );
}
