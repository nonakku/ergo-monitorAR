# 再実行できる検証（2026-10-13 JST）

元のアプリ・計算を変更せず、本ディレクトリだけに依存関係と検証を置く。`results.json` は直近の実行結果、`inventory.json` はASTによる宣言・関数・本体由来のTable A/B/C fixtureである。日時は実行時に更新される。`history/20261013-initial-*.json` は追加監査前の結果/AST一覧を保持する生成物で、現行ASTの対象外とする。README/JSON/appendix-support.mdも文書・生成物であり、実行する支援コードはinventory.cjsとverify.cjsの2本である。

## 実行

Node.js 18以降（実行確認: 24.19.0）、Python 3（実行確認: 3.12.14）が必要。依存はAcorn **8.15.0**、Playwright **1.62.1**に固定し、package-lock.jsonで取得元・integrityを保存する。アプリルートにnpm依存は追加しない。

```sh
cd <repository>/docs/verification
npm ci --ignore-scripts --no-audit --no-fund --cache /tmp/ergomonitor-npm-cache
npx playwright install chromium
npm test
npm run inventory
```

Windowsではnpm cacheのパスを通常の書き込み可能なディレクトリに変更し、必要ならPowerShellで `$env:PYTHON='python'` を設定する。LinuxでブラウザのOS共有ライブラリが不足する場合、Playwrightの公式 `npx playwright install --with-deps chromium` はOSパッケージのインストール権限を持つ環境で実行する。macOS/Windowsの実機動作は今回未実施。

既存のChromiumを使う場合（今回の確認コマンド）:

```sh
CHROMIUM_PATH=/usr/bin/chromium CHROMIUM_NO_SANDBOX=1 npm test
```

`CHROMIUM_PATH` 未設定時はPlaywright管理のChromiumを使う。`CHROMIUM_NO_SANDBOX=1` はsandboxの使えない隔離コンテナ用の明示オプションで、通常のホストでは設定しない。これはChromiumのプロセス隔離を弱めるフラグであり、アプリの設定・カメラ権限設定ではない。`PYTHON` はPython実行ファイル名またはパスを指定する。

Python標準 `http.server` を `127.0.0.1:0` で起動し、OSの割り当てた空きポートを読み取る。検証後は自分が起動したserver PIDとブラウザだけを終了する。既存の8000番等のserverを止めない。serverは永続サービスとして残さない。npm cacheの初回既定パスがこの環境では作成できなかったため、上記の書き込み可能なcacheへ変更してインストールを成功させた。

## 検証と結果の読み方

9検証群で、体幹15/30/45°・膝120/150°の直前/一致、下限/上限、丸めと判定の違い、体幹表示20/40°と描画色20/40°の違い、正規化座標と640×480画素座標の角度差、同一点・NaN・Infinityを確認する。値は実装をそのまま期待値生成に使わず、境界ごとの明示値で判定する。

実Chromiumでは模擬カメラと実MediaPipe/WASMを使い、各起動で3回以上の結果callback、停止したtrackのended状態、srcObject解除、UI初期化、再開、鏡像のCSSとlocalStorage保存、390px表示、説明リンク、ワークシート既定値1・最大加算13/13・最終7・3か所のhighlightを確認する。短配列のTypeError、欠損時に前表示が残る状態、NaN座標で危険/0/NaN°になる状態、不正selectでTypeErrorになる状態も現状仕様の観測として保存する。visibility=0.5では骨格線が描かれず腰マーカーだけが描かれることをstroke回数で確認する。

Table Cは本体のAST配列を全56セルfixtureとして取得する。56組の最終行列状態は筋肉使用selectに検証用のoptionを注入し、加算→添字→最終score→highlightの接続を確認する。これは通常UIで選べる値の試験ではなく、経路の試験である。本体とfixtureの一致だけではRULA標準表の正しさは証明しない。既定1・最大7・加算13・行8/列7へのclamp・3highlightは独立した期待状態として検証する。公式RULAとの照合は別の根拠資料を参照する。

カメラ権限拒否とカメラ不存在は `getUserMedia` のPromise拒否を注入する。実OSダイアログは未確認。同梱camera_utilsが出すalertを `dialogs` に記録してdismissし、アプリ画面内の説明文への遷移を確認する。アプリ独自コードのalert不使用からvendor alert不存在を推論しない。

全アプリHTML/CSS/JS・MediaPipe同梱全資産・同梱fontをHTTP 200に加えてarrayBufferで受け取った本文とディスク本文の全byte一致で確認する。画面の説明リンクを実クリックし、popupを待機し、説明タブの戻るリンクを実クリックして主画面title/URLへの遷移を確認する。正常な人工姿勢ではscore0/45°/180°/危険に加え、ゲージ100%と負荷/score/ゲージのdanger classを確認する。ブラウザで自動発生した同一origin外requestを `externalRequests` に記録する。外部リンクをクリックした場合の通信や、将来の全操作の通信不存在を保証しない。HTTP検証はPython serverによるもので、Windowsのserve.ps1/HttpListenerは未実行。

`assertionStatus` がpassedでも `applicationExceptionFree` がfalseなら無例外の稼働は確認できていない。既知エラーのassertion成功と未捕捉pageErrorsを分離する。exit code 1はassertionまたは準備失敗、0はassertion成功を意味する。直近結果を読む際は双方を見る。`sourceHashes` と `appFilesUnchanged` は5本のアプリ本文が実行前後で同じことを示す。臨床妥当性、実人体、実カメラ機種、長時間連続運転、性能、Safari/Firefox、各OS実機は未確認。

