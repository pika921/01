import { describe, expect, test } from 'vitest';
import { createMissionState, getCurrentMission, registerMissionEvent } from '../src/game/mission';

describe('mission progression', () => {
  test('advances first mission after orbit passes', () => {
    let state = createMissionState();
    state = registerMissionEvent(state, 'orbit_pass', 100).state;
    state = registerMissionEvent(state, 'orbit_pass', 200).state;
    const result = registerMissionEvent(state, 'orbit_pass', 300);
    expect(result.completedMission?.id).toBe('orbit-setup');
    expect(result.state.index).toBe(1);
  });

  test('center combo resets after window', () => {
    const state = createMissionState();
    state.index = 2;
    state.progress = 0;
    const hit1 = registerMissionEvent(state, 'center_target_hit', 100).state;
    const hit2 = registerMissionEvent(hit1, 'center_target_hit', 500).state;
    const afterTimeout = registerMissionEvent(hit2, 'center_target_hit', 3000).state;
    expect(afterTimeout.progress).toBe(1);
  });

  test('sling mission requires left-right pair', () => {
    const state = createMissionState();
    state.index = 5;
    state.progress = 0;
    const left = registerMissionEvent(state, 'sling_left', 100).state;
    const pair = registerMissionEvent(left, 'sling_right', 300).state;
    expect(pair.progress).toBe(1);
  });

  test('returns null current mission after all clear', () => {
    const state = createMissionState();
    state.index = state.missions.length;
    expect(getCurrentMission(state)).toBeNull();
  });
});
