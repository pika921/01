export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

export interface Settings {
  soundOn: boolean;
  shakeOn: boolean;
  lowFx: boolean;
  debugOn: boolean;
}

export const defaultSettings: Settings = {
  soundOn: true,
  shakeOn: true,
  lowFx: false,
  debugOn: false,
};

export const loadSettings = (storage: StorageAdapter): Settings => {
  const raw = storage.get('pinball-settings');
  if (!raw) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (storage: StorageAdapter, settings: Settings): void => {
  storage.set('pinball-settings', JSON.stringify(settings));
};

export const loadHighScore = (storage: StorageAdapter): number => Number(storage.get('pinball-high-score') ?? 0);

export const saveHighScore = (storage: StorageAdapter, score: number): void => {
  storage.set('pinball-high-score', String(score));
};
