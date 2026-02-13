export type MissionEvent =
  | 'upper_lane'
  | 'right_target_group_complete'
  | 'center_target_hit'
  | 'sling_left'
  | 'sling_right'
  | 'kicker_alpha'
  | 'kicker_beta'
  | 'rollover_cycle'
  | 'spinner_tick'
  | 'orbit_pass';

export interface MissionReward {
  scoreBonus?: number;
  multiplierBoost?: number;
  ballSaveMs?: number;
  jackpotMs?: number;
  extraBall?: number;
}

export interface MissionDefinition {
  id: string;
  title: string;
  description: string;
  target: number;
  event: MissionEvent;
  reward: MissionReward;
}

export interface MissionState {
  index: number;
  progress: number;
  missions: MissionDefinition[];
  completed: string[];
  centerChainWindowUntil: number;
  slingsPairWindowUntil: number;
  pendingLeftSling: boolean;
}

export const missionDefinitions: MissionDefinition[] = [
  { id: 'orbit-setup', title: 'M1 ORBIT SETUP', description: '外周オービットを3回通過', target: 3, event: 'orbit_pass', reward: { multiplierBoost: 1, scoreBonus: 1200 } },
  { id: 'target-sweep-a', title: 'M2 TARGET SWEEP A', description: '右ターゲット群を2セット点灯', target: 2, event: 'right_target_group_complete', reward: { scoreBonus: 1800 } },
  { id: 'target-sweep-b', title: 'M3 TARGET SWEEP B', description: '中央ターゲットを連続4回', target: 4, event: 'center_target_hit', reward: { jackpotMs: 8000, scoreBonus: 2300 } },
  { id: 'lane-charge', title: 'M4 LANE CHARGE', description: '上部レーンを5回通過', target: 5, event: 'upper_lane', reward: { multiplierBoost: 1, scoreBonus: 2200 } },
  { id: 'spinner-rush', title: 'M5 SPINNER RUSH', description: 'スピナー60カウント', target: 60, event: 'spinner_tick', reward: { scoreBonus: 2500 } },
  { id: 'bumper-heat', title: 'M6 BUMPER HEAT', description: '左右スリング往復8回', target: 8, event: 'sling_left', reward: { ballSaveMs: 12000, scoreBonus: 2800 } },
  { id: 'kicker-delivery', title: 'M7 KICKER DELIVERY', description: 'αキッカーに2回入れる', target: 2, event: 'kicker_alpha', reward: { scoreBonus: 3000, multiplierBoost: 1 } },
  { id: 'jackpot-build', title: 'M8 JACKPOT BUILD', description: 'βキッカー2回で追加ボール', target: 2, event: 'kicker_beta', reward: { extraBall: 1, scoreBonus: 5000, jackpotMs: 12000 } },
];

export const createMissionState = (): MissionState => ({
  index: 0,
  progress: 0,
  missions: missionDefinitions,
  completed: [],
  centerChainWindowUntil: 0,
  slingsPairWindowUntil: 0,
  pendingLeftSling: false,
});

export interface MissionAdvanceResult {
  state: MissionState;
  completedMission?: MissionDefinition;
}

export const registerMissionEvent = (state: MissionState, event: MissionEvent, now: number): MissionAdvanceResult => {
  if (state.index >= state.missions.length) return { state };
  const current = state.missions[state.index];
  let progressIncrement = 0;

  if (event === 'center_target_hit') {
    if (now > state.centerChainWindowUntil) state.progress = 0;
    state.centerChainWindowUntil = now + 1800;
  }

  if (event === 'sling_left' || event === 'sling_right') {
    if (now > state.slingsPairWindowUntil) state.pendingLeftSling = false;
    state.slingsPairWindowUntil = now + 2000;
  }

  if (current.event === 'sling_left') {
    if (event === 'sling_left') {
      state.pendingLeftSling = true;
      return { state };
    }
    if (event === 'sling_right' && state.pendingLeftSling) {
      state.pendingLeftSling = false;
      progressIncrement = 1;
    }
  } else if (event === current.event) {
    progressIncrement = 1;
  }

  if (progressIncrement === 0) return { state };

  const nextProgress = state.progress + progressIncrement;
  if (nextProgress < current.target) return { state: { ...state, progress: nextProgress } };

  const completedMission = current;
  return {
    completedMission,
    state: {
      ...state,
      index: state.index + 1,
      progress: 0,
      completed: [...state.completed, current.id],
    },
  };
};

export const getCurrentMission = (state: MissionState): MissionDefinition | null => state.missions[state.index] ?? null;

export const getNextMissions = (state: MissionState, count = 2): MissionDefinition[] =>
  state.missions.slice(state.index + 1, state.index + 1 + count);
