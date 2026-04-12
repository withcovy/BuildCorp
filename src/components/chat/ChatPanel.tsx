import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useCompanyStore } from '../../stores/companyStore';
import type { Agent } from '../../../shared/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function ChatPanel() {
  const { selectedAgentId, chatPanelOpen, toggleChatPanel } = useUIStore();
  const { agents, updateAgent } = useCompanyStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState('');
  const [loading, setLoading] = useState(false);
  const [toolActivity, setToolActivity] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find agent
  let selectedAgent: Agent | undefined;
  for (const teamAgents of Object.values(agents)) {
    selectedAgent = teamAgents?.find((a) => a.id === selectedAgentId);
    if (selectedAgent) break;
  }

  // Load chat history when agent changes
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

  // Subscribe to stream events
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
        // Reload history to get saved message
        window.electronAPI.chatHistory(selectedAgentId).then((history) => {
          setMessages(history.map((h: any) => ({
            id: h.id,
            role: h.role,
            content: h.content,
            timestamp: h.timestamp,
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

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  if (!chatPanelOpen || !selectedAgentId || !selectedAgent) return null;

  const handleSend = async () => {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    setMessage('');
    setLoading(true);
    setStreaming('');

    // Optimistic add user message
    setMessages((prev) => [...prev, {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMsg,
      timestamp: new Date().toISOString(),
    }]);

    await window.electronAPI.chatSend(selectedAgentId, userMsg);
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
            {selectedAgent.llmProvider} / {selectedAgent.llmModel.split('-').slice(0, 2).join('-')}
          </div>
        </div>
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
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
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
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder={`Message ${selectedAgent.name}...`}
              rows={1}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
                const lineHeight = 20;
                const maxHeight = lineHeight * 10;
                el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
              }}
              className="flex-1 bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-indigo-500 transition-colors placeholder-slate-600 resize-none overflow-y-auto"
              style={{ maxHeight: '200px' }}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
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

function MessageBubble({ role, content }: { role: string; content: string }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
          role === 'user'
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-800 text-slate-300'
        }`}
      >
        {content}
      </div>
    </div>
  );
}
