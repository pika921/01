import './styles/main.css';
import { PinballGame } from './game/pinball';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App missing');

app.innerHTML = `
  <div class="layout">
    <canvas id="board" width="540" height="840" aria-label="pinball board"></canvas>
    <aside class="panel">
      <h1>Pinball Lab</h1>
      <p>ターゲット3枚を揃えるとミッションボーナス + 倍率UP</p>
      <label><input type="checkbox" id="sound" checked /> サウンドON/OFF</label>
      <label><input type="checkbox" id="shake" checked /> 画面揺れON/OFF</label>
      <label><input type="checkbox" id="lowfx" /> 演出軽量化ON/OFF</label>
      <label><input type="checkbox" id="debug" /> デバッグ表示ON/OFF</label>
      <button id="restart">リスタート</button>
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
