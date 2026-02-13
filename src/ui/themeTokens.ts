export const themeTokens = {
  baseBg: '#050816',
  playfieldMetal: '#131a2b',
  panel: '#0f172acc',
  text: '#e2e8f0',
  railStroke: '#6b7280',
  railHighlight: '#cbd5e1',
  rubber: '#f43f5e',
  neonCyan: '#22d3ee',
  neonMagenta: '#e879f9',
  neonAmber: '#f59e0b',
  neonGreen: '#22c55e',
  glowStrength: 18,
} as const;

export type ThemeTokens = typeof themeTokens;
