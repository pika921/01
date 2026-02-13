import { MULTIPLIER_WINDOW_MS } from './config';

export interface ScoreState {
  score: number;
  multiplier: number;
  lastHitAt: number;
  targetsLit: Set<number>;
}

export const createScoreState = (): ScoreState => ({
  score: 0,
  multiplier: 1,
  lastHitAt: 0,
  targetsLit: new Set(),
});

export const registerHit = (state: ScoreState, points: number, now: number): ScoreState => {
  const comboActive = state.lastHitAt > 0 && now - state.lastHitAt <= MULTIPLIER_WINDOW_MS;
  const multiplier = comboActive ? Math.min(6, state.multiplier + 1) : 1;
  return {
    ...state,
    multiplier,
    lastHitAt: now,
    score: state.score + points * multiplier,
  };
};

export const registerTarget = (
  state: ScoreState,
  targetId: number,
  targetCount: number,
  targetPoints: number,
  missionBonus: number,
  now: number,
): ScoreState => {
  const withTarget = registerHit(state, targetPoints, now);
  withTarget.targetsLit = new Set(withTarget.targetsLit);
  withTarget.targetsLit.add(targetId);
  if (withTarget.targetsLit.size >= targetCount) {
    withTarget.score += missionBonus * withTarget.multiplier;
    withTarget.multiplier = Math.min(8, withTarget.multiplier + 1);
    withTarget.targetsLit.clear();
  }
  return withTarget;
};
