# Pinball Lab (Vite + TypeScript + Matter.js)

ブラウザだけで検証できる 2D ピンボールです。PR では GitHub Actions の CI が自動実行され、`main` マージ後は GitHub Pages に自動デプロイされます。

## セットアップ方針

- リポジトリは Public 前提
- Secrets は追加不要（`GITHUB_TOKEN` のみ）
- Pages デプロイ時の `base` は Actions で `/$REPO_NAME/` を注入

## CI / CD

### PR の確認手順

1. PR を開く
2. **Checks** で `CI` ワークフローの完了を確認
3. Artifacts に `playwright-report` があることを確認
4. ダウンロードして `index.html` を開くと E2E 結果を閲覧可能

### Pages URL の確認手順

1. `main` にマージ
2. Actions の `Deploy Pages` を確認
3. `deploy` ジョブの `page_url` か Settings → Pages で URL を確認
4. URL を開いてプレイ

## 操作方法

### PC

- 左フリッパー: `←` or `A`
- 右フリッパー: `→` or `L`
- プランジャー: `Space` 長押し → 離す
- ポーズ: `P`
- リスタート: `R`（確認ダイアログ）

### モバイル

- 画面左半分タップ: 左フリッパー
- 画面右半分タップ: 右フリッパー
- 画面下部長押し: プランジャー

## 仕様

- 3ボール制
- 加点:
  - バンパー: 200
  - スリング: 125
  - ターゲット: 300
- 倍率:
  - 一定時間内ヒットで倍率上昇（最大 x6）
  - ターゲット 3 枚達成でボーナス + 倍率上昇
- 目標要素:
  - ターゲット 3 枚点灯コンプリートでミッションボーナス

## 設定（localStorage 保存）

- サウンド ON/OFF
- 画面揺れ ON/OFF
- 演出軽量化 ON/OFF
- デバッグ表示 ON/OFF

## デバッグオーバーレイ

ON 時に以下を表示:

- FPS
- ボール速度
- 直近 1 秒の衝突回数
- 物理ステップ回数

## 調整パラメータ一覧

`src/game/config.ts`

- gravity
- restitution
- friction
- airFriction
- flipperPower
- maxSpeed
- substeps
- launchMaxForce

## 調整ログ

- `substeps: 1 -> 2` に変更し高速時の壁抜けを軽減
- `maxSpeed: 28 -> 21` に変更し角での急加速を抑制
- `airFriction: 0.006 -> 0.011` に変更し振動時の収束を改善

## M3 バグ票と修正ログ（3件）

1. **高速壁抜け**
   - 観測: 発射直後に右壁周辺でまれに貫通
   - 仮説: ステップ粗さと速度が高すぎる
   - 変更: サブステップ 2 / 速度上限導入
   - 結果: 再現率が大幅に低下
2. **フリッパー間の微振動停止**
   - 観測: ボールが挟まり小刻みに振動
   - 仮説: 空気抵抗が低く反発収束しない
   - 変更: airFriction 上昇
   - 結果: 数フレームで離脱しやすく改善
3. **角での不自然な加速**
   - 観測: 下部角で速度が増幅
   - 仮説: 反発連鎖で速度クランプ不足
   - 変更: 毎 tick で maxSpeed クランプ
   - 結果: 無限加速を抑止

## 既知の制限

- SE は設定のみ先行実装（効果音アセットは未同梱）
- リプレイ機能は未実装

## スクリプト

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm test`
- `npm run e2e`
