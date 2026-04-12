import { spawn } from 'child_process';
import type {
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
} from './types';

/**
 * Claude Code CLI 프로바이더
 * Max 구독 사용자가 API 키 없이 claude CLI를 통해 AI를 사용
 * 에이전트별 세션 ID를 관리하여 대화 맥락 유지
 */
export class ClaudeCLIProvider implements LLMProvider {
  name = 'claude-cli';
  private sessionIds: Map<string, string> = new Map(); // agentId -> sessionId

  async chat(options: LLMRequestOptions): Promise<LLMResponse> {
    let content = '';
    for await (const chunk of this.chatStream(options)) {
      if (chunk.type === 'text' && chunk.content) {
        content += chunk.content;
      } else if (chunk.type === 'error') {
        throw new Error(chunk.error);
      }
    }
    return { content, finishReason: 'stop' };
  }

  async *chatStream(options: LLMRequestOptions): AsyncGenerator<LLMStreamChunk> {
    const agentId = (options as any).agentId || 'default';
    const sessionId = this.sessionIds.get(agentId);

    // 마지막 user 메시지 추출
    const lastUserMsg = [...options.messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) {
      yield { type: 'error', error: 'No user message found' };
      return;
    }

    // system prompt를 메시지 앞에 추가
    let prompt = lastUserMsg.content;
    if (options.systemPrompt && !sessionId) {
      prompt = `[System: ${options.systemPrompt}]\n\n${prompt}`;
    }

    // claude CLI 인자 구성
    const args: string[] = [
      '--print',          // 비대화형, 결과만 출력
      '--output-format', 'text',
    ];

    // 세션 이어가기
    if (sessionId) {
      args.push('--resume', sessionId);
    }

    // 모델 지정 (선택)
    if (options.model && options.model !== 'claude-cli-default') {
      args.push('--model', options.model);
    }

    // 프롬프트
    args.push(prompt);

    // CLI 실행
    const result = yield* this.runCLI(args, agentId);
  }

  private async *runCLI(args: string[], agentId: string): AsyncGenerator<LLMStreamChunk> {
    try {
      const proc = spawn('claude', args, {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      let fullOutput = '';
      let errorOutput = '';

      // stdout 스트리밍
      if (proc.stdout) {
        const stdoutGen = this.streamFromReadable(proc.stdout);
        for await (const chunk of stdoutGen) {
          fullOutput += chunk;
          yield { type: 'text', content: chunk };
        }
      }

      // stderr 수집
      if (proc.stderr) {
        for await (const chunk of proc.stderr) {
          errorOutput += chunk.toString();
        }
      }

      // 프로세스 종료 대기
      const exitCode = await new Promise<number>((resolve) => {
        proc.on('close', (code) => resolve(code ?? 0));
        proc.on('error', (err) => {
          errorOutput += err.message;
          resolve(1);
        });
      });

      if (exitCode !== 0 && errorOutput) {
        yield { type: 'error', error: `Claude CLI error: ${errorOutput.slice(0, 500)}` };
        return;
      }

      // 세션 ID 추출 시도 (향후 --resume 용)
      // Claude CLI가 세션 ID를 stderr나 특정 형식으로 출력할 수 있음
      // 지금은 간단하게 처리
      yield { type: 'done' };
    } catch (err: any) {
      yield { type: 'error', error: `Failed to run claude CLI: ${err.message}` };
    }
  }

  private async *streamFromReadable(readable: NodeJS.ReadableStream): AsyncGenerator<string> {
    for await (const chunk of readable) {
      yield chunk.toString();
    }
  }

  setSessionId(agentId: string, sessionId: string) {
    this.sessionIds.set(agentId, sessionId);
  }

  clearSession(agentId: string) {
    this.sessionIds.delete(agentId);
  }

  async listModels(): Promise<string[]> {
    return [
      'claude-cli-default',
      'claude-sonnet-4-20250514',
      'claude-opus-4-20250514',
      'claude-haiku-4-5-20251001',
    ];
  }

  async validateApiKey(): Promise<boolean> {
    // CLI가 설치되어 있는지 확인
    return new Promise((resolve) => {
      const proc = spawn('claude', ['--version'], { shell: true });
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });
  }
}
