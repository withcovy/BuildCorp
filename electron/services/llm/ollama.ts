import type {
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
  LLMMessage,
  ToolDefinition,
  ToolCall,
} from './types';

export class OllamaProvider implements LLMProvider {
  name = 'ollama';
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async chat(options: LLMRequestOptions): Promise<LLMResponse> {
    const body = this.buildRequestBody(options);
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, stream: false }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  async *chatStream(options: LLMRequestOptions): AsyncGenerator<LLMStreamChunk> {
    const body = this.buildRequestBody(options);
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, stream: true }),
    });

    if (!response.ok) {
      const error = await response.text();
      yield { type: 'error', error: `Ollama error (${response.status}): ${error}` };
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);

            if (data.message?.content) {
              yield { type: 'text', content: data.message.content };
            }

            if (data.message?.tool_calls) {
              for (const tc of data.message.tool_calls) {
                yield {
                  type: 'tool_call',
                  toolCall: {
                    id: `ollama_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                    name: tc.function.name,
                    arguments: tc.function.arguments || {},
                  },
                };
              }
            }

            if (data.done) {
              yield { type: 'done' };
              return;
            }
          } catch {
            // skip
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    yield { type: 'done' };
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data: any = await response.json();
      return (data.models || []).map((m: any) => m.name);
    } catch {
      return [];
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private buildRequestBody(options: LLMRequestOptions): any {
    const messages = this.convertMessages(options.messages, options.systemPrompt);
    const body: any = {
      model: options.model,
      messages,
    };

    if (options.tools && options.tools.length > 0) {
      body.tools = options.tools.map(this.convertTool);
    }
    if (options.temperature !== undefined) {
      body.options = { temperature: options.temperature };
    }
    return body;
  }

  private convertMessages(messages: LLMMessage[], systemPrompt?: string): any[] {
    const result: any[] = [];

    if (systemPrompt) {
      result.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      if (msg.role === 'tool') {
        result.push({
          role: 'tool',
          content: msg.content,
        });
      } else if (msg.role === 'assistant' && msg.toolCalls?.length) {
        result.push({
          role: 'assistant',
          content: msg.content || '',
          tool_calls: msg.toolCalls.map((tc) => ({
            function: {
              name: tc.name,
              arguments: tc.arguments,
            },
          })),
        });
      } else {
        result.push({ role: msg.role, content: msg.content });
      }
    }
    return result;
  }

  private convertTool(tool: ToolDefinition): any {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    };
  }

  private parseResponse(data: any): LLMResponse {
    const message = data.message || {};
    const toolCalls: ToolCall[] = (message.tool_calls || []).map((tc: any, i: number) => ({
      id: `ollama_${Date.now()}_${i}`,
      name: tc.function.name,
      arguments: tc.function.arguments || {},
    }));

    return {
      content: message.content || '',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: toolCalls.length > 0 ? 'tool_use' : 'stop',
    };
  }
}
