import { IpcMain, BrowserWindow } from 'electron';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { IPC_CHANNELS } from '../../shared/types';
import { runAgent } from '../services/agent/engine';
import type { LLMMessage } from '../services/llm/types';

export function registerChatHandlers(ipcMain: IpcMain, db: Database.Database) {
  // 채팅 히스토리 조회
  ipcMain.handle(IPC_CHANNELS.CHAT_HISTORY, (_event, agentId: string) => {
    const rows = db.prepare(
      'SELECT * FROM chat_messages WHERE agent_id = ? ORDER BY timestamp ASC'
    ).all(agentId);

    return rows.map((row: any) => ({
      id: row.id,
      agentId: row.agent_id,
      role: row.role,
      content: row.content,
      attachments: JSON.parse(row.attachments_json),
      timestamp: row.timestamp,
    }));
  });

  // 메시지 전송 + 에이전트 실행
  ipcMain.handle(IPC_CHANNELS.CHAT_SEND, async (event, agentId: string, message: string) => {
    // 에이전트 정보 조회
    const agentRow: any = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId);
    if (!agentRow) throw new Error(`Agent not found: ${agentId}`);

    const agent = {
      id: agentRow.id,
      teamId: agentRow.team_id,
      companyId: agentRow.company_id,
      name: agentRow.name,
      spriteId: agentRow.sprite_id,
      specialty: agentRow.specialty,
      personality: agentRow.personality,
      systemPrompt: agentRow.system_prompt,
      llmProvider: agentRow.llm_provider,
      llmModel: agentRow.llm_model,
      stats: JSON.parse(agentRow.stats_json),
      status: agentRow.status,
      createdAt: agentRow.created_at,
    };

    // 사용자 메시지 저장
    const userMsgId = uuidv4();
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO chat_messages (id, agent_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)'
    ).run(userMsgId, agentId, 'user', message, now);

    // 채팅 히스토리를 LLM 메시지 형식으로 변환
    const historyRows: any[] = db.prepare(
      'SELECT role, content FROM chat_messages WHERE agent_id = ? ORDER BY timestamp ASC'
    ).all(agentId);

    const chatHistory: LLMMessage[] = historyRows
      .slice(0, -1) // 방금 추가한 메시지 제외 (아래에서 userMessage로 전달)
      .map((row) => ({
        role: row.role as 'user' | 'assistant',
        content: row.content,
      }));

    // 에이전트 상태를 working으로 변경
    db.prepare('UPDATE agents SET status = ? WHERE id = ?').run('working', agentId);

    // BrowserWindow 찾기 (스트리밍용)
    const win = BrowserWindow.getAllWindows()[0];

    // 에이전트 실행
    try {
      const result = await runAgent({
        agent,
        userMessage: message,
        chatHistory,
        workingDir: process.cwd(), // TODO: 회사별 워킹 디렉토리 설정
        onStream: (chunk) => {
          if (win && !win.isDestroyed()) {
            win.webContents.send(IPC_CHANNELS.CHAT_STREAM, {
              agentId,
              ...chunk,
            });
          }
        },
      });

      // 응답 메시지 저장
      const assistantMsgId = uuidv4();
      db.prepare(
        'INSERT INTO chat_messages (id, agent_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)'
      ).run(assistantMsgId, agentId, 'assistant', result, new Date().toISOString());

      // 통계 업데이트
      const stats = JSON.parse(agentRow.stats_json);
      stats.tasksCompleted = (stats.tasksCompleted || 0) + 1;
      db.prepare('UPDATE agents SET stats_json = ?, status = ? WHERE id = ?')
        .run(JSON.stringify(stats), 'idle', agentId);

      return { success: true, content: result };
    } catch (err: any) {
      // 에러 시 상태 복원
      db.prepare('UPDATE agents SET status = ? WHERE id = ?').run('idle', agentId);
      return { success: false, error: err.message };
    }
  });
}
