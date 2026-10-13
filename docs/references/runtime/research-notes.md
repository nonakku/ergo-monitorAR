# 実行基盤の調査メモと本文に必要な説明

対象コミット `1214b9bf67b1b18fe3e33e7a3b4eeab3981ef880`。確認日2026-10-13 JST。コード確認・指定版配布物照合・公式資料確認の記録である。実行確認と原因確定は別担当の記録を参照。本メモの位置表記は対象コードの行番号であり、原稿の行番号は保存原文に対する位置。

## 1. 静的HTML/CSS/JavaScriptをHTTPで開く意味

静的配信とは、サーバーがHTML、CSS、JavaScript、WASM、モデル、フォントのファイルを応答として渡す方式である。このサーバーには姿勢推定APIがなく、映像を受け取って計算する処理もない。ブラウザーはHTMLを読みながら画面の要素をDOMとして作り、CSSで配置と見た目を決め、JavaScriptを実行する。DOMは画面を構成する要素の、プログラムから参照できる表現である。例えば `id="score"` のspanをHTMLに置き、JSがその要素の `textContent` を `50` へ変えると、既存の枠の文字が更新される。HTML全体をサーバーで再生成する要求は発生しない。

`index.html:121–124` のscriptは通常のclassic scriptで、`async`/`defer`/`type="module"`を持たない。ブラウザーはその位置で読み、実行してからHTML解析を進める。この実装では表示要素を先に作り、body末尾でCamera Utils→Pose→アプリの順に実行するので、`script.js:2–44` のDOM取得と `Camera`/`Pose` の参照が成立する。`async` を付けると取得完了順で実行され、依存順は保証されない。headへ単純移動するとDOM生成前にgetElementByIdがnullを返す可能性がある。新しい読込方式にするなら、DOM準備とライブラリ準備の両方を明示的に保証する必要がある。

HTML IDだけ変えればJSがnullを得る。状態のclass名だけ変えればJSは古いclassを出して色が変わらない。CSSの表示寸法を変えても、`video.videoWidth` や推論入力の映像寸法を直接変えることにはならない。CSSの `transform:scaleX(-1)` は表示上の反転で、受け取るランドマークや計算式の符号を変更しない。JSが動かない症状ではカメラ許可だけを見ず、NetworkのJS応答、Consoleの構文/参照エラー、script順とDOM IDを先に確認する。

根拠: `index.html:15–18,43–44,121–124`、`script.js:2–44,150–162,362–363`、`style.css:134–152`、[script原稿](mdn-script.md):145、[DOM原稿](mdn-dom-introduction.md)、[イベント登録原稿](mdn-events.md)。

## 2. イベントとPromiseは「開始関数の中で全部終わる」仕組みではない

クリックは `addEventListener` で登録済みの `startCamera` を呼ぶ。普通の同期コードは一つの実行区間を終えるまで進む。一方、`await` はそのasync関数の続きだけを一旦待機させ、Promiseが成功すれば後続を再開し、失敗すればそのawait位置へ例外として戻す。待機中もブラウザーは他のイベントを処理できる。Promiseは将来の成功/失敗を表す値であって、戻り値だけで新しいスレッドやWorkerの生成を意味しない。重い同期処理があれば、asyncと書いてもその実行区間中の操作は滞り得る。アプリ自身はWorkerを生成しない。

この実装には最低三つの完了境界がある。

1. `await camera.start()` はgetUserMediaが成功し、MediaStreamをvideo.srcObjectへ代入した後に解決する。
2. 映像のメタデータ読込イベントが後から `video.play()` とrequestAnimationFrameの予約を行う。play自身もPromiseを返すが、採用Camera Utilsは待たず、rejectのcatchも置かない。
3. requestAnimationFrameで呼ばれたonFrameが `await pose.send()` を行う。初回はここでライブラリ・グラフ・モデル等を初期化する。結果はonResultsコールバックへ届く。

