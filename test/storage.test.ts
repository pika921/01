import { describe, expect, test } from 'vitest';
import { defaultSettings, loadHighScore, loadSettings, saveHighScore, saveSettings } from '../src/game/storage';

const makeMemoryStore = () => {
  const data = new Map<string, string>();
  return {
    get: (key: string) => data.get(key) ?? null,
    set: (key: string, value: string) => data.set(key, value),
  };
};

describe('storage adapter', () => {
  test('settings read/write', () => {
    const store = makeMemoryStore();
    saveSettings(store, { ...defaultSettings, lowFx: true });
    expect(loadSettings(store).lowFx).toBe(true);
  });

  test('high score read/write', () => {
    const store = makeMemoryStore();
    saveHighScore(store, 12345);
    expect(loadHighScore(store)).toBe(12345);
  });
});
