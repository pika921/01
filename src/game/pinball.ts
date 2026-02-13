import Matter, { Body, Bodies, Composite, Engine, Events, Runner, World } from 'matter-js';
import { BOARD, SCORE } from './config';
import { createScoreState, registerHit, registerTarget, type ScoreState } from './score';
import {
  createInitialState,
  loseBall,
  nextBall,
  restartGame,
  startGame,
  togglePause,
  type GameState,
} from './state';
import { defaultSettings, loadHighScore, loadSettings, saveHighScore, saveSettings, type Settings } from './storage';

interface RenderSnapshot {
  score: number;
  multiplier: number;
  ballsLeft: number;
  highScore: number;
  phase: string;
  debug: string;
}

export class PinballGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine = Engine.create();
  private runner = Runner.create();
  private ball = Bodies.circle(470, 730, 11, { label: 'ball' });
  private leftFlipper = Bodies.rectangle(175, 710, 100, 20, { label: 'leftFlipper' });
  private rightFlipper = Bodies.rectangle(365, 710, 100, 20, { label: 'rightFlipper' });
  private plunger = Bodies.rectangle(470, 770, 22, 80, { isStatic: true, label: 'plunger' });
  private bumpers = [Bodies.circle(180, 260, 30, { isStatic: true, label: 'bumper' }), Bodies.circle(310, 300, 30, { isStatic: true, label: 'bumper' })];
  private slings = [Bodies.polygon(132, 640, 3, 38, { isStatic: true, angle: 0.4, label: 'sling' }), Bodies.polygon(408, 640, 3, 38, { isStatic: true, angle: -0.4, label: 'sling' })];
  private targets = [Bodies.rectangle(150, 170, 32, 18, { isStatic: true, label: 'target0' }), Bodies.rectangle(270, 140, 32, 18, { isStatic: true, label: 'target1' }), Bodies.rectangle(390, 170, 32, 18, { isStatic: true, label: 'target2' })];
  private state: GameState = createInitialState();
  private score: ScoreState = createScoreState();
  private settings: Settings;
  private highScore = 0;
  private launchCharge = 0;
  private leftPressed = false;
  private rightPressed = false;
  private mobileLaunch = 0;
  private running = true;
  private collisionsThisSecond = 0;
  private fps = 0;
  private frameCount = 0;
  private lastFpsSample = performance.now();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context missing');
    this.ctx = ctx;

    const adapter = {
      get: (k: string) => localStorage.getItem(k),
      set: (k: string, v: string) => localStorage.setItem(k, v),
    };
    this.settings = loadSettings(adapter);
    this.highScore = loadHighScore(adapter);

    this.setupPhysics();
    this.attachInput();
    this.attachCollisions();
    Runner.run(this.runner, this.engine);
    requestAnimationFrame(this.render);
  }

  private setupPhysics() {
    this.engine.gravity.y = BOARD.gravity;
    this.ball.restitution = BOARD.restitution;
    this.ball.frictionAir = BOARD.airFriction;
    this.ball.friction = BOARD.friction;

    Body.setInertia(this.leftFlipper, Infinity);
    Body.setInertia(this.rightFlipper, Infinity);

    const walls = [
      Bodies.rectangle(270, -10, 540, 20, { isStatic: true }),
      Bodies.rectangle(-10, 420, 20, 840, { isStatic: true }),
      Bodies.rectangle(550, 350, 20, 700, { isStatic: true }),
      Bodies.rectangle(90, 805, 180, 20, { isStatic: true, angle: 0.23 }),
      Bodies.rectangle(450, 805, 180, 20, { isStatic: true, angle: -0.23 }),
      Bodies.rectangle(470, 370, 20, 560, { isStatic: true }),
      Bodies.rectangle(490, 90, 40, 20, { isStatic: true }),
    ];

    World.add(this.engine.world, [
      ...walls,
      this.ball,
      this.leftFlipper,
      this.rightFlipper,
      this.plunger,
      ...this.bumpers,
      ...this.slings,
      ...this.targets,
    ]);
  }

  private attachCollisions() {
    Events.on(this.engine, 'collisionStart', (event) => {
      this.collisionsThisSecond += event.pairs.length;
      const now = performance.now();
      for (const pair of event.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (!labels.includes('ball')) continue;
        if (labels.includes('bumper')) {
          this.score = registerHit(this.score, SCORE.bumper, now);
        }
        if (labels.includes('sling')) {
          this.score = registerHit(this.score, SCORE.sling, now);
        }
        const target = labels.find((label) => label.startsWith('target'));
        if (target) {
          const targetId = Number(target.replace('target', ''));
          this.score = registerTarget(this.score, targetId, this.targets.length, SCORE.target, SCORE.missionBonus, now);
        }
      }
      this.highScore = Math.max(this.highScore, this.score.score);
      saveHighScore({ get: () => null, set: (k, v) => localStorage.setItem(k, v) }, this.highScore);
    });
  }

  private attachInput() {
    const onDown = (code: string) => {
      if (code === 'ArrowLeft' || code === 'KeyA') this.leftPressed = true;
      if (code === 'ArrowRight' || code === 'KeyL') this.rightPressed = true;
      if (code === 'Space') this.launchCharge = Math.min(1, this.launchCharge + 0.08);
      if (code === 'KeyP') this.state = togglePause(this.state);
      if (code === 'KeyR' && confirm('Restart game?')) this.reset();
    };
    const onUp = (code: string) => {
      if (code === 'ArrowLeft' || code === 'KeyA') this.leftPressed = false;
      if (code === 'ArrowRight' || code === 'KeyL') this.rightPressed = false;
      if (code === 'Space') this.fire();
    };
    window.addEventListener('keydown', (event) => onDown(event.code));
    window.addEventListener('keyup', (event) => onUp(event.code));

    this.canvas.addEventListener('pointerdown', (event) => {
      const x = event.offsetX;
      if (event.offsetY > 760) {
        this.mobileLaunch = performance.now();
      } else if (x < this.canvas.width / 2) {
        this.leftPressed = true;
      } else {
        this.rightPressed = true;
      }
    });
    this.canvas.addEventListener('pointerup', (event) => {
      if (event.offsetY > 760) {
        this.launchCharge = Math.min(1, (performance.now() - this.mobileLaunch) / 1000);
        this.fire();
      }
      this.leftPressed = false;
      this.rightPressed = false;
    });
  }

  private resetBall() {
    Body.setPosition(this.ball, { x: 470, y: 730 });
    Body.setVelocity(this.ball, { x: 0, y: 0 });
    Body.setAngularVelocity(this.ball, 0);
  }

  private fire() {
    if (this.state.phase === 'ready' || this.state.phase === 'next_ball') this.state = startGame(this.state);
    const force = Math.max(0.012, this.launchCharge * BOARD.launchMaxForce);
    Body.applyForce(this.ball, this.ball.position, { x: 0, y: -force });
    this.launchCharge = 0;
  }

  private tick() {
    if (this.state.phase === 'paused' || this.state.phase === 'game_over') return;

    const leftAngle = this.leftPressed ? -0.8 : -0.25;
    const rightAngle = this.rightPressed ? 0.8 : 0.25;
    Body.setAngle(this.leftFlipper, leftAngle);
    Body.setAngle(this.rightFlipper, rightAngle);

    if (this.leftPressed) Body.setAngularVelocity(this.leftFlipper, -BOARD.flipperPower);
    if (this.rightPressed) Body.setAngularVelocity(this.rightFlipper, BOARD.flipperPower);

    for (let i = 0; i < BOARD.substeps; i += 1) {
      Engine.update(this.engine, 1000 / 60 / BOARD.substeps);
    }

    const speed = Matter.Vector.magnitude(this.ball.velocity);
    if (speed > BOARD.maxSpeed) {
      const factor = BOARD.maxSpeed / speed;
      Body.setVelocity(this.ball, { x: this.ball.velocity.x * factor, y: this.ball.velocity.y * factor });
    }

    if (this.ball.position.y > BOARD.height + 20) {
      this.state = loseBall(this.state);
      if (this.state.phase === 'game_over') {
        return;
      }
      this.state = nextBall(this.state);
      this.resetBall();
    }
  }

  private drawBody(body: Body, color: string) {
    const { vertices } = body;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(vertices[0].x, vertices[0].y);
    for (const v of vertices.slice(1)) this.ctx.lineTo(v.x, v.y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private render = () => {
    if (!this.running) return;
    this.tick();

    this.ctx.fillStyle = '#0b1020';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.bumpers.forEach((b) => this.drawBody(b, '#fbbf24'));
    this.slings.forEach((s) => this.drawBody(s, '#f472b6'));
    this.targets.forEach((t, i) => this.drawBody(t, this.score.targetsLit.has(i) ? '#34d399' : '#60a5fa'));
    this.drawBody(this.leftFlipper, '#f8fafc');
    this.drawBody(this.rightFlipper, '#f8fafc');
    this.drawBody(this.ball, '#fde68a');

    const snapshot: RenderSnapshot = {
      score: this.score.score,
      multiplier: this.score.multiplier,
      ballsLeft: this.state.ballsLeft,
      highScore: this.highScore,
      phase: this.state.phase,
      debug: `FPS:${this.fps} SPEED:${Matter.Vector.magnitude(this.ball.velocity).toFixed(2)} HIT/s:${this.collisionsThisSecond} STEP:${BOARD.substeps}`,
    };

    this.ctx.fillStyle = '#e2e8f0';
    this.ctx.font = '20px sans-serif';
    this.ctx.fillText(`SCORE ${snapshot.score}`, 18, 30);
    this.ctx.fillText(`x${snapshot.multiplier}`, 18, 56);
    this.ctx.fillText(`BALL ${snapshot.ballsLeft}`, 18, 82);
    this.ctx.fillText(`HI ${snapshot.highScore}`, 18, 108);
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText('A/← 左  L/→ 右  Space 発射  P Pause  R Restart', 18, 824);
    this.ctx.fillText(`PHASE ${snapshot.phase}`, 350, 30);
    if (this.settings.debugOn) this.ctx.fillText(snapshot.debug, 18, 136);

    this.frameCount += 1;
    const now = performance.now();
    if (now - this.lastFpsSample >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsSample = now;
      this.collisionsThisSecond = 0;
    }

    requestAnimationFrame(this.render);
  };

  public updateSettings(next: Partial<Settings>) {
    this.settings = { ...this.settings, ...next };
    saveSettings(
      {
        get: (k) => localStorage.getItem(k),
        set: (k, v) => localStorage.setItem(k, v),
      },
      this.settings,
    );
  }

  public reset() {
    this.state = restartGame();
    this.score = createScoreState();
    this.resetBall();
  }

  public getSettings() {
    return this.settings ?? defaultSettings;
  }
}
