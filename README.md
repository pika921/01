# Neon Orbit Pinball (Vite + TypeScript + Canvas2D + Matter.js)

高密度の宇宙テーマ2Dピンボールです。検証は **GitHub Actions + GitHub Pages** で完結します。

## CI / CD

### PR CI（必須）

`pull_request` で以下を実行:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npx playwright install --with-deps chromium`
5. `npm run e2e`

Playwrightレポートは `playwright-report` としてArtifactsへアップロード。

### Pages Deploy（必須）

`push main` / `workflow_dispatch` で:

1. `npm ci`
2. `npm run build`
3. `upload-pages-artifact`
4. `deploy-pages`

`VITE_BASE_PATH` は Actions で `/$REPO_NAME/` を注入して Pages 配下でも崩れない構成。

## ブラウザ確認手順

1. PRを開く
2. Checks の CI 成功を確認
3. Artifacts の `playwright-report` を開く
4. `main` へマージ
5. Deploy Pages の `page_url` からプレイ

## 操作

- 左フリッパー: `A` / `←`
- 右フリッパー: `L` / `→`
- プランジャー: `Space` 長押し→離す
- ポーズ: `P`
- リスタート: `R`（確認あり）
- モバイル: 左右タップでフリッパー、下部長押しでプランジャー

## 全面改訂ポイント

- **描画層と物理層を分離**
  - 物理: `src/game/pinball.ts`
  - 描画: `src/game/renderer.ts`
- **盤面レイアウト設定化**
  - `src/game/tableLayout.ts` に正規化座標(0-1)で要素定義
- **高密度テーブル要素**
  - バンパー 6
  - スリング 2
  - ターゲット 12（3グループ）
  - ロールオーバー 6
  - ゲート 2
  - キッカー 2
  - スピナー 1
  - オービット/ランプ戻りセンサー

## ルール

- 残機 3
- 倍率（コンボで上昇）
- ボールセーブ（開始時＋報酬）
- ジャックポット（ミッション報酬で短時間有効）
- ハイスコア/設定は localStorage 保存

## ミッション（8個）

1. ORBIT SETUP（オービット3回）
2. TARGET SWEEP A（右ターゲット群2セット）
3. TARGET SWEEP B（中央連続4回）
4. LANE CHARGE（上部レーン5回）
5. SPINNER RUSH（スピナー60カウント）
6. BUMPER HEAT（左右スリング往復8回）
7. KICKER DELIVERY（αキッカー2回）
8. JACKPOT BUILD（βキッカー2回）

右パネルに **現在ミッション + 次候補2件** を表示。

## デバッグ

`debug` ON で表示:

- FPS
- ボール速度
- 直近1秒衝突回数
- サブステップ数
- ミッション進行番号

## 安定化（観測→仮説→変更→結果）

1. 高速時壁抜け気味
   - 仮説: 速度と積分粒度
   - 変更: 固定Δt + `substeps=2`, `maxSpeed=23`
   - 結果: 貫通再現率低下
2. フリッパー周辺滞留
   - 仮説: 低速で脱出力不足
   - 変更: anti-stuck 微小押し出し
   - 結果: 微振動ループ減少
3. 角加速
   - 仮説: 衝突後速度クランプ不足
   - 変更: 毎tick速度クランプ + ゲート補正
   - 結果: 無限加速抑制

## M4 バグ票 / 回帰

1. 発射後に球が噛むことがある → シューターレーン外なら再配置して発射
2. 右ターゲット進行が見えづらい → 右群点灯状態を可視化
3. ミッション進行が詰まりやすい → 次候補2件表示で誘導

回帰: `test/mission.test.ts` を追加。

## テスト

- Unit
  - `test/state.test.ts`
  - `test/score.test.ts`
  - `test/storage.test.ts`
  - `test/mission.test.ts`
- E2E
  - `e2e/game.spec.ts`（起動→発射→スコア増加→フリッパー反応→リスタート）

## 素材・権利

- 本作の描画・文言はオリジナル
- 外部IPの固有素材コピーは不使用

## スクリプト

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm test`
- `npm run e2e`
