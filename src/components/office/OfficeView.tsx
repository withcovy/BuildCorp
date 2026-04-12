import { useEffect, useRef, useCallback, useState } from 'react';
import { Application, Container, Sprite, Texture, Graphics, Text, TextStyle } from 'pixi.js';
import { useCompanyStore } from '../../stores/companyStore';
import { useUIStore } from '../../stores/uiStore';
import { createCharacterCanvas, createDeskCanvas, SCALE } from './pixelSprites';
import type { Agent, Team } from '../../../shared/types';

interface EmployeeNode {
  agent: Agent;
  team: Team;
  container: Container;
  charSprite: Sprite;
  frame: number;
  deskX: number;
  deskY: number;
}

export function OfficeView() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const employeesRef = useRef<EmployeeNode[]>([]);
  const animFrameRef = useRef<number>(0);
  const { teams, agents } = useCompanyStore();
  const { selectAgent } = useUIStore();
  const [ready, setReady] = useState(false);

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application();
    const initApp = async () => {
      await app.init({
        resizeTo: canvasRef.current!,
        backgroundColor: 0x0f172a,
        antialias: false,
        resolution: 1,
      });
      canvasRef.current!.appendChild(app.canvas);
      appRef.current = app;
      setReady(true);
    };

    initApp();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
      setReady(false);
    };
  }, []);

  // Build office scene when teams/agents change
  useEffect(() => {
    if (!ready || !appRef.current) return;
    const app = appRef.current;

    // Clear previous
    app.stage.removeChildren();
    employeesRef.current = [];

    // Floor
    const floor = new Graphics();
    floor.rect(0, 0, app.screen.width, app.screen.height);
    floor.fill(0x0f172a);
    app.stage.addChild(floor);

    // Grid dots
    const dots = new Graphics();
    for (let x = 0; x < app.screen.width; x += 24) {
      for (let y = 0; y < app.screen.height; y += 24) {
        dots.circle(x, y, 0.5);
        dots.fill(0x1e293b);
      }
    }
    app.stage.addChild(dots);

    // Layout teams in rooms
    let roomX = 40;
    let roomY = 40;
    const ROOM_W = 280;
    const ROOM_H = 200;
    const ROOM_GAP = 30;
    const maxCols = Math.max(1, Math.floor((app.screen.width - 40) / (ROOM_W + ROOM_GAP)));

    teams.forEach((team, teamIdx) => {
      const col = teamIdx % maxCols;
      const row = Math.floor(teamIdx / maxCols);
      const rx = roomX + col * (ROOM_W + ROOM_GAP);
      const ry = roomY + row * (ROOM_H + ROOM_GAP);

      // Room background
      const room = new Graphics();
      room.roundRect(rx, ry, ROOM_W, ROOM_H, 8);
      room.fill(0x1e293b);
      room.stroke({ color: parseInt(team.color.replace('#', '0x')), width: 1, alpha: 0.3 });
      app.stage.addChild(room);

      // Team label
      const label = new Text({
        text: team.name,
        style: new TextStyle({ fontFamily: 'DungGeunMo, monospace', fontSize: 12, fill: team.color }),
      });
      label.x = rx + 10;
      label.y = ry + 8;
      app.stage.addChild(label);

      // Place agents in team room
      const teamAgents = agents[team.id] || [];
      teamAgents.forEach((agent, agentIdx) => {
        const col2 = agentIdx % 3;
        const row2 = Math.floor(agentIdx / 3);
        const deskX = rx + 20 + col2 * 88;
        const deskY = ry + 36 + row2 * 80;

        const employeeContainer = new Container();
        employeeContainer.x = deskX;
        employeeContainer.y = deskY;
        employeeContainer.eventMode = 'static';
        employeeContainer.cursor = 'pointer';
        employeeContainer.on('pointerdown', () => selectAgent(agent.id));

        // Desk
        const deskCanvas = createDeskCanvas();
        const deskTexture = Texture.from(deskCanvas);
        const deskSprite = new Sprite(deskTexture);
        deskSprite.y = 20;
        employeeContainer.addChild(deskSprite);

        // Character
        const hairIdx = Math.abs(hashCode(agent.id)) % 6;
        const shirtIdx = Math.abs(hashCode(agent.id + 'shirt')) % 6;
        const charCanvas = createCharacterCanvas(hairIdx, shirtIdx, agent.status as any, 0);
        const charTexture = Texture.from(charCanvas);
        const charSprite = new Sprite(charTexture);
        charSprite.x = 20;
        charSprite.y = -4;
        employeeContainer.addChild(charSprite);

        // Name label
        const nameText = new Text({
          text: agent.name,
          style: new TextStyle({ fontFamily: 'DungGeunMo, monospace', fontSize: 9, fill: '#94a3b8' }),
        });
        nameText.x = 12;
        nameText.y = 52;
        employeeContainer.addChild(nameText);

        // Status indicator
        const statusDot = new Graphics();
        const statusColor = agent.status === 'working' ? 0x10b981 :
          agent.status === 'meeting' ? 0x6366f1 :
          agent.status === 'break' ? 0xf59e0b : 0x64748b;
        statusDot.circle(8, 4, 3);
        statusDot.fill(statusColor);
        employeeContainer.addChild(statusDot);

        app.stage.addChild(employeeContainer);

        employeesRef.current.push({
          agent,
          team,
          container: employeeContainer,
          charSprite,
          frame: 0,
          deskX,
          deskY,
        });
      });
    });

    // Empty state
    if (teams.length === 0) {
      const emptyText = new Text({
        text: 'Create a team to start building your office',
        style: new TextStyle({ fontFamily: 'DungGeunMo, monospace', fontSize: 14, fill: '#475569' }),
      });
      emptyText.x = app.screen.width / 2 - emptyText.width / 2;
      emptyText.y = app.screen.height / 2;
      app.stage.addChild(emptyText);
    }
  }, [ready, teams, agents, selectAgent]);

  // Animation loop
  useEffect(() => {
    if (!ready || !appRef.current) return;
    const app = appRef.current;

    let tick = 0;
    const animate = () => {
      tick++;
      if (tick % 30 === 0) { // Update every 30 frames (~0.5s)
        employeesRef.current.forEach((emp) => {
          emp.frame++;
          const hairIdx = Math.abs(hashCode(emp.agent.id)) % 6;
          const shirtIdx = Math.abs(hashCode(emp.agent.id + 'shirt')) % 6;
          const newCanvas = createCharacterCanvas(hairIdx, shirtIdx, emp.agent.status as any, emp.frame);
          const newTexture = Texture.from(newCanvas);
          emp.charSprite.texture = newTexture;
        });
      }
    };

    app.ticker.add(animate);
    return () => { app.ticker.remove(animate); };
  }, [ready]);

  return (
    <div className="flex-1 bg-slate-900 overflow-hidden">
      <div ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