したがって「カメラ起動中」への表示変更は1の完了であり、再生、初回モデル読込、人体検出、点数表示の完了を保証しない。1が終わった後の2や3の失敗は、元のstartCamera内のtry/catchへ自動的には戻らない。モデルのfetch失敗を、カメラ許可失敗のUIへ必ずまとめる実装にはなっていない。`startCamera` にcatchがあるという事実と、全非同期処理のcatchがあるという主張を分ける。

根拠: `script.js:278–314`、`camera_utils.js:21–22` の `.then(function(f){O(a,f)})`、`O` と `Q`、`pose.js:78–83`、[async原稿](mdn-async-function.md)、[実行モデル原稿](mdn-execution-model.md):149–181、[play原稿](mdn-play.md):13–17,31–32,60–73。ライブラリの契約は [指定版Camera型](npm-camera-utils-index.d.ts):10–14,21–23 と [指定版Pose型](npm-pose-index.d.ts):174,187–191,207–232で確認できる。

## 3. カメラからvideoまでと、フレーム通知の条件

getUserMediaは条件に合う入力の使用許可を求め、成功時にMediaStreamを返す。MediaStreamは映像そのものをHTTP送信する仕組みではなく、ここでは映像トラックをvideoの再生元へ渡すためのオブジェクトである。採用版は `video:{facingMode:'user',width:640,height:480}` を要求し、audioは要求しない。640×480はexact指定ではないので取得寸法の保証にはならない。videoの固有寸法はメタデータから `video.videoWidth/videoHeight` で分かり、metadata未読込時には0であり得る。

安全なコンテキストとOS/サイトの許可が必要である。ローカル起動のlocalhost/loopbackと、他PCからの通常HTTPは同じ条件とは限らない。利用者が許可ダイアログへ答えない場合、getUserMediaのPromiseは成功にも失敗にもならないことがある。採用アプリに起動タイムアウトと起動中キャンセルはないので、「起動中...」が続く事実だけでモデルが壊れているとは判断できない。拒否、未接続、OSレベルで利用できない状態は異なる例外だが、アプリのUIはNotFound系以外を許可案内へまとめる。Consoleにある実際の例外名を確認する。

requestAnimationFrameは次の画面描画に向けた一回のコールバック予約で、固定FPSのカメラ撮影設定ではない。採用 `Q` はvideoがpause中、またはcurrentTimeが前回値と同じならonFrameを呼ばない。本アプリのonFrameはPromiseを返し、それが解決した後に次の予約を行うので、処理に時間がかかれば、その間の映像を全フレーム蓄積して後で推論する方式にはならない。reject時の再予約もcatchもないため、一回の推論失敗で更新ループが止まり得る。背景タブでrAFが休止する一般挙動も、常時測定/固定FPSを保証できない理由になる。

stopはトラックの使用を止めるが、他のタブ等が同じ機器を使っていれば機器全体が直ちに停止する保証とは異なる。このアプリの停止はCamera.stopに加えvideo.srcObjectから取った各track.stopも呼び、video.srcObjectをnullにする。映像の保存や録画処理ではない。

根拠: `camera_utils.js:20–22`、`script.js:289–297,329–333`、[getUserMedia原稿](mdn-getusermedia.md):11–19,51–92、[srcObject原稿](mdn-srcobject.md)、[videoWidth原稿](mdn-video-width.md)、[rAF原稿](mdn-raf.md)、[track.stop原稿](mdn-track-stop.md)。

## 4. Canvas 2Dの表示とPose内部のWebGLを区別する

主画面のvideoは元の映像を表示し、その上に別のcanvasをCSSで重ねる。Canvas 2Dは「画面を構成する点、線、円を指定して描く」APIで、身体の点を検出する機能ではない。例えば正規化座標 `(0.25,0.75)` は640×480の描画面で `(160,360)` 画素に変換され、moveTo/lineTo/arcへ渡される。入力が同じでも、描画可否はvisibility>0.5で判定する一方、数値計算にはvisibility条件がない。そのため、線が出ないのに点数が出る状態はあり得る。

