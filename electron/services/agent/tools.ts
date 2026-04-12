import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolDefinition } from '../llm/types';

const execAsync = promisify(exec);

// 에이전트가 사용할 수 있는 기본 도구 정의
export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: 'readFile',
    description: 'Read the contents of a file at the given path',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute or relative file path to read' },
      },
      required: ['path'],
    },
  },
  {
    name: 'writeFile',
    description: 'Write content to a file. Creates the file if it does not exist, overwrites if it does.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute or relative file path to write' },
        content: { type: 'string', description: 'Content to write to the file' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'listDir',
    description: 'List files and directories in the given path. Returns names with type indicators (/ for dirs)',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path to list' },
        recursive: { type: 'string', description: '"true" to list recursively (max 3 levels deep), "false" for top level only', enum: ['true', 'false'] },
      },
      required: ['path'],
    },
  },
  {
    name: 'search',
    description: 'Search for text content within files in a directory. Returns matching lines with file paths and line numbers.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory to search in' },
        pattern: { type: 'string', description: 'Text or regex pattern to search for' },
        filePattern: { type: 'string', description: 'Glob pattern to filter files (e.g. "*.ts", "*.py")' },
      },
      required: ['path', 'pattern'],
    },
  },
  {
    name: 'runCommand',
    description: 'Execute a shell command and return its output. Use for builds, tests, git, etc.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
        cwd: { type: 'string', description: 'Working directory for the command' },
      },
      required: ['command'],
    },
  },
];

// 도구 실행기
export async function executeTool(
  name: string,
  args: Record<string, any>,
  workingDir: string
): Promise<string> {
  try {
    switch (name) {
      case 'readFile':
        return await toolReadFile(resolvePath(args.path, workingDir));
      case 'writeFile':
        return await toolWriteFile(resolvePath(args.path, workingDir), args.content);
      case 'listDir':
        return await toolListDir(resolvePath(args.path, workingDir), args.recursive === 'true');
      case 'search':
        return await toolSearch(resolvePath(args.path, workingDir), args.pattern, args.filePattern);
      case 'runCommand':
        return await toolRunCommand(args.command, args.cwd ? resolvePath(args.cwd, workingDir) : workingDir);
      default:
        return `Error: Unknown tool "${name}"`;
    }
  } catch (err: any) {
    return `Error: ${err.message}`;
  }
}

function resolvePath(filePath: string, workingDir: string): string {
  if (path.isAbsolute(filePath)) return filePath;
  return path.resolve(workingDir, filePath);
}

async function toolReadFile(filePath: string): Promise<string> {
  if (!fs.existsSync(filePath)) {
    return `Error: File not found: ${filePath}`;
  }
  const stat = fs.statSync(filePath);
  if (stat.size > 1024 * 1024) {
    return `Error: File too large (${(stat.size / 1024 / 1024).toFixed(1)}MB). Max 1MB.`;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

async function toolWriteFile(filePath: string, content: string): Promise<string> {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
  return `File written: ${filePath}`;
}

async function toolListDir(dirPath: string, recursive: boolean): Promise<string> {
  if (!fs.existsSync(dirPath)) {
    return `Error: Directory not found: ${dirPath}`;
  }

  const entries: string[] = [];
  listDirRecursive(dirPath, '', entries, recursive ? 3 : 1, 0);

  if (entries.length === 0) return '(empty directory)';
  if (entries.length > 500) {
    return entries.slice(0, 500).join('\n') + `\n... and ${entries.length - 500} more entries`;
  }
  return entries.join('\n');
}

function listDirRecursive(basePath: string, prefix: string, entries: string[], maxDepth: number, depth: number) {
  if (depth >= maxDepth) return;
  const items = fs.readdirSync(basePath, { withFileTypes: true });
  for (const item of items) {
    if (item.name.startsWith('.') || item.name === 'node_modules') continue;
    const relativePath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) {
      entries.push(`${relativePath}/`);
      listDirRecursive(path.join(basePath, item.name), relativePath, entries, maxDepth, depth + 1);
    } else {
      entries.push(relativePath);
    }
  }
}

async function toolSearch(dirPath: string, pattern: string, filePattern?: string): Promise<string> {
  if (!fs.existsSync(dirPath)) {
    return `Error: Directory not found: ${dirPath}`;
  }

  const results: string[] = [];
  const regex = new RegExp(pattern, 'gi');
  searchInDir(dirPath, regex, filePattern, results, 0);

  if (results.length === 0) return `No matches found for "${pattern}"`;
  if (results.length > 100) {
    return results.slice(0, 100).join('\n') + `\n... and ${results.length - 100} more matches`;
  }
  return results.join('\n');
}

function searchInDir(dirPath: string, regex: RegExp, filePattern: string | undefined, results: string[], depth: number) {
  if (depth > 5 || results.length > 100) return;
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    if (item.name.startsWith('.') || item.name === 'node_modules') continue;
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      searchInDir(fullPath, regex, filePattern, results, depth + 1);
    } else {
      if (filePattern && !matchGlob(item.name, filePattern)) continue;
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            results.push(`${fullPath}:${i + 1}: ${lines[i].trim()}`);
            regex.lastIndex = 0;
          }
        }
      } catch {
        // skip binary/unreadable files
      }
    }
  }
}

function matchGlob(name: string, pattern: string): boolean {
  // Simple glob: *.ts, *.py etc
  if (pattern.startsWith('*.')) {
    return name.endsWith(pattern.slice(1));
  }
  return name.includes(pattern);
}

async function toolRunCommand(command: string, cwd: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });
    let result = '';
    if (stdout) result += stdout;
    if (stderr) result += (result ? '\n' : '') + stderr;
    return result || '(command completed with no output)';
  } catch (err: any) {
    return `Exit code ${err.code || 1}\n${err.stdout || ''}\n${err.stderr || err.message}`.trim();
  }
}
