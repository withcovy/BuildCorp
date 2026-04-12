import type { TransitionCondition } from '../../../shared/workflow';

interface Props {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  condition: TransitionCondition;
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onConditionChange: (condition: TransitionCondition) => void;
}

const CONDITION_COLORS: Record<TransitionCondition, string> = {
  auto: '#10b981',       // emerald
  approval: '#f59e0b',   // amber
  conditional: '#6366f1', // indigo
};

const CONDITION_LABELS: Record<TransitionCondition, string> = {
  auto: 'Auto',
  approval: 'Approval',
  conditional: 'Conditional',
};

export function EdgeLine({ id, x1, y1, x2, y2, condition, selected, onClick, onDelete, onConditionChange }: Props) {
  const color = CONDITION_COLORS[condition];
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Curved path
  const dx = x2 - x1;
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 80);
  const path = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;

  // Arrow at end
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowLen = 8;
  const arrowP1x = x2 - arrowLen * Math.cos(angle - Math.PI / 6);
  const arrowP1y = y2 - arrowLen * Math.sin(angle - Math.PI / 6);
  const arrowP2x = x2 - arrowLen * Math.cos(angle + Math.PI / 6);
  const arrowP2y = y2 - arrowLen * Math.sin(angle + Math.PI / 6);

  const conditions: TransitionCondition[] = ['auto', 'approval', 'conditional'];

  return (
    <g className="pointer-events-auto cursor-pointer" onClick={onClick}>
      {/* Invisible thick line for easier clicking */}
      <path d={path} stroke="transparent" strokeWidth="16" fill="none" />

      {/* Visible line */}
      <path
        d={path}
        stroke={color}
        strokeWidth={selected ? 3 : 2}
        fill="none"
        strokeDasharray={condition === 'conditional' ? '6 3' : undefined}
        opacity={selected ? 1 : 0.6}
      />

      {/* Arrow */}
      <polygon
        points={`${x2},${y2} ${arrowP1x},${arrowP1y} ${arrowP2x},${arrowP2y}`}
        fill={color}
        opacity={selected ? 1 : 0.6}
      />

      {/* Condition badge */}
      <foreignObject x={midX - 32} y={midY - 12} width="64" height="24">
        <div
          className="flex items-center justify-center h-full"
          style={{ fontSize: '10px' }}
        >
          <span
            className="px-1.5 py-0.5 rounded text-white font-medium"
            style={{ backgroundColor: color, fontSize: '9px', opacity: selected ? 1 : 0.8 }}
          >
            {CONDITION_LABELS[condition]}
          </span>
        </div>
      </foreignObject>

      {/* Selected controls */}
      {selected && (
        <foreignObject x={midX - 60} y={midY + 12} width="120" height="28">
          <div className="flex items-center justify-center gap-1 h-full">
            {conditions.map((c) => (
              <button
                key={c}
                onClick={(e) => { e.stopPropagation(); onConditionChange(c); }}
                className={`px-1.5 py-0.5 rounded text-white transition-colors ${
                  c === condition ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                }`}
                style={{ backgroundColor: CONDITION_COLORS[c], fontSize: '8px' }}
              >
                {CONDITION_LABELS[c][0]}
              </button>
            ))}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="px-1 py-0.5 rounded bg-rose-600 text-white hover:bg-rose-500 transition-colors"
              style={{ fontSize: '8px' }}
            >
              ✕
            </button>
          </div>
        </foreignObject>
      )}
    </g>
  );
}
