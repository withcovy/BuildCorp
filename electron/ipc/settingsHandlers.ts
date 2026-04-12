import { IpcMain } from 'electron';
import Database from 'better-sqlite3';
import { llmManager } from '../services/llm/manager';

const IPC = {
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:getAll',
  LLM_VALIDATE: 'llm:validate',
  LLM_MODELS: 'llm:models',
  LLM_PROVIDERS: 'llm:providers',
};

export function registerSettingsHandlers(ipcMain: IpcMain, db: Database.Database) {
  // settings 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  ipcMain.handle(IPC.SETTINGS_GET, (_event, key: string) => {
    const row: any = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : null;
  });

  ipcMain.handle(IPC.SETTINGS_SET, (_event, key: string, value: any) => {
    const json = JSON.stringify(value);
    db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?'
    ).run(key, json, json);

    // API 키 변경 시 LLM 매니저 재설정
    if (key.startsWith('llm.')) {
      reloadLLMConfig(db);
    }

    return { success: true };
  });

  ipcMain.handle(IPC.SETTINGS_GET_ALL, () => {
    const rows: any[] = db.prepare('SELECT key, value FROM settings').all();
    const result: Record<string, any> = {};
    for (const row of rows) {
      result[row.key] = JSON.parse(row.value);
    }
    return result;
  });

  ipcMain.handle(IPC.LLM_VALIDATE, async (_event, provider: string) => {
    return llmManager.validateProvider(provider);
  });

  ipcMain.handle(IPC.LLM_MODELS, async (_event, provider: string) => {
    return llmManager.listModels(provider);
  });

  ipcMain.handle(IPC.LLM_PROVIDERS, () => {
    return llmManager.getAvailableProviders();
  });

  // 초기 로드
  reloadLLMConfig(db);
}

function reloadLLMConfig(db: Database.Database) {
  const getSetting = (key: string): any => {
    const row: any = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : null;
  };

  llmManager.configure({
    claude: { apiKey: getSetting('llm.claude.apiKey') || '' },
    openai: { apiKey: getSetting('llm.openai.apiKey') || '' },
    ollama: { baseUrl: getSetting('llm.ollama.baseUrl') || 'http://localhost:11434' },
  });
}
