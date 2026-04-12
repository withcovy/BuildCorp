import { IpcMain } from 'electron';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { IPC_CHANNELS, Team } from '../../shared/types';

export function registerTeamHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle(IPC_CHANNELS.TEAM_LIST, (_event, companyId: string) => {
    const rows = db.prepare('SELECT * FROM teams WHERE company_id = ? ORDER BY created_at ASC').all(companyId);
    return rows.map(mapRowToTeam);
  });

  ipcMain.handle(IPC_CHANNELS.TEAM_CREATE, (_event, data: Partial<Team> & { companyId: string }) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO teams (id, company_id, name, role, color, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.companyId, data.name || 'New Team', data.role || '', data.color || '#6366f1', now);
    return { id, companyId: data.companyId, name: data.name || 'New Team', role: data.role || '', color: data.color || '#6366f1', createdAt: now };
  });

  ipcMain.handle(IPC_CHANNELS.TEAM_UPDATE, (_event, id: string, data: Partial<Team>) => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
    if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }
    values.push(id);

    if (fields.length > 0) {
      db.prepare(`UPDATE teams SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    const row = db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
    return row ? mapRowToTeam(row) : null;
  });

  ipcMain.handle(IPC_CHANNELS.TEAM_DELETE, (_event, id: string) => {
    db.prepare('DELETE FROM teams WHERE id = ?').run(id);
    return { success: true };
  });
}

function mapRowToTeam(row: any): Team {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    role: row.role,
    color: row.color,
    createdAt: row.created_at,
  };
}
