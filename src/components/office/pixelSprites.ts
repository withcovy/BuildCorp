// 도트 스프라이트를 코드로 생성 (외부 이미지 없이 Canvas API로 그림)

const SPRITE_SIZE = 16;
const SCALE = 2; // 렌더링 시 2배 확대

// 색상 팔레트
const COLORS = {
  skin: '#FFD5B8',
  skinDark: '#E8B896',
  hair: ['#3D2314', '#8B4513', '#D2691E', '#FFD700', '#2F1B14', '#1A1A2E'],
  shirt: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'],
  pants: '#2D3748',
  shoes: '#1A1A2E',
  eye: '#1A1A2E',
  desk: '#5C4033',
  deskTop: '#8B7355',
  monitor: '#1e293b',
  monitorScreen: '#0f172a',
  screenGlow: '#6366f1',
  chair: '#334155',
  coffee: '#8B4513',
  mug: '#E2E8F0',
  floor: '#1e293b',
  wall: '#0f172a',
};

export function createCharacterCanvas(
  hairColorIdx: number = 0,
  shirtColorIdx: number = 0,
  status: 'idle' | 'working' | 'break' | 'meeting' = 'idle',
  frame: number = 0
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const size = SPRITE_SIZE * SCALE;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const px = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
  };

  const hairColor = COLORS.hair[hairColorIdx % COLORS.hair.length];
  const shirtColor = COLORS.shirt[shirtColorIdx % COLORS.shirt.length];

  // Head (rows 2-5)
  // Hair top
  for (let x = 5; x <= 10; x++) px(x, 2, hairColor);
  // Hair sides + face
  px(5, 3, hairColor); px(6, 3, COLORS.skin); px(7, 3, COLORS.skin); px(8, 3, COLORS.skin); px(9, 3, COLORS.skin); px(10, 3, hairColor);
  px(5, 4, hairColor); px(6, 4, COLORS.skin); px(7, 4, COLORS.eye); px(8, 4, COLORS.skin); px(9, 4, COLORS.eye); px(10, 4, COLORS.skin);
  px(6, 5, COLORS.skin); px(7, 5, COLORS.skin); px(8, 5, COLORS.skinDark); px(9, 5, COLORS.skin);

  // Body (rows 6-9)
  const bodyWiggle = status === 'working' && frame % 2 === 1 ? 1 : 0;
  for (let x = 6; x <= 9; x++) px(x, 6, shirtColor);
  px(5, 7, shirtColor); for (let x = 6; x <= 9; x++) px(x, 7, shirtColor); px(10, 7, shirtColor);

  if (status === 'working') {
    // Typing arms
    px(5, 8, COLORS.skin); px(6 + bodyWiggle, 8, shirtColor); px(7, 8, shirtColor); px(8, 8, shirtColor); px(9, 8, shirtColor); px(10 - bodyWiggle, 8, COLORS.skin);
  } else if (status === 'break') {
    // Holding mug
    px(5, 8, COLORS.skin); px(6, 8, shirtColor); px(7, 8, shirtColor); px(8, 8, shirtColor); px(9, 8, shirtColor); px(10, 8, COLORS.skin);
    px(11, 7, COLORS.mug); px(11, 8, COLORS.mug);
  } else {
    px(5, 8, COLORS.skin); px(6, 8, shirtColor); px(7, 8, shirtColor); px(8, 8, shirtColor); px(9, 8, shirtColor); px(10, 8, COLORS.skin);
  }

  // Legs (rows 9-11)
  px(6, 9, COLORS.pants); px(7, 9, COLORS.pants); px(8, 9, COLORS.pants); px(9, 9, COLORS.pants);
  px(6, 10, COLORS.pants); px(7, 10, COLORS.pants); px(8, 10, COLORS.pants); px(9, 10, COLORS.pants);
  px(6, 11, COLORS.shoes); px(7, 11, COLORS.shoes); px(9, 11, COLORS.shoes); px(10, 11, COLORS.shoes);

  return canvas;
}

export function createDeskCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const w = 40 * SCALE;
  const h = 24 * SCALE;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const px = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
  };

  // Desk surface
  for (let x = 0; x < 40; x++) {
    px(x, 10, COLORS.deskTop);
    px(x, 11, COLORS.desk);
  }
  // Desk legs
  for (let y = 12; y < 24; y++) {
    px(2, y, COLORS.desk);
    px(37, y, COLORS.desk);
  }
  // Monitor
  for (let x = 12; x <= 27; x++) {
    for (let y = 0; y <= 8; y++) {
      if (y === 0 || y === 8 || x === 12 || x === 27) {
        px(x, y, COLORS.monitor);
      } else {
        px(x, y, COLORS.monitorScreen);
      }
    }
  }
  // Monitor stand
  px(19, 9, COLORS.monitor); px(20, 9, COLORS.monitor);
  // Screen glow (one pixel)
  px(16, 4, COLORS.screenGlow); px(17, 4, COLORS.screenGlow);
  px(22, 3, COLORS.screenGlow);

  return canvas;
}

export function createChairCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 16 * SCALE;
  canvas.height = 20 * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const px = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
  };

  // Chair back
  for (let y = 0; y < 10; y++) {
    px(2, y, COLORS.chair); px(13, y, COLORS.chair);
    if (y >= 2 && y <= 8) for (let x = 3; x <= 12; x++) px(x, y, '#475569');
  }
  // Seat
  for (let x = 1; x <= 14; x++) px(x, 10, COLORS.chair);
  for (let x = 2; x <= 13; x++) px(x, 11, COLORS.chair);
  // Legs
  px(4, 15, '#1A1A2E'); px(11, 15, '#1A1A2E');
  // Wheels
  px(3, 16, '#64748b'); px(4, 16, '#64748b'); px(10, 16, '#64748b'); px(11, 16, '#64748b');

  return canvas;
}

export { SPRITE_SIZE, SCALE, COLORS };
