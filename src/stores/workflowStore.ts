import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowRun,
  TransitionCondition,
} from '../../shared/workflow';

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  currentRun: WorkflowRun | null;

  // CRUD
  createWorkflow: (companyId: string, name: string) => Workflow;
  deleteWorkflow: (id: string) => void;
  selectWorkflow: (workflow: Workflow | null) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;

  // Node operations
  addNode: (agentId: string, label: string, x: number, y: number) => void;
  removeNode: (nodeId: string) => void;
  moveNode: (nodeId: string, x: number, y: number) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;

  // Edge operations
  addEdge: (sourceNodeId: string, targetNodeId: string, condition?: TransitionCondition) => void;
  removeEdge: (edgeId: string) => void;
  updateEdgeCondition: (edgeId: string, condition: TransitionCondition) => void;

  // Template
  saveAsTemplate: (name: string) => Workflow | null;

  // Run
  startRun: () => void;
  approveNode: (nodeId: string) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  currentRun: null,

  createWorkflow: (companyId, name) => {
    const workflow: Workflow = {
      id: uuidv4(),
      companyId,
      name,
      description: '',
      nodes: [],
      edges: [],
      isTemplate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ workflows: [...s.workflows, workflow], currentWorkflow: workflow }));
    return workflow;
  },

  deleteWorkflow: (id) => {
    set((s) => ({
      workflows: s.workflows.filter((w) => w.id !== id),
      currentWorkflow: s.currentWorkflow?.id === id ? null : s.currentWorkflow,
    }));
  },

  selectWorkflow: (workflow) => set({ currentWorkflow: workflow, currentRun: null }),

  updateWorkflow: (id, updates) => {
    set((s) => {
      const updated = s.workflows.map((w) =>
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      );
      const current = s.currentWorkflow?.id === id
        ? { ...s.currentWorkflow, ...updates, updatedAt: new Date().toISOString() }
        : s.currentWorkflow;
      return { workflows: updated, currentWorkflow: current };
    });
  },

  // Nodes
  addNode: (agentId, label, x, y) => {
    const wf = get().currentWorkflow;
    if (!wf) return;
    const node: WorkflowNode = { id: uuidv4(), agentId, label, x, y };
    get().updateWorkflow(wf.id, { nodes: [...wf.nodes, node] });
  },

  removeNode: (nodeId) => {
    const wf = get().currentWorkflow;
    if (!wf) return;
    get().updateWorkflow(wf.id, {
      nodes: wf.nodes.filter((n) => n.id !== nodeId),
      edges: wf.edges.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId),
    });
  },

  moveNode: (nodeId, x, y) => {
    const wf = get().currentWorkflow;
    if (!wf) return;
    get().updateWorkflow(wf.id, {
      nodes: wf.nodes.map((n) => (n.id === nodeId ? { ...n, x, y } : n)),
    });
  },

  updateNodeLabel: (nodeId, label) => {
    const wf = get().currentWorkflow;
    if (!wf) return;
    get().updateWorkflow(wf.id, {
      nodes: wf.nodes.map((n) => (n.id === nodeId ? { ...n, label } : n)),
    });
  },

  // Edges
  addEdge: (sourceNodeId, targetNodeId, condition = 'auto') => {
    const wf = get().currentWorkflow;
    if (!wf) return;
    // Prevent duplicate edges
    if (wf.edges.some((e) => e.sourceNodeId === sourceNodeId && e.targetNodeId === targetNodeId)) return;
    const edge: WorkflowEdge = { id: uuidv4(), sourceNodeId, targetNodeId, condition };
    get().updateWorkflow(wf.id, { edges: [...wf.edges, edge] });
  },

  removeEdge: (edgeId) => {
    const wf = get().currentWorkflow;
    if (!wf) return;
    get().updateWorkflow(wf.id, {
      edges: wf.edges.filter((e) => e.id !== edgeId),
    });
  },

  updateEdgeCondition: (edgeId, condition) => {
    const wf = get().currentWorkflow;
    if (!wf) return;
    get().updateWorkflow(wf.id, {
      edges: wf.edges.map((e) => (e.id === edgeId ? { ...e, condition } : e)),
    });
  },

  // Template
  saveAsTemplate: (name) => {
    const wf = get().currentWorkflow;
    if (!wf) return null;
    const template: Workflow = {
      ...wf,
      id: uuidv4(),
      name,
      isTemplate: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ workflows: [...s.workflows, template] }));
    return template;
  },

  // Run
  startRun: () => {
    const wf = get().currentWorkflow;
    if (!wf) return;
    const run: WorkflowRun = {
      id: uuidv4(),
      workflowId: wf.id,
      status: 'running',
      nodeStates: wf.nodes.map((n) => ({ nodeId: n.id, status: 'pending' })),
      createdAt: new Date().toISOString(),
    };
    // Start nodes that have no incoming edges
    const targetIds = new Set(wf.edges.map((e) => e.targetNodeId));
    run.nodeStates = run.nodeStates.map((ns) =>
      !targetIds.has(ns.nodeId) ? { ...ns, status: 'running', startedAt: new Date().toISOString() } : ns
    );
    set({ currentRun: run });
  },

  approveNode: (nodeId) => {
    const run = get().currentRun;
    if (!run) return;
    set({
      currentRun: {
        ...run,
        nodeStates: run.nodeStates.map((ns) =>
          ns.nodeId === nodeId
            ? { ...ns, status: 'completed', completedAt: new Date().toISOString() }
            : ns
        ),
      },
    });
  },
}));
