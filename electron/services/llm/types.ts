// LLM 프로바이더 공통 인터페이스

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;    // tool 결과 반환 시
  toolCalls?: ToolCall[];  // assistant가 도구 호출 요청 시
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

export interface LLMRequestOptions {
  model: string;
  messages: LLMMessage[];
  tools?: ToolDefinition[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_use' | 'length' | 'error';
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMStreamChunk {
  type: 'text' | 'tool_call' | 'done' | 'error';
  content?: string;
  toolCall?: ToolCall;
  error?: string;
}

export interface LLMProvider {
  name: string;
  chat(options: LLMRequestOptions): Promise<LLMResponse>;
  chatStream(options: LLMRequestOptions): AsyncGenerator<LLMStreamChunk>;
  listModels(): Promise<string[]>;
  validateApiKey(): Promise<boolean>;
}
