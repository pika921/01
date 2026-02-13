import { describe, expect, test } from 'vitest';
import { SCORE } from '../src/game/config';
import { createScoreState, registerHit, registerTarget } from '../src/game/score';

describe('score and multiplier', () => {
  test('first hit keeps base multiplier', () => {
    let score = createScoreState();
    score = registerHit(score, SCORE.bumper, 1000);
    expect(score.multiplier).toBe(1);
    expect(score.score).toBe(SCORE.bumper);
  });

  test('combo increases multiplier', () => {
    let score = createScoreState();
    score = registerHit(score, SCORE.bumper, 1000);
    score = registerHit(score, SCORE.bumper, 2000);
    expect(score.multiplier).toBe(2);
    expect(score.score).toBe(SCORE.bumper + SCORE.bumper * 2);
  });

  test('target completion grants mission bonus', () => {
    let score = createScoreState();
    score = registerTarget(score, 0, 3, SCORE.target, SCORE.missionBonus, 1000);
    score = registerTarget(score, 1, 3, SCORE.target, SCORE.missionBonus, 1100);
    score = registerTarget(score, 2, 3, SCORE.target, SCORE.missionBonus, 1200);
    expect(score.targetsLit.size).toBe(0);
    expect(score.multiplier).toBeGreaterThan(1);
    expect(score.score).toBeGreaterThan(SCORE.target * 3);
  });
});
