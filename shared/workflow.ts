// 워크플로우 데이터 타입

export type TransitionCondition = 'auto' | 'approval' | 'conditional';

export interface WorkflowNode {
  id: string;
  agentId: string;
  label: string;           // 이 워크플로우에서의 역할
  x: number;
  y: number;
}

export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition: TransitionCondition;
  conditionRule?: string;  // conditional일 때 조건 설명
}

export interface Workflow {
  id: string;
  companyId: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

// 실행 중인 워크플로우 인스턴스
export type NodeStatus = 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed';

export interface WorkflowRunNodeState {
  nodeId: string;
  status: NodeStatus;
  result?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  nodeStates: WorkflowRunNodeState[];
  createdAt: string;
  completedAt?: string;
}
