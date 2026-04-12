import { llmManager } from '../llm/manager';
import { AGENT_TOOLS, executeTool } from './tools';
import type { LLMMessage, LLMStreamChunk, ToolDefinition } from '../llm/types';
import type { Agent } from '../../../shared/types';

const MAX_TOOL_LOOPS = 20; // 무한 루프 방지

export interface AgentRunOptions {
  agent: Agent;
  userMessage: string;
  chatHistory: LLMMessage[];
  workingDir: string;
  enabledTools?: string[]; // 허용된 도구 이름. 없으면 전부 허용
  onStream?: (chunk: AgentStreamEvent) => void;
}

export type AgentStreamEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; name: string; args: Record<string, any> }
  | { type: 'tool_result'; name: string; result: string }
  | { type: 'done'; content: string }
  | { type: 'error'; error: string };

export async function runAgent(options: AgentRunOptions): Promise<string> {
  const { agent, userMessage, chatHistory, workingDir, enabledTools, onStream } = options;

  const provider = llmManager.getProvider(agent.llmProvider);
  if (!provider) {
    const error = `LLM provider "${agent.llmProvider}" not configured`;
    onStream?.({ type: 'error', error });
    throw new Error(error);
  }

  // 도구 필터링 (인벤토리에서 장착된 것만)
  const tools = getEnabledTools(enabledTools);

  // 대화 히스토리 구성
  const messages: LLMMessage[] = [
    ...chatHistory,
    { role: 'user', content: userMessage },
  ];

  // System prompt 구성
  const systemPrompt = buildSystemPrompt(agent);

  let fullResponse = '';
  let loopCount = 0;

  // Claude CLI는 자체적으로 도구를 사용하므로 단순 스트리밍
  if (agent.llmProvider === 'claude-cli') {
    const stream = provider.chatStream({
      model: agent.llmModel,
      messages,
      systemPrompt,
      agentId: agent.id,
      workingDir,
    } as any);

    for await (const chunk of stream) {
      if (chunk.type === 'text' && chunk.content) {
        fullResponse += chunk.content;
        onStream?.({ type: 'text', content: chunk.content });
      } else if (chunk.type === 'error') {
        onStream?.({ type: 'error', error: chunk.error || 'Unknown error' });
        return fullResponse;
      }
    }
    onStream?.({ type: 'done', content: fullResponse });
    return fullResponse;
  }

  // API 프로바이더: 도구 사용 루프
  while (loopCount < MAX_TOOL_LOOPS) {
    loopCount++;

    if (onStream) {
      // 스트리밍 모드
      const chunks: LLMStreamChunk[] = [];
      let textContent = '';
      const toolCalls: { id: string; name: string; arguments: Record<string, any> }[] = [];

      const stream = provider.chatStream({
        model: agent.llmModel,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        systemPrompt,
        maxTokens: 4096,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'text' && chunk.content) {
          textContent += chunk.content;
          onStream({ type: 'text', content: chunk.content });
        } else if (chunk.type === 'tool_call' && chunk.toolCall) {
          toolCalls.push(chunk.toolCall);
          onStream({ type: 'tool_call', name: chunk.toolCall.name, args: chunk.toolCall.arguments });
        } else if (chunk.type === 'error') {
          onStream({ type: 'error', error: chunk.error || 'Unknown error' });
          return textContent;
        }
      }

      // 도구 호출이 없으면 완료
      if (toolCalls.length === 0) {
        fullResponse = textContent;
        onStream({ type: 'done', content: fullResponse });
        return fullResponse;
      }

      // assistant 메시지 (도구 호출 포함) 추가
      messages.push({
        role: 'assistant',
        content: textContent,
        toolCalls,
      });

      // 도구 실행 및 결과 추가
      for (const tc of toolCalls) {
        const result = await executeTool(tc.name, tc.arguments, workingDir);
        onStream({ type: 'tool_result', name: tc.name, result: truncateResult(result) });
        messages.push({
          role: 'tool',
          content: truncateResult(result),
          toolCallId: tc.id,
        });
      }

      // 다음 루프에서 LLM이 결과를 보고 계속 진행
    } else {
      // 비스트리밍 모드
      const response = await provider.chat({
        model: agent.llmModel,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        systemPrompt,
        maxTokens: 4096,
      });

      if (!response.toolCalls || response.toolCalls.length === 0) {
        fullResponse = response.content;
        return fullResponse;
      }

      // assistant 메시지 추가
      messages.push({
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls,
      });

      // 도구 실행
      for (const tc of response.toolCalls) {
        const result = await executeTool(tc.name, tc.arguments, workingDir);
        messages.push({
          role: 'tool',
          content: truncateResult(result),
          toolCallId: tc.id,
        });
      }
    }
  }

  // 루프 한도 도달
  const limitMsg = '[Max tool use loops reached]';
  onStream?.({ type: 'done', content: fullResponse || limitMsg });
  return fullResponse || limitMsg;
}

function getEnabledTools(enabledTools?: string[]): ToolDefinition[] {
  if (!enabledTools) return AGENT_TOOLS;
  return AGENT_TOOLS.filter((t) => enabledTools.includes(t.name));
}

function buildSystemPrompt(agent: Agent): string {
  const parts: string[] = [];

  if (agent.systemPrompt) {
    parts.push(agent.systemPrompt);
  } else {
    parts.push(`You are ${agent.name}, an AI agent working in BuildCorp.`);
    if (agent.specialty) {
      parts.push(`Your specialty is: ${agent.specialty}.`);
    }
    if (agent.personality) {
      parts.push(`Your personality/style: ${agent.personality}.`);
    }
  }

  parts.push('');
  parts.push('When you need to read files, write code, search, or run commands, use the provided tools.');
  parts.push('Think step by step. If a task requires multiple tool calls, do them one at a time.');

  return parts.join('\n');
}

function truncateResult(result: string, maxLength: number = 50000): string {
  if (result.length <= maxLength) return result;
  return result.slice(0, maxLength) + `\n\n[... truncated, ${result.length - maxLength} chars omitted]`;
}
