import { IpcMain } from 'electron';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { IPC_CHANNELS, Task } from '../../shared/types';

export function registerTaskHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle(IPC_CHANNELS.TASK_LIST, (_event, companyId: string) => {
    const rows = db.prepare('SELECT * FROM tasks WHERE company_id = ? ORDER BY created_at DESC').all(companyId);
    return rows.map(mapRowToTask);
  });

  ipcMain.handle(IPC_CHANNELS.TASK_CREATE, (_event, data: Partial<Task> & { companyId: string; teamId: string }) => {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tasks (id, company_id, team_id, title, description, type, status, assigned_agent_ids, attachments_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.companyId, data.teamId,
      data.title || 'New Task',
      data.description || '',
      data.type || 'board',
      data.status || 'todo',
      JSON.stringify(data.assignedAgentIds || []),
      JSON.stringify(data.attachments || []),
      now
    );

    return mapRowToTask(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
  });

  ipcMain.handle(IPC_CHANNELS.TASK_UPDATE, (_event, id: string, data: Partial<Task>) => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
      if (data.status === 'done') {
        fields.push('completed_at = ?');
        values.push(new Date().toISOString());
      }
    }
    if (data.assignedAgentIds !== undefined) { fields.push('assigned_agent_ids = ?'); values.push(JSON.stringify(data.assignedAgentIds)); }
    if (data.result !== undefined) { fields.push('result_json = ?'); values.push(JSON.stringify(data.result)); }
    values.push(id);

    if (fields.length > 0) {
      db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return row ? mapRowToTask(row) : null;
  });

  ipcMain.handle(IPC_CHANNELS.TASK_DELETE, (_event, id: string) => {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return { success: true };
  });
}

function mapRowToTask(row: any): Task {
  return {
    id: row.id,
    companyId: row.company_id,
    teamId: row.team_id,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    assignedAgentIds: JSON.parse(row.assigned_agent_ids),
    attachments: JSON.parse(row.attachments_json),
    result: row.result_json ? JSON.parse(row.result_json) : undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at || undefined,
  };
}
