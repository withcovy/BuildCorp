import { spawn, ChildProcess } from 'child_process';
import type {
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
} from './types';

export class ClaudeCLIProvider implements LLMProvider {
  name = 'claude-cli';
  private sessionIds: Map<string, string> = new Map();
  private activeProcesses: Map<string, ChildProcess> = new Map();

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

    // 전체 프롬프트 구성
    let fullPrompt = '';

    // 대화 히스토리 포함
    const historyMessages = options.messages.filter((m) => m.role === 'user' || m.role === 'assistant');
    if (historyMessages.length > 1) {
      const prevMessages = historyMessages.slice(0, -1);
      fullPrompt += 'Here is our conversation so far:\n\n';
      for (const msg of prevMessages) {
        const role = msg.role === 'user' ? 'Human' : 'Assistant';
        fullPrompt += `${role}: ${msg.content}\n\n`;
      }
      fullPrompt += '---\n\n';
    }

    // 마지막 사용자 메시지
    const lastUserMsg = [...options.messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) {
      yield { type: 'error', error: 'No user message found' };
      return;
    }
    fullPrompt += lastUserMsg.content;

    // claude CLI 인자 - 프롬프트는 stdin으로 전달, 인자에는 넣지 않음
    const args: string[] = ['--print', '--output-format', 'text'];

    if (options.systemPrompt) {
      args.push('--system-prompt', options.systemPrompt);
    }

    if (options.model && options.model !== 'claude-cli-default') {
      args.push('--model', options.model);
    }

    // stdin으로 프롬프트 전달 (-로 stdin 읽기)
    args.push('-');

    const workingDir = (options as any).workingDir || process.cwd();
    yield* this.runCLI(args, agentId, workingDir, fullPrompt);
  }

  stop(agentId: string): boolean {
    const proc = this.activeProcesses.get(agentId);
    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
      this.activeProcesses.delete(agentId);
      return true;
    }
    return false;
  }

  private async *runCLI(args: string[], agentId: string, cwd: string, stdinData?: string): AsyncGenerator<LLMStreamChunk> {
    try {
      const proc = spawn('claude', args, {
        shell: true,
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      this.activeProcesses.set(agentId, proc);

      // stdin으로 프롬프트 전달
      if (stdinData && proc.stdin) {
        proc.stdin.write(stdinData);
        proc.stdin.end();
      }

      let errorOutput = '';

      if (proc.stdout) {
        for await (const chunk of proc.stdout) {
          yield { type: 'text', content: chunk.toString() };
        }
      }

      if (proc.stderr) {
        for await (const chunk of proc.stderr) {
          errorOutput += chunk.toString();
        }
      }

      const exitCode = await new Promise<number>((resolve) => {
        proc.on('close', (code) => resolve(code ?? 0));
        proc.on('error', (err) => {
          errorOutput += err.message;
          resolve(1);
        });
      });

      this.activeProcesses.delete(agentId);

      if (exitCode !== 0 && errorOutput && !proc.killed) {
        yield { type: 'error', error: `Claude CLI error: ${errorOutput.slice(0, 500)}` };
        return;
      }

      yield { type: 'done' };
    } catch (err: any) {
      this.activeProcesses.delete(agentId);
      yield { type: 'error', error: `Failed to run claude CLI: ${err.message}` };
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
    return new Promise((resolve) => {
      const proc = spawn('claude', ['--version'], { shell: true });
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });
  }
}
