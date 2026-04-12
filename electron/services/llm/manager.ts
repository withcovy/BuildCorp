import type { LLMProvider } from './types';
import { ClaudeProvider } from './claude';
import { OpenAIProvider } from './openai';
import { OllamaProvider } from './ollama';
import type { LLMProvider as LLMProviderType } from '../../../shared/types';

// API 키 등 설정은 SQLite settings 테이블에서 관리
interface ProviderConfig {
  claude?: { apiKey: string };
  openai?: { apiKey: string };
  ollama?: { baseUrl: string };
}

export class LLMManager {
  private providers: Map<string, LLMProvider> = new Map();
  private config: ProviderConfig = {};

  configure(config: ProviderConfig) {
    this.config = config;
    this.providers.clear();

    if (config.claude?.apiKey) {
      this.providers.set('claude', new ClaudeProvider(config.claude.apiKey));
    }
    if (config.openai?.apiKey) {
      this.providers.set('openai', new OpenAIProvider(config.openai.apiKey));
    }
    // Ollama는 API 키 불필요, 항상 추가 시도
    this.providers.set('ollama', new OllamaProvider(config.ollama?.baseUrl));
  }

  getProvider(name: LLMProviderType): LLMProvider | null {
    return this.providers.get(name) || null;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async validateProvider(name: string): Promise<boolean> {
    const provider = this.providers.get(name);
    if (!provider) return false;
    return provider.validateApiKey();
  }

  async listModels(providerName: string): Promise<string[]> {
    const provider = this.providers.get(providerName);
    if (!provider) return [];
    return provider.listModels();
  }
}

// 싱글톤
export const llmManager = new LLMManager();
