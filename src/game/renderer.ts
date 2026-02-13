import type { Body } from 'matter-js';
import { themeTokens } from '../ui/themeTokens';

export type RenderType = 'bumper' | 'target' | 'rollover' | 'kicker' | 'spinner' | 'sling' | 'flipper' | 'plunger' | 'ball';

export interface RenderItem {
  id: string;
  type: RenderType;
  body: Body;
  z: number;
  lightState: number;
}

export interface DrawContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  lowFx: boolean;
  trail: Array<{ x: number; y: number }>;
  items: RenderItem[];
}

const bodyPath = (body: Body): Path2D => {
  const path = new Path2D();
  const { vertices } = body;
  path.moveTo(vertices[0].x, vertices[0].y);
  for (const v of vertices.slice(1)) path.lineTo(v.x, v.y);
  path.closePath();
  return path;
};

const fillMetal = (ctx: CanvasRenderingContext2D, path: Path2D, body: Body) => {
  const g = ctx.createLinearGradient(body.bounds.min.x, body.bounds.min.y, body.bounds.max.x, body.bounds.max.y);
  g.addColorStop(0, '#1f2937');
  g.addColorStop(1, '#0b1220');
  ctx.fillStyle = g;
  ctx.fill(path);
};

const drawStyled = (ctx: CanvasRenderingContext2D, body: Body, color: string, glow = 0) => {
  const path = bodyPath(body);
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  fillMetal(ctx, path, body);
  ctx.strokeStyle = themeTokens.railStroke;
  ctx.lineWidth = 2;
  ctx.stroke(path);
  ctx.strokeStyle = themeTokens.railHighlight;
  ctx.lineWidth = 1;
  ctx.stroke(path);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.45;
  ctx.fill(path);
  ctx.restore();
};

const drawBumper = (ctx: CanvasRenderingContext2D, item: RenderItem) => {
  drawStyled(ctx, item.body, themeTokens.neonMagenta, item.lightState * themeTokens.glowStrength);
  ctx.save();
  ctx.beginPath();
  ctx.arc(item.body.position.x, item.body.position.y, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#111827';
  ctx.fill();
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
};

const drawTarget = (ctx: CanvasRenderingContext2D, item: RenderItem) => {
  drawStyled(ctx, item.body, item.lightState > 0 ? themeTokens.neonGreen : themeTokens.neonCyan, 10 * item.lightState);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(item.body.position.x, item.body.position.y, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = item.lightState > 0 ? '#86efac' : '#1e293b';
  ctx.fill();
  ctx.restore();
};

const drawRollover = (ctx: CanvasRenderingContext2D, item: RenderItem) => {
  const lit = item.lightState > 0;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(item.body.position.x, item.body.position.y, 10, 7, 0, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(item.body.position.x, item.body.position.y, 1, item.body.position.x, item.body.position.y, 10);
  g.addColorStop(0, lit ? '#d9f99d' : '#334155');
  g.addColorStop(1, lit ? '#65a30d' : '#0f172a');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
};

const drawKicker = (ctx: CanvasRenderingContext2D, item: RenderItem) => {
  const r = 17;
  ctx.save();
  ctx.beginPath();
  ctx.arc(item.body.position.x, item.body.position.y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = themeTokens.neonAmber;
  ctx.shadowColor = themeTokens.neonAmber;
  ctx.shadowBlur = 12 * item.lightState;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(item.body.position.x, item.body.position.y, r - 6, 0, Math.PI * 2);
  ctx.fillStyle = '#020617';
  ctx.fill();
  ctx.restore();
};

const drawSpinner = (ctx: CanvasRenderingContext2D, item: RenderItem) => {
  drawStyled(ctx, item.body, themeTokens.neonAmber, item.lightState * 8);
  ctx.save();
  ctx.beginPath();
  ctx.arc(item.body.position.x, item.body.position.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.restore();
};

const drawSling = (ctx: CanvasRenderingContext2D, item: RenderItem) => {
  drawStyled(ctx, item.body, themeTokens.rubber, item.lightState * 8);
};

const drawFlipper = (ctx: CanvasRenderingContext2D, item: RenderItem) => {
  const path = bodyPath(item.body);
  ctx.save();
  fillMetal(ctx, path, item.body);
  ctx.fillStyle = '#f43f5e99';
  ctx.fill(path);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 1.5;
  ctx.stroke(path);
  ctx.beginPath();
  ctx.arc(item.body.position.x, item.body.position.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#94a3b8';
  ctx.fill();
  ctx.restore();
};

const drawPlunger = (ctx: CanvasRenderingContext2D, item: RenderItem) => {
  drawStyled(ctx, item.body, '#94a3b8', 0);
};

const drawBall = (ctx: CanvasRenderingContext2D, item: RenderItem, lowFx: boolean) => {
  const r = 11;
  ctx.save();
  ctx.beginPath();
  ctx.arc(item.body.position.x, item.body.position.y, r, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(item.body.position.x - 4, item.body.position.y - 4, 1, item.body.position.x, item.body.position.y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#d1d5db');
  ctx.fillStyle = g;
  ctx.shadowColor = '#fde047';
  ctx.shadowBlur = lowFx ? 6 : 15;
  ctx.fill();
  ctx.restore();
};

export const drawTable = (d: DrawContext) => {
  const { ctx, width, height } = d;
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, themeTokens.baseBg);
  bg.addColorStop(0.45, '#120a32');
  bg.addColorStop(1, '#1b0d2a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = themeTokens.playfieldMetal;
  ctx.fillRect(16, 16, width - 32, height - 32);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  for (let i = 0; i < 56; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#67e8f922' : '#f0abfc22';
    ctx.fillRect((i * 117) % width, (i * 149) % height, 2, 2);
  }

  d.trail.forEach((point, index) => {
    ctx.fillStyle = `rgba(251, 191, 36, ${(d.trail.length - index) / (d.trail.length * 4.8)})`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 10 - index * 0.8, 0, Math.PI * 2);
    ctx.fill();
  });

  const items = [...d.items].sort((a, b) => a.z - b.z);
  for (const item of items) {
    if (item.type === 'bumper') drawBumper(ctx, item);
    if (item.type === 'target') drawTarget(ctx, item);
    if (item.type === 'rollover') drawRollover(ctx, item);
    if (item.type === 'kicker') drawKicker(ctx, item);
    if (item.type === 'spinner') drawSpinner(ctx, item);
    if (item.type === 'sling') drawSling(ctx, item);
    if (item.type === 'flipper') drawFlipper(ctx, item);
    if (item.type === 'plunger') drawPlunger(ctx, item);
    if (item.type === 'ball') drawBall(ctx, item, d.lowFx);
  }

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(width * 0.84, 85, width * 0.09, height * 0.74);
  ctx.strokeRect(width * 0.07, 85, width * 0.09, height * 0.74);
};
