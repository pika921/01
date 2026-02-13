import './styles/main.css';
import { PinballGame } from './game/pinball';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App missing');

app.innerHTML = `
  <div class="layout">
    <section class="board-wrap">
      <canvas id="board" width="540" height="840" aria-label="pinball board"></canvas>
      <div class="hud" aria-live="polite">
        <span id="hud-score">SCORE 0</span>
        <span id="hud-multi">x1</span>
        <span id="hud-phase">READY</span>
        <span id="hud-balls">BALL 3</span>
      </div>
      <div class="flipper-indicator">
        <span id="left-indicator">LEFT</span>
        <span id="right-indicator">RIGHT</span>
      </div>
    </section>
    <aside class="panel">
      <h1>Neon Orbit Pinball</h1>
      <p>高密度宇宙テーブル。ミッションを順番に攻略してジャックポットを狙う。</p>
      <section class="mission-box">
        <h2 id="mission-title">MISSION 1</h2>
        <p id="mission-desc">上部レーンを3回通過</p>
        <p id="mission-progress">0/3</p>
        <p id="mission-next">NEXT: -</p>
      </section>
      <section class="control-box">
        <label><input type="checkbox" id="sound" checked /> サウンドON/OFF</label>
        <label><input type="checkbox" id="shake" checked /> 画面揺れON/OFF</label>
        <label><input type="checkbox" id="lowfx" /> 演出軽量化ON/OFF</label>
        <label><input type="checkbox" id="debug" /> デバッグ表示ON/OFF</label>
      </section>
      <button id="restart">リスタート</button>
      <p class="help">PC: A/← 左  L/→ 右  Space長押し発射</p>
      <p class="help">モバイル: 左右タップでフリッパー / 画面下長押しで発射</p>
    </aside>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#board');
if (!canvas) throw new Error('Canvas missing');
const game = new PinballGame(canvas);
const settings = game.getSettings();

const bindToggle = (id: string, key: 'soundOn' | 'shakeOn' | 'lowFx' | 'debugOn') => {
  const input = document.querySelector<HTMLInputElement>(`#${id}`);
  if (!input) return;
  input.checked = settings[key];
  input.addEventListener('change', () => game.updateSettings({ [key]: input.checked }));
};

bindToggle('sound', 'soundOn');
bindToggle('shake', 'shakeOn');
bindToggle('lowfx', 'lowFx');
bindToggle('debug', 'debugOn');

document.querySelector<HTMLButtonElement>('#restart')?.addEventListener('click', () => game.reset());

const hudScore = document.querySelector<HTMLElement>('#hud-score');
const hudMulti = document.querySelector<HTMLElement>('#hud-multi');
const hudPhase = document.querySelector<HTMLElement>('#hud-phase');
const hudBalls = document.querySelector<HTMLElement>('#hud-balls');
const missionTitle = document.querySelector<HTMLElement>('#mission-title');
const missionDesc = document.querySelector<HTMLElement>('#mission-desc');
const missionProgress = document.querySelector<HTMLElement>('#mission-progress');
const missionNext = document.querySelector<HTMLElement>('#mission-next');
const leftIndicator = document.querySelector<HTMLElement>('#left-indicator');
const rightIndicator = document.querySelector<HTMLElement>('#right-indicator');

const tickHud = () => {
  const snapshot = game.getSnapshot();
  if (hudScore) hudScore.textContent = `SCORE ${snapshot.score}`;
  if (hudMulti) hudMulti.textContent = `x${snapshot.multiplier}`;
  if (hudPhase) hudPhase.textContent = snapshot.phase.toUpperCase();
  if (hudBalls) hudBalls.textContent = `BALL ${snapshot.ballsLeft}`;
  if (missionTitle) missionTitle.textContent = snapshot.missionTitle;
  if (missionDesc) missionDesc.textContent = snapshot.missionDescription;
  if (missionProgress) missionProgress.textContent = snapshot.missionProgress;
  if (missionNext) missionNext.textContent = `NEXT: ${snapshot.nextMissions.join(' / ') || '-'}`;
  if (leftIndicator) leftIndicator.classList.toggle('active', snapshot.leftActive);
  if (rightIndicator) rightIndicator.classList.toggle('active', snapshot.rightActive);
  requestAnimationFrame(tickHud);
};

tickHud();
