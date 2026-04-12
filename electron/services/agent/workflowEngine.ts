import { runAgent } from './engine';
import { llmManager } from '../llm/manager';
import type { Agent } from '../../../shared/types';
import type {
  Workflow,
  WorkflowRun,
  WorkflowRunNodeState,
  WorkflowEdge,
  NodeStatus,
} from '../../../shared/workflow';

export interface WorkflowEngineCallbacks {
  getAgent: (agentId: string) => Agent | null;
  onNodeStatusChange: (runId: string, nodeId: string, status: NodeStatus, result?: string) => void;
  onRunComplete: (runId: string) => void;
  onApprovalNeeded: (runId: string, nodeId: string, agentName: string, result: string) => void;
}

export class WorkflowEngine {
  private runs: Map<string, WorkflowRun> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private pendingApprovals: Set<string> = new Set(); // nodeIds waiting for approval
  private callbacks: WorkflowEngineCallbacks;

  constructor(callbacks: WorkflowEngineCallbacks) {
    this.callbacks = callbacks;
  }

  async startRun(workflow: Workflow, run: WorkflowRun): Promise<void> {
    this.workflows.set(run.id, workflow);
    this.runs.set(run.id, run);

    // Find start nodes (no incoming edges)
    const targetNodeIds = new Set(workflow.edges.map((e) => e.targetNodeId));
    const startNodes = workflow.nodes.filter((n) => !targetNodeIds.has(n.id));

    // Execute start nodes in parallel
    await Promise.all(
      startNodes.map((node) => this.executeNode(run.id, node.id))
    );
  }

  approveNode(runId: string, nodeId: string): void {
    this.pendingApprovals.delete(nodeId);
    this.advanceFromNode(runId, nodeId);
  }

  private async executeNode(runId: string, nodeId: string): Promise<void> {
    const run = this.runs.get(runId);
    const workflow = this.workflows.get(runId);
    if (!run || !workflow) return;

    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const agent = this.callbacks.getAgent(node.agentId);
    if (!agent) {
      this.updateNodeStatus(runId, nodeId, 'failed', 'Agent not found');
      return;
    }

    // Update status to running
    this.updateNodeStatus(runId, nodeId, 'running');

    // Build context from parent nodes' results
    const parentResults = this.getParentResults(runId, nodeId);
    let userMessage = `Task: ${node.label}`;
    if (parentResults.length > 0) {
      userMessage += '\n\nPrevious results:\n' + parentResults.map((r) => `- ${r}`).join('\n');
    }

    try {
      const result = await runAgent({
        agent,
        userMessage,
        chatHistory: [],
        workingDir: process.cwd(),
      });

      this.updateNodeStatus(runId, nodeId, 'completed', result);
      this.advanceFromNode(runId, nodeId);
    } catch (err: any) {
      this.updateNodeStatus(runId, nodeId, 'failed', err.message);
      this.checkRunCompletion(runId);
    }
  }

  private advanceFromNode(runId: string, nodeId: string): void {
    const workflow = this.workflows.get(runId);
    if (!workflow) return;

    // Find outgoing edges
    const outEdges = workflow.edges.filter((e) => e.sourceNodeId === nodeId);

    for (const edge of outEdges) {
      const targetNode = edge.targetNodeId;

      // Check if all incoming edges to target are satisfied
      const inEdges = workflow.edges.filter((e) => e.targetNodeId === targetNode);
      const allParentsDone = inEdges.every((e) => {
        const nodeState = this.getNodeState(runId, e.sourceNodeId);
        return nodeState?.status === 'completed';
      });

      if (!allParentsDone) continue;

      // Check edge condition
      if (edge.condition === 'approval') {
        const nodeState = this.getNodeState(runId, nodeId);
        this.updateNodeStatus(runId, targetNode, 'waiting_approval');
        this.pendingApprovals.add(targetNode);
        const agent = this.callbacks.getAgent(
          workflow.nodes.find((n) => n.id === nodeId)?.agentId || ''
        );
        this.callbacks.onApprovalNeeded(
          runId,
          targetNode,
          agent?.name || 'Unknown',
          nodeState?.result || ''
        );
      } else {
        // auto or conditional (simplified: treat conditional as auto for now)
        this.executeNode(runId, targetNode);
      }
    }

    this.checkRunCompletion(runId);
  }

  private getParentResults(runId: string, nodeId: string): string[] {
    const workflow = this.workflows.get(runId);
    if (!workflow) return [];

    const inEdges = workflow.edges.filter((e) => e.targetNodeId === nodeId);
    const results: string[] = [];

    for (const edge of inEdges) {
      const state = this.getNodeState(runId, edge.sourceNodeId);
      if (state?.result) {
        const parentNode = workflow.nodes.find((n) => n.id === edge.sourceNodeId);
        results.push(`[${parentNode?.label || 'Unknown'}]: ${state.result.slice(0, 500)}`);
      }
    }
    return results;
  }

  private getNodeState(runId: string, nodeId: string): WorkflowRunNodeState | undefined {
    const run = this.runs.get(runId);
    return run?.nodeStates.find((ns) => ns.nodeId === nodeId);
  }

  private updateNodeStatus(runId: string, nodeId: string, status: NodeStatus, result?: string): void {
    const run = this.runs.get(runId);
    if (!run) return;

    run.nodeStates = run.nodeStates.map((ns) =>
      ns.nodeId === nodeId
        ? {
            ...ns,
            status,
            result: result ?? ns.result,
            startedAt: status === 'running' ? new Date().toISOString() : ns.startedAt,
            completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : ns.completedAt,
          }
        : ns
    );

    this.callbacks.onNodeStatusChange(runId, nodeId, status, result);
  }

  private checkRunCompletion(runId: string): void {
    const run = this.runs.get(runId);
    if (!run) return;

    const allDone = run.nodeStates.every(
      (ns) => ns.status === 'completed' || ns.status === 'failed'
    );

    if (allDone) {
      run.status = run.nodeStates.some((ns) => ns.status === 'failed') ? 'failed' : 'completed';
      run.completedAt = new Date().toISOString();
      this.callbacks.onRunComplete(runId);
    }
  }
}