## ASTと支援コードの設計注釈

`inventory.cjs` の `inventory()` は2本のアプリソースと2本の検証ソースを読む。変数・仮引数・catch束縛をrows、匿名callbackを含む関数をfunctionsに保存する。関数宣言名はfunctions側で数え、変数行と二重計数しない。元コードの122束縛/20関数を毎回照合する。HTML scriptの先頭行補正、配列/オブジェクト分割代入・rest・default引数に対応する。initと関数sourceは省略しない。usageLinesは宣言環境の構築後にlexical bindingを解決し、varのfunction scope、let/constのblock/for scope、catch/parameter、closure、shadowingを区別する。宣言Identifierと非computed propertyキーは除外し、object shorthandのvalueは参照扱いする。eval/withによる動的名前解決、module import、class scopeは対象ソースにないため未対応。CSS custom propertyやPowerShell変数、依存vendorのminifiedソース、JSON・READMEはこのJavaScript ASTの対象外。

`bind()` は宣言パターンを再帰展開、`walk()` はASTを巡回する。`declare()` はlexical環境に宣言を登録し、`lexical()` は環境と参照を収集する。`hashes()` は5アプリファイルをSHA-256にする。`check()` は検証群の成功/失敗を捕捉して残りの独立群へ進める。`main()` はAST→VM計算→server→HTTP→ブラウザの順に実行し、finallyで終了する。その他の匿名関数はAST/配列変換、DOM模擬要素、Promise起動/終了、ブラウザイベント、各検証群、ブラウザ内注入処理で、引数と実処理の全文をinventoryに保存する。

全支援識別子の意味・型は次のグループに対応する。同じ名前の別scopeはinventoryのfile/line/scopeで区別する。constは再代入しないがarray/objectは追記される。initはinventoryの全文が優先する。

| 識別子 | 意味・型・範囲・更新 |
| --- | --- |
| fs, path, acorn, assert, vm, crypto, spawn, chromium, inventory | Node/依存module objectまたはimportされたfunction。実行中に再代入しない。 |
| root, file, raw, scripts, m, code, offset, category, ast | 絶対repoパスstring、対象相対path string、UTF-8全文string、抽出script object[]、正規表現match array、script本文string、0以上の行補正integer、application/verification string、Acorn AST object。file/scriptのループごとに生成。 |
| rows, functions, tables | 宣言record[]、関数record[]、3つの数値配列を持つobject。AST巡回で追記。 |
| references, declared, env, parent, target, field | 未解決参照record[]、宣言nodeのWeakSet、lexical環境objectまたはnull、親AST nodeまたは環境、名前探索先の環境objectまたはnull、AST field名string。環境はbindings Map/parent/functionScopeを持ち、巡回と解決で更新。 |
| n, kind, scope, init, x, name, key, value, row | 再帰対象AST node、variable/parameter/catch string、scope説明string、初期化AST nodeまたはundefined、callback対象（node/record/DOMなど呼出箇所依存）、識別子string、object key string、対応value unknown、宣言record object。n/scopeは再帰ごと、x等はcallbackごと。 |
| result, appFiles, before, action, error, data | 実行結果またはAST結果object、5path string[]、SHA-256 map object、検証function、捕捉Error object、inventory結果object。resultは検証進行で追記、beforeは固定。 |
| element, context, t, k, expected | 模擬DOM生成function、VM ContextまたはPlaywright BrowserContext、体幹角degree number、膝角degree number、0..100期待負荷number。境界caseごとに更新。 |
| server, browser, base, resolve, reject, timer, chunk, port, text, child | 自分のChildProcess、Browserまたはundefined、loopback origin string、Promise決着function、timeout handle、stdout Buffer、port正規表現match arrayまたはnull、Python version収集string、自分のversion確認ChildProcess。server以外の既存PIDには触れない。 |
| args, page, stage, request, response, dialog | Chromium flag string[]、Page、試験段階string、Playwright Request/Response/Dialog。argsはsandbox option時追加、stageはcycleで更新、イベント引数はそのイベントのobject。 |
| original, r, cycle | 元onResults function、MediaPipe result object、1または2の起動cycle number。counterラッパーはoriginalを呼ぶ。 |
| points, valid, retained, missingRetained, shortError, invalid | 33個の検証landmark object[]、正常UI object、欠損前後のscore string、短配列exception名stringまたはundefined、不正UI object。pointsに角度/NaN/visibilityを注入。 |
| colors, strokes, originalStroke, strokeCount, angle | 描画CSS色string[]、stroke回数integer[]、元ctx.stroke function、0以上のstroke回数integer、20/20.001/40/40.001 degree number。ctx.strokeはfinallyで復元。 |
| id, states, a, b, state, denied, q | 入力DOM ID string、Table C経路record[]、行1..8 integer、列1..7 integer、1件の経路record、拒否試験BrowserContext、拒否試験Page。recordはscore1..7/highlight boolean/count integerを持つ。 |
| popupPromise, popup | 説明リンクの別タブを待つPromise<Page>と開いたPage。title/URLと戻るクリックを確認後finallyでcloseする。HTTP群のresponseはブラウザeventのResponseとは別のFetch Responseで、status/bodyを200/ディスク全byteに照合する。 |

ブラウザ内の `window.testCallbacks` は0以上のcallback数、`window.testTracks` は起動時のMediaStreamTrack[]で、検証終了時にそのpageとともに破棄する。アプリソースへの永続変更ではない。
