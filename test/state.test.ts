import { describe, expect, test } from 'vitest';
import { createInitialState, loseBall, nextBall, restartGame, startGame, togglePause } from '../src/game/state';

describe('game state transitions', () => {
  test('start -> playing', () => {
    const started = startGame(createInitialState());
    expect(started.phase).toBe('playing');
  });

  test('loseBall leads to game over at 0 balls', () => {
    const state = { phase: 'playing' as const, ballsLeft: 1 };
    const result = loseBall(state);
    expect(result.phase).toBe('game_over');
    expect(result.ballsLeft).toBe(0);
  });

  test('pause toggles and restart resets', () => {
    const paused = togglePause({ phase: 'playing', ballsLeft: 2 });
    expect(paused.phase).toBe('paused');
    expect(nextBall(paused).phase).toBe('next_ball');
    expect(restartGame()).toEqual({ phase: 'ready', ballsLeft: 3 });
  });
});