canvasの幅/高さには、内部の描画画素数とCSS上の表示寸法という違いがある。`onResults` は結果ごとに内部のwidth/heightを映像固有寸法へ代入する。この代入は値が前回と同じでも描画バッファと2D描画状態を初期化する。よって未検出結果でもcanvasは消え、数値DOMは更新されず前回値が残る。未検出時に「何も描画処理しないので骨格も残る」とは説明しない。

Pose自身が作る内部canvasは別であり、WebGL2→WebGLの順でコンテキスト取得を試みる。send内ではHTMLVideoElementの固有寸法を読み、その画像をtexImage2Dで内部のテクスチャへ渡す。WASMはコンパイル済み処理を動かす実行基盤、WebGLは画像を扱う別のAPI、モデルは推論で使う学習済みの計算データ、グラフは処理要素の接続を定義するデータである。WASMファイルが存在すれば全機能が動く、あるいは画面のCanvas 2Dを無効にすればWebGLも不要になる、とは言えない。WebGL成功だけで物理GPUの使用・推論FPS・精度は証明されない。

根拠: `script.js:4,165–244,248–255`、`style.css:111–152`、`pose.js:72,79–80,90–91`、[Canvas原稿](mdn-canvas2d.md)、[width原稿](mdn-canvas-width.md):17、[WebGL原稿](mdn-webgl.md)、[WASM原稿](mdn-wasm.md)。

## 5. JS・WASM・モデルの実行可能な組合せを維持する

指定版Poseの `send` はPromise<void>を返し、座標を戻り値として返すAPIではない。結果はonResultsの引数で受け取る。初回sendがinitializeを呼び、JS loader、SIMD/非SIMDのWASM、処理グラフ、人物検出用data、modelComplexityに対応するランドマークモデルを読み、videoを入力にする。Camera Utilsは画像入力のタイミング担当で、姿勢推定と点数計算は担当しない。

`pose_solution_packed_assets.data` 内の人物検出モデルと `pose_landmark_full.tflite` は役割が異なる。fullだけ残しても同じ推論経路は成立しない。modelComplexity=0/2へ変えるとlite/heavyという別ファイル名を要求するため、その設定変更はモデルファイル追加を伴う。SIMD判定は小さなWASMをinstantiateして行い、対応版のJS/WASMを選択する。0バイトの `pose_solution_simd_wasm_bin.data` は指定版tarballでも同じであり、そのサイズだけで破損と扱わない。vendor更新はPose入口JSだけを置き換えず、必要資産を同じ配布版で揃え、Cameraとの接続・出力・結果計算も確認する。

採用Pose0.5.1675469404の10ファイルとCamera Utils0.3.1675466862の1ファイルは、指定版tarballのdist.integrity(SHA-512)とdist.shasum(SHA-1)を検証した後に比較し、すべてバイト一致した。型定義は起動に必要なファイルではなく、採用版契約を読む補助資料として保存した。PoseのResults型はposeLandmarks等を非optionalで書くが、実コードは出力streamがundefinedなら値を設定せず、アプリも存在確認する。型が必須表記なので常に33点が存在すると保証しない。

根拠: `pose.js:65–95`、`script.js:259–274,290–292`、[指定版型](npm-pose-index.d.ts):104–174,207–232、[配布物照合](npm-pose-verification.json)、[Camera照合](npm-camera-utils-verification.json)、[圧縮JS抜粋](bundled-runtime-excerpts.md)。既存MediaPipe公式原稿のcommitとこのnpm版のビルドcommitは同一とは確認していない。

## 6. HTTP応答、MIME、CORSを障害へ接続する

