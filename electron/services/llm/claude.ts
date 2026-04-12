import type {
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
  LLMMessage,
  ToolDefinition,
  ToolCall,
} from './types';

// Claude API 직접 호출 (SDK 없이 fetch 사용)
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export class ClaudeProvider implements LLMProvider {
  name = 'claude';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(options: LLMRequestOptions): Promise<LLMResponse> {
    const body = this.buildRequestBody(options);
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  async *chatStream(options: LLMRequestOptions): AsyncGenerator<LLMStreamChunk> {
    const body = this.buildRequestBody(options);
    body.stream = true;

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      yield { type: 'error', error: `Claude API error (${response.status}): ${error}` };
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentToolCall: Partial<ToolCall> | null = null;
    let toolCallArgs = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            yield { type: 'done' };
            return;
          }

          try {
            const event = JSON.parse(data);

            if (event.type === 'content_block_start') {
              if (event.content_block?.type === 'tool_use') {
                currentToolCall = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                };
                toolCallArgs = '';
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta?.type === 'text_delta') {
                yield { type: 'text', content: event.delta.text };
              } else if (event.delta?.type === 'input_json_delta') {
                toolCallArgs += event.delta.partial_json;
              }
            } else if (event.type === 'content_block_stop') {
              if (currentToolCall) {
                try {
                  currentToolCall.arguments = JSON.parse(toolCallArgs);
                } catch {
                  currentToolCall.arguments = {};
                }
                yield { type: 'tool_call', toolCall: currentToolCall as ToolCall };
                currentToolCall = null;
                toolCallArgs = '';
              }
            } else if (event.type === 'message_stop') {
              yield { type: 'done' };
              return;
            }
          } catch {
            // skip unparseable lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    yield { type: 'done' };
  }

  async listModels(): Promise<string[]> {
    return [
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-haiku-4-5-20251001',
    ];
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });
      return response.ok || response.status === 400; // 400 = valid key, bad request
    } catch {
      return false;
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    };
  }

  private buildRequestBody(options: LLMRequestOptions): any {
    const messages = this.convertMessages(options.messages);
    const body: any = {
      model: options.model,
      max_tokens: options.maxTokens || 4096,
      messages,
    };

    if (options.systemPrompt) {
      body.system = options.systemPrompt;
    }
    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }
    if (options.tools && options.tools.length > 0) {
      body.tools = options.tools.map(this.convertTool);
    }
    return body;
  }

  private convertMessages(messages: LLMMessage[]): any[] {
    const result: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') continue; // handled via system param

      if (msg.role === 'tool') {
        // Claude uses tool_result content blocks
        result.push({
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: msg.toolCallId,
            content: msg.content,
          }],
        });
      } else if (msg.role === 'assistant' && msg.toolCalls?.length) {
        const content: any[] = [];
        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }
        for (const tc of msg.toolCalls) {
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: tc.arguments,
          });
        }
        result.push({ role: 'assistant', content });
      } else {
        result.push({ role: msg.role, content: msg.content });
      }
    }
    return result;
  }

  private convertTool(tool: ToolDefinition): any {
    return {
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    };
  }

  private parseResponse(data: any): LLMResponse {
    let content = '';
    const toolCalls: ToolCall[] = [];

    for (const block of data.content || []) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input,
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: data.stop_reason === 'tool_use' ? 'tool_use' : 'stop',
      usage: data.usage ? {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      } : undefined,
    };
  }
}
