import { create } from 'zustand';
import type { Task, TaskStatus } from '../../shared/types';

interface TaskState {
  tasks: Task[];
  loading: boolean;

  loadTasks: (companyId: string) => Promise<void>;
  createTask: (data: Partial<Task> & { companyId: string; teamId: string }) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: TaskStatus) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,

  loadTasks: async (companyId) => {
    set({ loading: true });
    const tasks = await window.electronAPI.taskList(companyId);
    set({ tasks, loading: false });
  },

  createTask: async (data) => {
    const task = await window.electronAPI.taskCreate(data);
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  updateTask: async (id, data) => {
    const updated = await window.electronAPI.taskUpdate(id, data);
    if (updated) {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      }));
    }
  },

  deleteTask: async (id) => {
    await window.electronAPI.taskDelete(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  moveTask: async (id, status) => {
    await get().updateTask(id, { status });
  },
}));