HTTPで開くと、ブラウザーはページ・CSS・JSをURLに対して要求し、サーバーは内容とstatus/Content-Typeを返す。Poseはさらに `locateFile` の戻り値でモデル等のURLを作る。現在は同じ配信ルートの相対URLなので、インターネットCDNの許可設定は通常経路に必要ない。別host/port/schemeへ資産を移すと別オリジンになり、fetchやcrossorigin指定の動的scriptは応答のCORS条件に依存する。file://でHTMLが表示できても、ファイルオリジンとfetchの条件がHTTP配信と同じとは限らない。「カメラAPIを使える安全なコンテキスト」と「モデルを読み込めるオリジン/通信条件」は別の成立条件である。

MIMEはバイト列の扱いを示す応答ヘッダーで、拡張子だけではブラウザーに正しい扱いを保証しない。PS1はwasmをapplication/wasm、モデル/data/graphをapplication/octet-stream、JSをtext/javascriptとする。採用WASM loaderはinstantiateStreamingで配信中の応答を直接コンパイルする経路を試し、その経路はapplication/wasmを要求する。ただし同梱loaderには失敗時のArrayBuffer方式へのfallbackがある。従ってMIME誤りは警告やfallbackを生み得るが、「MIMEが違えば必ずアプリ起動不能」とは断定しない。モデル等はarrayBufferで受けるため、そのContent-TypeをWASMのストリーミング必須条件と混同しない。

さらにHTTP 404はfetch Promiseを自動的にはrejectしない。Poseのgraph/model取得関数 `hd` はresponse.okを検査せずarrayBufferへ進むので、404本文やリバースプロキシのHTMLが後段のバイナリ解釈で壊れることがある。WASM loaderのArrayBuffer取得はokを検査する。動的JS挿入 `dd` もload/errorの両方でPromiseをresolveするので、JS不在が後段の関数未定義として見えることがある。診断では最後の例外名だけで「許可」や「WASM未対応」と決めず、該当URL、HTTP status、Content-Type、bodyの内容・サイズを確認する。単に200であることも誤ったHTML応答の除外にはならない。

根拠: `serve.ps1:10–24,58–72`、`script.js:260–263`、`pose.js:65,78`、WASM loader9行のinstantiateAsync/getBinaryPromise ([抜粋](bundled-runtime-excerpts.md))、[MIME原稿](mdn-mime.md):9–16、[CORS原稿](mdn-cors.md)、[オリジン原稿](mdn-origin.md):14,36、[fetch原稿](mdn-fetch.md):11–16、[WASM streaming原稿](mdn-wasm-streaming.md):58–59,91。

## 7. 停止は資源解放と画面初期化の両方を調整する必要がある

停止ボタンはCamera.stop、各track.stop、srcObject=null、Pose.close、Canvas/数値/ボタンの初期化を順に呼ぶ。Camera.stop/closeの戻り値はPromiseだが、このアプリは待たない。呼出位置のtry/catchはその場の同期throwを捕捉するもので、待たないPromiseのrejectを捕捉するものではない。Camera.stopの採用実装は内部trackを止めるがrAF予約をcancelしない。Pose.closeの採用実装は内部WASMオブジェクトdeleteを呼んで解決済みPromiseを返すが、実行中sendの終了を待つ契約は確認できない。

したがってawait closeを追加するだけで実行中推論と安全に調整できるとは言えない。変更案を設計するなら、実行中sendの完了・次フレームの受付・古い開始回のcallback・資源解放・画面初期化を一つの状態管理へ結び付ける必要がある。現在onFrameはmutableなトップレベルposeを読むため、停止/再開で古いcallbackが生きている可能性も調査対象である。これは競合を疑うコード上の材料であり、観測されたWASM例外の原因確定ではない。

サーバー停止は新しいファイル応答を止める操作で、ブラウザーに既に読み込まれたJS、映像トラック、WASM資源を同じ瞬間にcloseする指示ではない。利用手順では画面の停止とサーバー終了を区別する必要がある。

根拠: `script.js:290–292,318–358`、`camera_utils.js:20–22`、`pose.js:68,95`、[track.stop原稿](mdn-track-stop.md)。停止例外の実行観測と恒久修正の確認はこのメモでは行っていない。

