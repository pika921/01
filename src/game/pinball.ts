import Matter, { Body, Bodies, Engine, Events, Runner, World, type IChamferableBodyDefinition } from 'matter-js';
import { BOARD, SCORE } from './config';
import { drawTable } from './renderer';
import { createMissionState, getCurrentMission, getNextMissions, registerMissionEvent, type MissionDefinition, type MissionState } from './mission';
import { createScoreState, registerHit, registerTarget, type ScoreState } from './score';
import { createInitialState, loseBall, nextBall, restartGame, startGame, togglePause, type GameState } from './state';
import { defaultSettings, loadHighScore, loadSettings, saveHighScore, saveSettings, type Settings } from './storage';
import { TABLE_LAYOUT } from './tableLayout';

interface RenderSnapshot {
  score: number;
  multiplier: number;
  ballsLeft: number;
  highScore: number;
  phase: string;
  debug: string;
  missionTitle: string;
  missionDescription: string;
  missionProgress: string;
  nextMissions: string[];
  leftActive: boolean;
  rightActive: boolean;
}

const KICK_FORCE_ALPHA = { x: -0.024, y: -0.042 };
const KICK_FORCE_BETA = { x: 0.024, y: -0.042 };

export class PinballGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine = Engine.create();
  private runner = Runner.create();

  private ball = Bodies.circle(500, 744, 11, { label: 'ball' });
  private leftFlipper = Bodies.rectangle(180, 712, 106, 20, { isStatic: true, label: 'leftFlipper' });
  private rightFlipper = Bodies.rectangle(360, 712, 106, 20, { isStatic: true, label: 'rightFlipper' });
  private plunger = Bodies.rectangle(500, 784, 22, 80, { isStatic: true, label: 'plunger' });

  private bumpers: Body[] = [];
  private targets: Body[] = [];
  private rollovers: Body[] = [];
  private slings: Body[] = [];
  private kickers: Body[] = [];
  private spinner!: Body;
  private sensorOrbit!: Body;
  private sensorRamp!: Body;
  private sensorGateA!: Body;
  private sensorGateB!: Body;

  private litRollovers = new Set<number>();
  private litRightTargets = new Set<number>();
  private state: GameState = createInitialState();
  private score: ScoreState = createScoreState();
  private mission: MissionState = createMissionState();
  private settings: Settings;
  private highScore = 0;
  private launchCharge = 0;
  private launchHeld = false;
  private leftPressed = false;
  private rightPressed = false;
  private leftKickUsed = false;
  private rightKickUsed = false;
  private mobileLaunch = 0;
  private collisionsThisSecond = 0;
  private fps = 0;
  private frameCount = 0;
  private shakeFrames = 0;
  private trail: Array<{ x: number; y: number }> = [];
  private ballSaveUntil = 0;
  private jackpotUntil = 0;
  private kickerCooldownUntil = 0;
  private spinnerCooldownUntil = 0;
  private popupText = 'READY';
  private popupUntil = 0;
  private lastFpsSample = performance.now();
  private dpr = Math.max(1, window.devicePixelRatio || 1);
  private latestSnapshot: RenderSnapshot = {
    score: 0,
    multiplier: 1,
    ballsLeft: 3,
    highScore: 0,
    phase: 'ready',
    debug: 'FPS:0 SPEED:0.00 HIT/s:0 STEP:2 M:1/8',
    missionTitle: 'MISSION READY',
    missionDescription: '外周オービットを3回通過',
    missionProgress: '0/3',
    nextMissions: [],
    leftActive: false,
    rightActive: false,
  };

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

    this.setupHiDpi();
    this.setupPhysics();
    this.attachInput();
    this.attachCollisions();
    Runner.run(this.runner, this.engine);
    requestAnimationFrame(this.render);
  }


  private setupHiDpi() {
    const cssWidth = BOARD.width;
    const cssHeight = BOARD.height;
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.canvas.width = Math.floor(cssWidth * this.dpr);
    this.canvas.height = Math.floor(cssHeight * this.dpr);
  }

  private toX(value: number) {
    return value * BOARD.width;
  }

  private toY(value: number) {
    return value * BOARD.height;
  }

  private createLayoutBody(def: (typeof TABLE_LAYOUT)[number], options: IChamferableBodyDefinition = {}) {
    const isSensor = def.isSensor ?? false;
    const base = { isStatic: true, isSensor, label: def.id, ...options };
    if (def.shape === 'circle') return Bodies.circle(this.toX(def.x), this.toY(def.y), this.toX(def.r ?? 0.03), base);
    if (def.shape === 'rect') return Bodies.rectangle(this.toX(def.x), this.toY(def.y), this.toX(def.w ?? 0.03), this.toY(def.h ?? 0.03), { ...base, angle: def.angle ?? 0 });
    const vertices = (def.vertices ?? []).map((v) => ({ x: this.toX(v.x), y: this.toY(v.y) }));
    return Bodies.fromVertices(this.toX(def.x), this.toY(def.y), [vertices], base, true);
  }

  private setupPhysics() {
    this.engine.gravity.y = BOARD.gravity;
    this.ball.restitution = BOARD.restitution;
    this.ball.frictionAir = BOARD.airFriction;
    this.ball.friction = BOARD.friction;

    const walls = [
      Bodies.rectangle(270, -10, 540, 20, { isStatic: true }),
      Bodies.rectangle(-10, 420, 20, 840, { isStatic: true }),
      Bodies.rectangle(550, 350, 20, 700, { isStatic: true }),
      Bodies.rectangle(90, 804, 180, 20, { isStatic: true, angle: 0.23 }),
      Bodies.rectangle(450, 804, 180, 20, { isStatic: true, angle: -0.23 }),
      Bodies.rectangle(468, 372, 16, 560, { isStatic: true }),
      Bodies.rectangle(500, 90, 44, 20, { isStatic: true }),
      Bodies.circle(82, 704, 12, { isStatic: true }),
      Bodies.circle(458, 704, 12, { isStatic: true }),
      Bodies.rectangle(210, 470, 120, 12, { isStatic: true, angle: -0.55 }),
      Bodies.rectangle(330, 470, 120, 12, { isStatic: true, angle: 0.55 }),
      Bodies.rectangle(270, 560, 92, 12, { isStatic: true }),
      Bodies.rectangle(503, 560, 20, 96, { isStatic: true, angle: -0.3 }),
    ];

    TABLE_LAYOUT.forEach((def) => {
      const body = this.createLayoutBody(def);
      if (def.type === 'bumper') this.bumpers.push(body);
      if (def.type === 'target') this.targets.push(body);
      if (def.type === 'rollover') this.rollovers.push(body);
      if (def.type === 'sling') this.slings.push(body);
      if (def.type === 'kicker') this.kickers.push(body);
      if (def.id === 'spinner-main') this.spinner = body;
      if (def.id === 'sensor-orbit') this.sensorOrbit = body;
      if (def.id === 'sensor-ramp') this.sensorRamp = body;
      if (def.id === 'sensor-gate-a') this.sensorGateA = body;
      if (def.id === 'sensor-gate-b') this.sensorGateB = body;
    });

    World.add(this.engine.world, [
      ...walls,
      this.ball,
      this.leftFlipper,
      this.rightFlipper,
      this.plunger,
      ...this.bumpers,
      ...this.targets,
      ...this.rollovers,
      ...this.slings,
      ...this.kickers,
      this.spinner,
      this.sensorOrbit,
      this.sensorRamp,
      this.sensorGateA,
      this.sensorGateB,
    ]);
  }

  private applyMissionReward(reward: MissionDefinition['reward']) {
    if (reward.scoreBonus) this.score.score += reward.scoreBonus * this.score.multiplier;
    if (reward.multiplierBoost) this.score.multiplier = Math.min(8, this.score.multiplier + reward.multiplierBoost);
    const now = performance.now();
    if (reward.ballSaveMs) this.ballSaveUntil = Math.max(this.ballSaveUntil, now + reward.ballSaveMs);
    if (reward.jackpotMs) this.jackpotUntil = Math.max(this.jackpotUntil, now + reward.jackpotMs);
    if (reward.extraBall) this.state.ballsLeft = Math.min(5, this.state.ballsLeft + reward.extraBall);
  }

  private missionEvent(event: Parameters<typeof registerMissionEvent>[1], now: number) {
    const result = registerMissionEvent(this.mission, event, now);
    this.mission = result.state;
    if (result.completedMission) {
      this.applyMissionReward(result.completedMission.reward);
      this.popupText = `${result.completedMission.title} COMPLETE!`;
      this.popupUntil = now + 1500;
    }
  }

  private attachCollisions() {
    Events.on(this.engine, 'collisionStart', (event) => {
      this.collisionsThisSecond += event.pairs.length;
      const now = performance.now();
      for (const pair of event.pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (!labels.includes('ball')) continue;

        if (labels.some((l) => l.startsWith('bumper-'))) {
          this.score = registerHit(this.score, SCORE.bumper, now);
          if (this.settings.shakeOn) this.shakeFrames = 4;
        }

        if (labels.includes('sling-left')) {
          this.score = registerHit(this.score, SCORE.sling, now);
          this.missionEvent('sling_left', now);
        }
        if (labels.includes('sling-right')) {
          this.score = registerHit(this.score, SCORE.sling, now);
          this.missionEvent('sling_right', now);
        }

        if (labels.includes('sensor-orbit')) {
          this.missionEvent('orbit_pass', now);
          this.score = registerHit(this.score, 120, now);
        }

        if (labels.includes('sensor-ramp')) {
          Body.setPosition(this.ball, { x: 120, y: 160 });
          Body.setVelocity(this.ball, { x: 7.2, y: 4.2 });
          this.popupText = 'RAMP RETURN';
          this.popupUntil = now + 900;
        }

        if (labels.includes('spinner-main') && now > this.spinnerCooldownUntil) {
          this.spinnerCooldownUntil = now + 60;
          this.missionEvent('spinner_tick', now);
          this.score = registerHit(this.score, 18, now);
        }

        const target = labels.find((l) => l.startsWith('target-'));
        if (target) {
          const targetId = this.targets.findIndex((b) => b.label === target);
          this.score = registerTarget(this.score, targetId, this.targets.length, SCORE.target, SCORE.missionBonus, now);
          if (target.startsWith('target-c')) this.missionEvent('center_target_hit', now);
          if (target.startsWith('target-r')) {
            const id = Number(target.replace('target-r', ''));
            this.litRightTargets.add(id);
            if (this.litRightTargets.size === 3) {
              this.missionEvent('right_target_group_complete', now);
              this.litRightTargets.clear();
            }
          }
        }

        const rollover = labels.find((l) => l.startsWith('rollover-'));
        if (rollover) {
          const idx = Number(rollover.replace('rollover-', ''));
          this.litRollovers.add(idx);
          this.missionEvent('upper_lane', now);
          if (this.litRollovers.size === this.rollovers.length) {
            this.missionEvent('rollover_cycle', now);
            this.score = registerHit(this.score, SCORE.missionBonus, now);
            this.litRollovers.clear();
          }
        }

        if (labels.includes('kicker-alpha') && now > this.kickerCooldownUntil) {
          this.kickerCooldownUntil = now + 900;
          this.missionEvent('kicker_alpha', now);
          this.score = registerHit(this.score, SCORE.target + 180, now);
          setTimeout(() => Body.applyForce(this.ball, this.ball.position, KICK_FORCE_ALPHA), 120);
        }
        if (labels.includes('kicker-beta') && now > this.kickerCooldownUntil) {
          this.kickerCooldownUntil = now + 900;
          this.missionEvent('kicker_beta', now);
          this.score = registerHit(this.score, SCORE.target + 180, now);
          setTimeout(() => Body.applyForce(this.ball, this.ball.position, KICK_FORCE_BETA), 120);
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
      if (code === 'Space') this.launchHeld = true;
      if (code === 'KeyP') this.state = togglePause(this.state);
      if (code === 'KeyR' && confirm('Restart game?')) this.reset();
    };

    const onUp = (code: string) => {
      if (code === 'ArrowLeft' || code === 'KeyA') {
        this.leftPressed = false;
        this.leftKickUsed = false;
      }
      if (code === 'ArrowRight' || code === 'KeyL') {
        this.rightPressed = false;
        this.rightKickUsed = false;
      }
      if (code === 'Space' && this.launchHeld) {
        this.launchHeld = false;
        this.fire();
      }
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') e.preventDefault();
      onDown(e.code);
    });
    window.addEventListener('keyup', (e) => onUp(e.code));

    this.canvas.addEventListener('pointerdown', (event) => {
      const x = event.offsetX;
      if (event.offsetY > 760) this.mobileLaunch = performance.now();
      else if (x < this.canvas.width / 2) this.leftPressed = true;
      else this.rightPressed = true;
    });

    this.canvas.addEventListener('pointerup', (event) => {
      if (event.offsetY > 760) {
        this.launchCharge = Math.min(1, (performance.now() - this.mobileLaunch) / 900);
        this.fire();
      }
      this.leftPressed = false;
      this.rightPressed = false;
      this.leftKickUsed = false;
      this.rightKickUsed = false;
    });
  }

  private resetBall() {
    Body.setPosition(this.ball, { x: 500, y: 744 });
    Body.setVelocity(this.ball, { x: 0, y: 0 });
    Body.setAngularVelocity(this.ball, 0);
    this.launchCharge = 0;
    this.launchHeld = false;
    Body.setPosition(this.plunger, { x: 500, y: 784 });
  }

  private fire() {
    if (this.state.phase !== 'ready' && this.state.phase !== 'next_ball') return;
    this.state = startGame(this.state);
    if (this.ball.position.x <= 478) this.resetBall();
    const force = Math.max(0.02, this.launchCharge * BOARD.launchMaxForce);
    Body.applyForce(this.ball, this.ball.position, { x: 0, y: -force });
    this.ballSaveUntil = performance.now() + 7000;
    this.launchCharge = 0;
    Body.setPosition(this.plunger, { x: 500, y: 784 });
  }

  private pulseFlippers() {
    Body.setAngle(this.leftFlipper, this.leftPressed ? -0.88 : -0.18);
    Body.setAngle(this.rightFlipper, this.rightPressed ? 0.88 : 0.18);

    const nearLeft = Matter.Vector.magnitude(Matter.Vector.sub(this.ball.position, this.leftFlipper.position)) < 88;
    const nearRight = Matter.Vector.magnitude(Matter.Vector.sub(this.ball.position, this.rightFlipper.position)) < 88;

    if (this.leftPressed && nearLeft && !this.leftKickUsed) {
      Body.applyForce(this.ball, this.ball.position, { x: -0.012, y: -0.025 - BOARD.flipperPower * 0.01 });
      this.leftKickUsed = true;
    }
    if (!this.leftPressed) this.leftKickUsed = false;

    if (this.rightPressed && nearRight && !this.rightKickUsed) {
      Body.applyForce(this.ball, this.ball.position, { x: 0.012, y: -0.025 - BOARD.flipperPower * 0.01 });
      this.rightKickUsed = true;
    }
    if (!this.rightPressed) this.rightKickUsed = false;
  }

  private antiStuck(now: number) {
    const speed = Matter.Vector.magnitude(this.ball.velocity);
    if (speed < 0.15 && now % 7 < 1) Body.applyForce(this.ball, this.ball.position, { x: (Math.random() - 0.5) * 0.0014, y: -0.0018 });
  }

  private tick() {
    if (this.state.phase === 'paused' || this.state.phase === 'game_over') return;
    const now = performance.now();

    if (this.launchHeld) {
      this.launchCharge = Math.min(1, this.launchCharge + 0.026);
      Body.setPosition(this.plunger, { x: 500, y: 784 + this.launchCharge * 28 });
    }

    this.pulseFlippers();
    for (let i = 0; i < BOARD.substeps; i += 1) Engine.update(this.engine, 1000 / 60 / BOARD.substeps);

    const speed = Matter.Vector.magnitude(this.ball.velocity);
    if (speed > BOARD.maxSpeed) {
      const factor = BOARD.maxSpeed / speed;
      Body.setVelocity(this.ball, { x: this.ball.velocity.x * factor, y: this.ball.velocity.y * factor });
    }

    this.antiStuck(now);

    if (this.ball.position.y > BOARD.height + 22) {
      if (now < this.ballSaveUntil) {
        this.popupText = 'BALL SAVE';
        this.popupUntil = now + 1200;
        this.resetBall();
        return;
      }
      this.state = loseBall(this.state);
      if (this.state.phase === 'game_over') return;
      this.state = nextBall(this.state);
      this.resetBall();
    }
  }

  private render = () => {
    this.tick();

    this.trail.unshift({ x: this.ball.position.x, y: this.ball.position.y });
    this.trail = this.trail.slice(0, this.settings.lowFx ? 4 : 10);

    this.ctx.save();
    if (this.settings.shakeOn && this.shakeFrames > 0) {
      this.ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
      this.shakeFrames -= 1;
    }

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const items = [
      ...this.bumpers.map((body, index) => ({ id: `bumper-${index}`, type: 'bumper' as const, body, z: 2, lightState: 1 })),
      ...this.targets.map((body) => ({
        id: body.label,
        type: 'target' as const,
        body,
        z: 3,
        lightState: body.label.startsWith('target-r') ? Number(this.litRightTargets.has(Number(body.label.replace('target-r', '')))) : 0,
      })),
      ...this.rollovers.map((body, index) => ({ id: body.label, type: 'rollover' as const, body, z: 4, lightState: Number(this.litRollovers.has(index)) })),
      ...this.kickers.map((body) => ({ id: body.label, type: 'kicker' as const, body, z: 4, lightState: 1 })),
      { id: this.spinner.label, type: 'spinner' as const, body: this.spinner, z: 4, lightState: 1 },
      ...this.slings.map((body) => ({ id: body.label, type: 'sling' as const, body, z: 5, lightState: 1 })),
      { id: this.leftFlipper.label, type: 'flipper' as const, body: this.leftFlipper, z: 6, lightState: Number(this.leftPressed) },
      { id: this.rightFlipper.label, type: 'flipper' as const, body: this.rightFlipper, z: 6, lightState: Number(this.rightPressed) },
      { id: this.plunger.label, type: 'plunger' as const, body: this.plunger, z: 6, lightState: 0 },
      { id: this.ball.label, type: 'ball' as const, body: this.ball, z: 8, lightState: 1 },
    ];

    drawTable({
      ctx: this.ctx,
      width: BOARD.width,
      height: BOARD.height,
      lowFx: this.settings.lowFx,
      trail: this.trail,
      items,
    });

    const speed = Matter.Vector.magnitude(this.ball.velocity);
    if (performance.now() < this.jackpotUntil) {
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.fillText('JACKPOT ACTIVE', 194, 798);
      this.score.score += 1;
    }

    const currentMission = getCurrentMission(this.mission);
    this.latestSnapshot = {
      score: this.score.score,
      multiplier: this.score.multiplier,
      ballsLeft: this.state.ballsLeft,
      highScore: this.highScore,
      phase: this.state.phase,
      debug: `FPS:${this.fps} SPEED:${speed.toFixed(2)} HIT/s:${this.collisionsThisSecond} STEP:${BOARD.substeps} M:${this.mission.index + 1}/8`,
      missionTitle: currentMission?.title ?? 'ALL MISSIONS CLEAR',
      missionDescription: currentMission?.description ?? 'ボーナスラウンド',
      missionProgress: currentMission ? `${this.mission.progress}/${currentMission.target}` : 'COMPLETE',
      nextMissions: getNextMissions(this.mission).map((m) => m.title),
      leftActive: this.leftPressed,
      rightActive: this.rightPressed,
    };

    this.ctx.fillStyle = '#e2e8f0';
    this.ctx.font = '20px Inter, sans-serif';
    this.ctx.fillText(`SCORE ${this.latestSnapshot.score}`, 20, 34);
    this.ctx.fillText(`x${this.latestSnapshot.multiplier}`, 20, 62);
    this.ctx.fillText(`BALL ${this.latestSnapshot.ballsLeft}`, 20, 90);
    this.ctx.fillText(`HI ${this.latestSnapshot.highScore}`, 20, 118);

    this.ctx.font = '14px Inter, sans-serif';
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.fillText('A/← 左  L/→ 右  Space 長押し発射  P Pause  R Restart', 16, 824);
    this.ctx.fillText(`PHASE ${this.latestSnapshot.phase.toUpperCase()}`, 338, 34);

    if (performance.now() < this.popupUntil) {
      this.ctx.fillStyle = '#a78bfa';
      this.ctx.font = '18px Inter, sans-serif';
      this.ctx.fillText(this.popupText, 170, 760);
    }

    if (this.settings.debugOn) this.ctx.fillText(this.latestSnapshot.debug, 18, 146);
    this.ctx.restore();

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
    saveSettings({ get: (k) => localStorage.getItem(k), set: (k, v) => localStorage.setItem(k, v) }, this.settings);
  }

  public reset() {
    this.state = restartGame();
    this.score = createScoreState();
    this.mission = createMissionState();
    this.litRollovers.clear();
    this.litRightTargets.clear();
    this.ballSaveUntil = 0;
    this.jackpotUntil = 0;
    this.resetBall();
  }

  public getSettings() {
    return this.settings ?? defaultSettings;
  }

  public getSnapshot() {
    return this.latestSnapshot;
  }
}
