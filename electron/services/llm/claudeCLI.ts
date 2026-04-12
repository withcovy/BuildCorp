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
  private activeProcesses: Map<string, ChildProcess> = new Map(); // agentId -> process

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

    const lastUserMsg = [...options.messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) {
      yield { type: 'error', error: 'No user message found' };
      return;
    }

    const prompt = lastUserMsg.content;

    const args: string[] = [
      '--print',
      '--output-format', 'text',
    ];

    if (options.systemPrompt) {
      args.push('--system-prompt', options.systemPrompt);
    }

    if (sessionId) {
      args.push('--resume', sessionId);
    }

    if (options.model && options.model !== 'claude-cli-default') {
      args.push('--model', options.model);
    }

    args.push(prompt);

    const workingDir = (options as any).workingDir || process.cwd();
    yield* this.runCLI(args, agentId, workingDir);
  }

  // 에이전트 중단
  stop(agentId: string): boolean {
    const proc = this.activeProcesses.get(agentId);
    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
      this.activeProcesses.delete(agentId);
      return true;
    }
    return false;
  }

  private async *runCLI(args: string[], agentId: string, cwd: string): AsyncGenerator<LLMStreamChunk> {
    try {
      const proc = spawn('claude', args, {
        shell: true,
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      // 활성 프로세스 등록
      this.activeProcesses.set(agentId, proc);

      let fullOutput = '';
      let errorOutput = '';

      if (proc.stdout) {
        const stdoutGen = this.streamFromReadable(proc.stdout);
        for await (const chunk of stdoutGen) {
          fullOutput += chunk;
          yield { type: 'text', content: chunk };
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

      // 프로세스 정리
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
    return new Promise((resolve) => {
      const proc = spawn('claude', ['--version'], { shell: true });
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });
  }
}