## 8. PowerShell/.NETとPythonの配信動作の違い

バッチはPowerShellプロセスを起動し、PowerShellは.NETのHttpListenerオブジェクトを作る。ここで.NETはWindows上のサーバー実行基盤であって、Pose推論用WASMやブラウザーJSの実行基盤ではない。PS1自身の所在を配信ルートにし、8000から8010のURL prefixを順にStartし、成功したURLを既定ブラウザーへ渡す。GetContextは要求を待つ同期APIで、要求一件についてpath正規化、root内判定、ファイル読込、MIME設定、byte数設定、OutputStream.Write、Response.Closeを行う。存在しない/許可外pathは404、内部処理例外は500を試す。要求ごとの処理はこのwhile内で直列である。

GetContext・Start-Processは応答処理のtryの外側なので、その失敗を500応答のcatchで捕捉するとは説明しない。Startのcatchはどの原因でも次のportを試し、最終メッセージはすべて「使用中」としてしまう。メッセージだけでは権限拒否を排除できない。実行方針Bypassはプロセス側の指定で、組織のGroup Policyを必ず上書きできる保証ではない。Windowsで管理者不要というREADMEの記述は実測保証ではなく、URL予約や実行方針等の端末条件は未確認。

Pythonの `-m http.server` は別実装の同じ静的配信手段であり、カメラ処理にPythonを組み込む意味はない。配信ルートは既定で現在の作業ディレクトリ、既定bindは全インターフェースなので、7章の `cd` と `--bind 127.0.0.1` に意味がある。PS1の自動port試行やブラウザー起動は行わない。Python3.12 CLIはThreadingHTTPServerを使い、PS1と同じ直列実装ではない。MIMEを推定する仕組みもPS1の固定mapとは異なる。

HttpListenerのlocalhost Prefixesは受付対象のURL prefixの指定であり、Pythonの--bind 127.0.0.1と同じソケットbindの実証として扱わない。READMEの「外部PCからアクセス不可」をあらゆるWindowsのネットワーク設定で保証する証拠はこの調査にない。Windows未検証のままlocalhost指定・今回の未確認範囲を説明する。

根拠: `start-offline.bat:4`、`serve.ps1:6–8,29–44,47–78`、[HttpListener原稿](dotnet-HttpListener.xml):61–94、[実行方針原稿](powershell-execution-policies.md):115–142、[Python原稿](python-http-server.rst):325–329,470–492、[Python3.12ソース](python-http-server.py)のCLI/mainとThreadingHTTPServer。最新版.NET11等の追加項目をWindows標準powershellへ適用しない。

## 9. フォントは表示資産であり、数値計算の入力ではない

WOFF2はWeb配信用に圧縮したフォント形式で、@font-faceがfamily/weightとファイルを結び付ける。このCSSはIBM Plex Monoの400/600をローカルURLへ登録し、--monoを数値枠に使う。読込時にはfont-display:swapで短いblock期の後に代替フォントを使い、取得できれば登録フォントへ切り替える。フォント失敗で通常は代替書体へ移るため、映像推論やスコア式がそれによって別の計算になるわけではない。ただし幅と折返しが変わり、表示の比較には影響する。

両同梱フォントは内部版2.3、229字のUnicode cmapを持ち、日本語の「あ」はない。数字0–9のadvance widthはいずれも600で、font unitでの同幅を確認した。bodyは日本語対応のsystem-ui等を別指定する。このため、同梱Latinファイルで日本語全体を表示する、あるいはnpmパッケージ版が2.3である、と説明しない。PS1に.woff2専用MIME entryはなく、fallbackでapplication/octet-streamを返す。これがWindowsブラウザーでのフォント失敗を実証したという意味でもない。

