import { useState, useEffect } from 'react';
import { useCompanyStore } from '../../stores/companyStore';
import type { Agent, LLMProvider } from '../../../shared/types';

interface Props {
  agentId: string;
  onClose: () => void;
}

const PROVIDERS: { value: LLMProvider; label: string }[] = [
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'ollama', label: 'Ollama (Local)' },
];

const DEFAULT_MODELS: Record<LLMProvider, string[]> = {
  claude: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001', 'claude-opus-4-20250514'],
  openai: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o4-mini'],
  ollama: ['llama3', 'codellama', 'mistral', 'mixtral'],
};

export function AgentEditPanel({ agentId, onClose }: Props) {
  const { agents, updateAgent } = useCompanyStore();

  let agent: Agent | undefined;
  for (const teamAgents of Object.values(agents)) {
    agent = teamAgents?.find((a) => a.id === agentId);
    if (agent) break;
  }

  const [form, setForm] = useState({
    name: '',
    specialty: '',
    personality: '',
    systemPrompt: '',
    llmProvider: 'claude' as LLMProvider,
    llmModel: '',
    apiKey: '',
  });

  useEffect(() => {
    if (!agent) return;
    setForm({
      name: agent.name,
      specialty: agent.specialty,
      personality: agent.personality,
      systemPrompt: agent.systemPrompt,
      llmProvider: agent.llmProvider,
      llmModel: agent.llmModel,
      apiKey: getAgentApiKey(agentId),
    });
  }, [agentId, agent?.name]);

  if (!agent) return null;

  const handleSave = () => {
    updateAgent(agentId, {
      name: form.name.trim() || agent!.name,
      specialty: form.specialty,
      personality: form.personality,
      systemPrompt: form.systemPrompt,
      llmProvider: form.llmProvider,
      llmModel: form.llmModel,
    });
    // API 키는 localStorage에 에이전트별로 저장
    saveAgentApiKey(agentId, form.apiKey);
    onClose();
  };

  const models = DEFAULT_MODELS[form.llmProvider] || [];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl w-[500px] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-slate-200 font-semibold">Agent Settings</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Name */}
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-indigo-500 placeholder-slate-600"
            />
          </Field>

          {/* Specialty */}
          <Field label="Specialty" hint="e.g. Frontend Developer, Marketing Writer">
            <input
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              placeholder="What this agent is good at"
              className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-indigo-500 placeholder-slate-600"
            />
          </Field>

          {/* Personality */}
          <Field label="Personality" hint="e.g. Friendly, Professional, Concise">
            <input
              value={form.personality}
              onChange={(e) => setForm({ ...form, personality: e.target.value })}
              placeholder="Communication style"
              className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-indigo-500 placeholder-slate-600"
            />
          </Field>

          <div className="border-t border-slate-800 pt-4">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">AI Configuration</div>

            {/* Provider */}
            <Field label="LLM Provider">
              <select
                value={form.llmProvider}
                onChange={(e) => {
                  const provider = e.target.value as LLMProvider;
                  setForm({
                    ...form,
                    llmProvider: provider,
                    llmModel: DEFAULT_MODELS[provider]?.[0] || '',
                  });
                }}
                className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-indigo-500"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>

            {/* Model */}
            <Field label="Model">
              <select
                value={form.llmModel}
                onChange={(e) => setForm({ ...form, llmModel: e.target.value })}
                className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-indigo-500"
              >
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>

            {/* API Key */}
            {form.llmProvider !== 'ollama' && (
              <Field label="API Key" hint="This agent's personal API key">
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder={`Enter ${form.llmProvider} API key`}
                  className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-indigo-500 placeholder-slate-600"
                />
              </Field>
            )}
          </div>

          {/* System Prompt */}
          <Field label="System Prompt" hint="Custom instructions (leave empty for auto-generated)">
            <textarea
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
              placeholder={`Auto: "You are ${form.name}. Your specialty is ${form.specialty || '...'}."`}
              rows={4}
              className="w-full bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-indigo-500 placeholder-slate-600 resize-none"
            />
          </Field>

          {/* Save */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2.5 rounded-lg font-medium transition-colors"
            >
              Save
            </button>
            <button onClick={onClose} className="px-4 text-slate-400 hover:text-slate-300 text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-slate-400 text-xs font-medium">{label}</label>
      {children}
      {hint && <div className="text-slate-600 text-[10px]">{hint}</div>}
    </div>
  );
}

// 에이전트별 API 키 저장/조회 (localStorage)
export function getAgentApiKey(agentId: string): string {
  return localStorage.getItem(`buildcorp_agent_apikey_${agentId}`) || '';
}

export function saveAgentApiKey(agentId: string, key: string) {
  if (key) {
    localStorage.setItem(`buildcorp_agent_apikey_${agentId}`, key);
  } else {
    localStorage.removeItem(`buildcorp_agent_apikey_${agentId}`);
  }
}
