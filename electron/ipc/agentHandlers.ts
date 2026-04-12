import { IpcMain } from 'electron';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { IPC_CHANNELS, Agent, AgentStats } from '../../shared/types';

export function registerAgentHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle(IPC_CHANNELS.AGENT_LIST, (_event, teamId: string) => {
    const rows = db.prepare('SELECT * FROM agents WHERE team_id = ? ORDER BY created_at ASC').all(teamId);
    return rows.map(mapRowToAgent);
  });

  ipcMain.handle(IPC_CHANNELS.AGENT_GET, (_event, id: string) => {
    const row = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
    return row ? mapRowToAgent(row) : null;
  });

  ipcMain.handle(IPC_CHANNELS.AGENT_CREATE, (_event, data: Partial<Agent> & { teamId: string; companyId: string }) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const defaultStats: AgentStats = { tasksCompleted: 0, totalWorkTimeMs: 0, specialtyScores: {} };

    db.prepare(`
      INSERT INTO agents (id, team_id, company_id, name, sprite_id, specialty, personality, system_prompt, llm_provider, llm_model, stats_json, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.teamId, data.companyId,
      data.name || 'New Agent',
      data.spriteId || 'default',
      data.specialty || '',
      data.personality || '',
      data.systemPrompt || '',
      data.llmProvider || 'claude',
      data.llmModel || 'claude-sonnet-4-20250514',
      JSON.stringify(data.stats || defaultStats),
      'idle',
      now
    );

    return mapRowToAgent(db.prepare('SELECT * FROM agents WHERE id = ?').get(id));
  });

  ipcMain.handle(IPC_CHANNELS.AGENT_UPDATE, (_event, id: string, data: Partial<Agent>) => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.spriteId !== undefined) { fields.push('sprite_id = ?'); values.push(data.spriteId); }
    if (data.specialty !== undefined) { fields.push('specialty = ?'); values.push(data.specialty); }
    if (data.personality !== undefined) { fields.push('personality = ?'); values.push(data.personality); }
    if (data.systemPrompt !== undefined) { fields.push('system_prompt = ?'); values.push(data.systemPrompt); }
    if (data.llmProvider !== undefined) { fields.push('llm_provider = ?'); values.push(data.llmProvider); }
    if (data.llmModel !== undefined) { fields.push('llm_model = ?'); values.push(data.llmModel); }
    if (data.stats !== undefined) { fields.push('stats_json = ?'); values.push(JSON.stringify(data.stats)); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    values.push(id);

    if (fields.length > 0) {
      db.prepare(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    const row = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
    return row ? mapRowToAgent(row) : null;
  });

  ipcMain.handle(IPC_CHANNELS.AGENT_DELETE, (_event, id: string) => {
    db.prepare('DELETE FROM agents WHERE id = ?').run(id);
    return { success: true };
  });
}

function mapRowToAgent(row: any): Agent {
  return {
    id: row.id,
    teamId: row.team_id,
    companyId: row.company_id,
    name: row.name,
    spriteId: row.sprite_id,
    specialty: row.specialty,
    personality: row.personality,
    systemPrompt: row.system_prompt,
    llmProvider: row.llm_provider,
    llmModel: row.llm_model,
    stats: JSON.parse(row.stats_json),
    status: row.status,
    createdAt: row.created_at,
  };
}
