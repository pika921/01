export type TableElementType = 'bumper' | 'target' | 'rollover' | 'kicker' | 'spinner' | 'sling' | 'wall' | 'sensor';

export interface TableElement {
  id: string;
  type: TableElementType;
  shape: 'circle' | 'rect' | 'poly';
  x: number;
  y: number;
  w?: number;
  h?: number;
  r?: number;
  angle?: number;
  vertices?: Array<{ x: number; y: number }>;
  isSensor?: boolean;
}

export const TABLE_LAYOUT: TableElement[] = [
  { id: 'bumper-a', type: 'bumper', shape: 'circle', x: 0.26, y: 0.27, r: 0.048 },
  { id: 'bumper-b', type: 'bumper', shape: 'circle', x: 0.5, y: 0.23, r: 0.056 },
  { id: 'bumper-c', type: 'bumper', shape: 'circle', x: 0.74, y: 0.27, r: 0.048 },
  { id: 'bumper-d', type: 'bumper', shape: 'circle', x: 0.5, y: 0.37, r: 0.042 },
  { id: 'bumper-e', type: 'bumper', shape: 'circle', x: 0.2, y: 0.43, r: 0.036 },
  { id: 'bumper-f', type: 'bumper', shape: 'circle', x: 0.8, y: 0.43, r: 0.036 },

  { id: 'target-u0', type: 'target', shape: 'rect', x: 0.16, y: 0.2, w: 0.05, h: 0.018 },
  { id: 'target-u1', type: 'target', shape: 'rect', x: 0.26, y: 0.15, w: 0.05, h: 0.018 },
  { id: 'target-u2', type: 'target', shape: 'rect', x: 0.38, y: 0.12, w: 0.05, h: 0.018 },
  { id: 'target-u3', type: 'target', shape: 'rect', x: 0.62, y: 0.12, w: 0.05, h: 0.018 },
  { id: 'target-u4', type: 'target', shape: 'rect', x: 0.74, y: 0.15, w: 0.05, h: 0.018 },
  { id: 'target-u5', type: 'target', shape: 'rect', x: 0.84, y: 0.2, w: 0.05, h: 0.018 },
  { id: 'target-c0', type: 'target', shape: 'rect', x: 0.4, y: 0.5, w: 0.045, h: 0.018 },
  { id: 'target-c1', type: 'target', shape: 'rect', x: 0.5, y: 0.47, w: 0.045, h: 0.018 },
  { id: 'target-c2', type: 'target', shape: 'rect', x: 0.6, y: 0.5, w: 0.045, h: 0.018 },
  { id: 'target-r0', type: 'target', shape: 'rect', x: 0.9, y: 0.3, w: 0.03, h: 0.024 },
  { id: 'target-r1', type: 'target', shape: 'rect', x: 0.9, y: 0.36, w: 0.03, h: 0.024 },
  { id: 'target-r2', type: 'target', shape: 'rect', x: 0.9, y: 0.42, w: 0.03, h: 0.024 },

  { id: 'rollover-0', type: 'rollover', shape: 'circle', x: 0.14, y: 0.11, r: 0.02, isSensor: true },
  { id: 'rollover-1', type: 'rollover', shape: 'circle', x: 0.28, y: 0.095, r: 0.02, isSensor: true },
  { id: 'rollover-2', type: 'rollover', shape: 'circle', x: 0.5, y: 0.085, r: 0.02, isSensor: true },
  { id: 'rollover-3', type: 'rollover', shape: 'circle', x: 0.72, y: 0.095, r: 0.02, isSensor: true },
  { id: 'rollover-4', type: 'rollover', shape: 'circle', x: 0.86, y: 0.11, r: 0.02, isSensor: true },
  { id: 'rollover-5', type: 'rollover', shape: 'circle', x: 0.5, y: 0.63, r: 0.019, isSensor: true },

  { id: 'kicker-alpha', type: 'kicker', shape: 'circle', x: 0.8, y: 0.62, r: 0.034, isSensor: true },
  { id: 'kicker-beta', type: 'kicker', shape: 'circle', x: 0.2, y: 0.62, r: 0.034, isSensor: true },
  { id: 'spinner-main', type: 'spinner', shape: 'rect', x: 0.5, y: 0.33, w: 0.09, h: 0.012, angle: 0.15, isSensor: true },

  { id: 'sling-left', type: 'sling', shape: 'poly', x: 0.24, y: 0.77, vertices: [{ x: -0.07, y: 0.035 }, { x: 0.07, y: 0.035 }, { x: 0, y: -0.045 }] },
  { id: 'sling-right', type: 'sling', shape: 'poly', x: 0.76, y: 0.77, vertices: [{ x: -0.07, y: 0.035 }, { x: 0.07, y: 0.035 }, { x: 0, y: -0.045 }] },

  { id: 'sensor-orbit', type: 'sensor', shape: 'rect', x: 0.5, y: 0.08, w: 0.42, h: 0.02, isSensor: true },
  { id: 'sensor-ramp', type: 'sensor', shape: 'rect', x: 0.83, y: 0.28, w: 0.03, h: 0.26, isSensor: true },
  { id: 'sensor-gate-a', type: 'sensor', shape: 'rect', x: 0.86, y: 0.56, w: 0.015, h: 0.11, isSensor: true },
  { id: 'sensor-gate-b', type: 'sensor', shape: 'rect', x: 0.14, y: 0.56, w: 0.015, h: 0.11, isSensor: true },
];
