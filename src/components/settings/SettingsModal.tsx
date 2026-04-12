import { useState, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const [claudeKey, setClaudeKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [validating, setValidating] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, boolean | null>>({});

  useEffect(() => {
    if (!open) return;
    // Load saved settings
    window.electronAPI.settingsGet('llm.claude.apiKey').then((v: any) => v && setClaudeKey(v));
    window.electronAPI.settingsGet('llm.openai.apiKey').then((v: any) => v && setOpenaiKey(v));
    window.electronAPI.settingsGet('llm.ollama.baseUrl').then((v: any) => v && setOllamaUrl(v));
  }, [open]);

  const save = async (key: string, value: string) => {
    await window.electronAPI.settingsSet(key, value);
  };

  const validate = async (provider: string) => {
    setValidating(provider);
    const ok = await window.electronAPI.llmValidate(provider);
    setStatus((prev) => ({ ...prev, [provider]: ok }));
    setValidating(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl w-[500px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-slate-200 font-semibold">Settings</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
        </div>

        <div className="p-4 space-y-6">
          {/* Claude */}
          <ProviderSection
            name="Claude (Anthropic)"
            providerKey="claude"
            apiKey={claudeKey}
            onApiKeyChange={(v) => { setClaudeKey(v); save('llm.claude.apiKey', v); }}
            onValidate={() => validate('claude')}
            validating={validating === 'claude'}
            valid={status.claude}
          />

          {/* OpenAI */}
          <ProviderSection
            name="OpenAI"
            providerKey="openai"
            apiKey={openaiKey}
            onApiKeyChange={(v) => { setOpenaiKey(v); save('llm.openai.apiKey', v); }}
            onValidate={() => validate('openai')}
            validating={validating === 'openai'}
            valid={status.openai}
          />

          {/* Ollama */}
          <div>
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Ollama (Local)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                value={ollamaUrl}
                onChange={(e) => { setOllamaUrl(e.target.value); save('llm.ollama.baseUrl', e.target.value); }}
                placeholder="http://localhost:11434"
                className="flex-1 bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-indigo-500 transition-colors placeholder-slate-600"
              />
              <button
                onClick={() => validate('ollama')}
                disabled={validating === 'ollama'}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {validating === 'ollama' ? '...' : 'Test'}
              </button>
            </div>
            <StatusIndicator valid={status.ollama} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderSection({
  name, providerKey, apiKey, onApiKeyChange, onValidate, validating, valid,
}: {
  name: string;
  providerKey: string;
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  onValidate: () => void;
  validating: boolean;
  valid: boolean | null | undefined;
}) {
  return (
    <div>
      <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{name}</label>
      <div className="mt-2 flex gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="API Key"
          className="flex-1 bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-indigo-500 transition-colors placeholder-slate-600"
        />
        <button
          onClick={onValidate}
          disabled={validating || !apiKey}
          className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {validating ? '...' : 'Test'}
        </button>
      </div>
      <StatusIndicator valid={valid} />
    </div>
  );
}

function StatusIndicator({ valid }: { valid: boolean | null | undefined }) {
  if (valid === null || valid === undefined) return null;
  return (
    <div className={`mt-1 text-xs ${valid ? 'text-emerald-400' : 'text-rose-400'}`}>
      {valid ? 'Connected' : 'Connection failed'}
    </div>
  );
}
