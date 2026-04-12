import { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useCompanyStore } from '../../stores/companyStore';
import type { Agent } from '../../../shared/types';

export function ChatPanel() {
  const { selectedAgentId, chatPanelOpen, toggleChatPanel } = useUIStore();
  const { agents } = useCompanyStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

  if (!chatPanelOpen || !selectedAgentId) return null;

  // Find the agent
  let selectedAgent: Agent | undefined;
  for (const teamAgents of Object.values(agents)) {
    selectedAgent = teamAgents?.find((a) => a.id === selectedAgentId);
    if (selectedAgent) break;
  }

  if (!selectedAgent) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);

    // Placeholder - will connect to LLM in Phase 2
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `[${selectedAgent!.name}] This is a placeholder response. LLM integration coming in Phase 2!` },
      ]);
    }, 500);
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
          <div className="text-slate-600 text-[10px]">{selectedAgent.specialty || selectedAgent.llmProvider}</div>
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
        {messages.length === 0 && (
          <div className="text-center text-slate-600 text-xs py-8">
            Start a conversation with {selectedAgent.name}
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Message ${selectedAgent.name}...`}
            className="flex-1 bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-indigo-500 transition-colors placeholder-slate-600"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-sm px-3 py-2 rounded-lg transition-colors"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
