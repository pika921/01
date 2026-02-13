export type GamePhase =
  | 'ready'
  | 'playing'
  | 'ball_lost'
  | 'next_ball'
  | 'game_over'
  | 'paused';

export interface GameState {
  phase: GamePhase;
  ballsLeft: number;
}

export const createInitialState = (): GameState => ({
  phase: 'ready',
  ballsLeft: 3,
});

export const startGame = (state: GameState): GameState => ({ ...state, phase: 'playing' });

export const loseBall = (state: GameState): GameState => {
  const nextBalls = Math.max(0, state.ballsLeft - 1);
  return {
    ballsLeft: nextBalls,
    phase: nextBalls === 0 ? 'game_over' : 'ball_lost',
  };
};

export const nextBall = (state: GameState): GameState => ({ ...state, phase: 'next_ball' });

export const togglePause = (state: GameState): GameState => ({
  ...state,
  phase: state.phase === 'paused' ? 'playing' : 'paused',
});

export const restartGame = (): GameState => createInitialState();