フォントを移すときはCSSのurlがCSSファイルを基準に解決される点を考慮し、family名、weight、適用先、fallback、取得結果を確認する。字体を変えても数値の正しさのテストを増やす理由にはならず、欠け文字・幅・折返し・読込成否を検証する。

根拠: `style.css:8–21,40,49–51`、[font-face原稿](mdn-font-face.md)、[font-display原稿](mdn-font-display.md):27–47、[同梱metadata抽出](font-metadata.json)、[提供元OFL](ibm-plex-LICENSE.txt)。配布元Fontsource/npm版までは未確認。

## 10. 履歴から確認できる意図と、確認できない意図

`b5125bbee5fee59a65b288525a1b65143eae1a6d` はネット未接続動作のためのMediaPipe版固定同梱、locateFileのローカル化、外部Fonts/CDN削除、静的HTTPサーバー追加と記す。これは同梱の採用理由を裏付けるが、MediaPipeを他推定器より選んだ判断理由、数値式の人間工学的妥当性やモデル学習条件までは裏付けない。

`0a14f0f4b974e8d9fb1fcccdffa4cd20c0531c09` は離れた位置での可読性、数値用等幅フォント、自分の姿勢を見る鏡像、インラインエラーを狙いとする。ただし「alert廃止」はアプリの変更意図で、同梱Camera UtilsやPoseのalertは現在も存在する。`de23eda725605702af63a04f900d412c147d69b0` は外部カメラ等に応じて鏡像を切り替え、localStorageで次回も維持する意図を記す。後の `d6dc93b` がHUDを削除したので、過去の狙いを現在の表示箇所と取り違えない。

`de9e788f6e5569e21c013a671eb22e2c8a37edc8` は同じ接頭辞の兄弟フォルダーをroot判定で誤許可する問題を直すため区切り文字を付けたと記す。`c99c40be28d5f64fb928a8a73ac16138549702a1` は721–867pxで横並びが成立しないため、breakpointを868pxへ上げたと記す。後任は当該幅・パネル幅・gap・左右余白を一緒に見る必要がある。

根拠: `history-*.txt`、`history-path-guard.diff`。履歴メッセージには過去の実装や成功の断定も含まれるため、現在のコードと実行範囲を別に確認する。角度式/点数式やMediaPipe選定の根拠は本履歴からは確定しない。

## 改訂時に修正・限定すべき既存記述

| 既存位置・主張 | 読者が失敗する解釈 | 修正材料 |
| --- | --- | --- |
| 3.3の「メタデータ後に再生開始」、5.1の単一の流れ | await camera.startで再生と初回推論が全部終わったと考える | srcObject代入、metadataイベント、play Promise、rAF、初回sendを異なる境界として説明する |
| 3.4.3の未検出分岐、14章の残留値 | 何も更新しないので骨格も残ると思う | width/height代入でcanvasは消去、数値は残留する |
| 12章の「モデル破損等も同じ案内」 | 許可案内をモデルの読込失敗に対するcatchと考える | 同期initPose例外なら開始catch対象。通常の初回モデル読込は後のonFrameで、開始catchの範囲外 |
| 3.5/7章のMIME説明 | application/wasm以外なら必ず推論不能と思う | streaming必須条件と同梱fallbackを分ける |
| READMEの「alert廃止」「外部通信一切なし」等と仕様 | カメラ失敗時にダイアログがない、参考リンクも外部通信しないと思う | アプリalertと同梱alert、通常資産取得と利用者が開く参考リンクを分ける |
| Windows localhost・管理者不要 | 同じ条件で全Windows端末を実証済みと思う | URL prefix設定と実測を分け、権限・OS/PowerShell版は未確認とする |
| 12章の非同期stop catch説明 | tryでCamera Promiseのrejectまで捕捉できると思う | 待たないPromise rejectはcatch対象外。現在のcloseもin-flight send待機の契約なし |

実機テスト未実施、性能・精度・原因確定未実施。資料とコードから判断できる成立条件を説明し、端末別成功や停止例外の原因を作らない。
