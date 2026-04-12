import { IpcMain } from 'electron';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { IPC_CHANNELS, Company } from '../../shared/types';

export function registerCompanyHandlers(ipcMain: IpcMain, db: Database.Database) {
  ipcMain.handle(IPC_CHANNELS.COMPANY_LIST, () => {
    const rows = db.prepare('SELECT * FROM companies ORDER BY created_at DESC').all();
    return rows.map(mapRowToCompany);
  });

  ipcMain.handle(IPC_CHANNELS.COMPANY_GET, (_event, id: string) => {
    const row = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
    return row ? mapRowToCompany(row) : null;
  });

  ipcMain.handle(IPC_CHANNELS.COMPANY_CREATE, (_event, data: Partial<Company>) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO companies (id, name, industry, description, working_dir, funds, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.name || 'New Company', data.industry || '', data.description || '', data.workingDir || '', data.funds ?? 100000, now, now);
    return { id, ...data, workingDir: data.workingDir || '', funds: data.funds ?? 100000, createdAt: now, updatedAt: now };
  });

  ipcMain.handle(IPC_CHANNELS.COMPANY_UPDATE, (_event, id: string, data: Partial<Company>) => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.industry !== undefined) { fields.push('industry = ?'); values.push(data.industry); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.workingDir !== undefined) { fields.push('working_dir = ?'); values.push(data.workingDir); }
    if (data.funds !== undefined) { fields.push('funds = ?'); values.push(data.funds); }
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE companies SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const row = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
    return row ? mapRowToCompany(row) : null;
  });

  ipcMain.handle(IPC_CHANNELS.COMPANY_DELETE, (_event, id: string) => {
    db.prepare('DELETE FROM companies WHERE id = ?').run(id);
    return { success: true };
  });
}

function mapRowToCompany(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    description: row.description,
    workingDir: row.working_dir || '',
    funds: row.funds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
