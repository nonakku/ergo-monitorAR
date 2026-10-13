# ブラウザー実行基盤・採用版の根拠資料

2026-10-13 JSTに、仕様説明書の全面改訂に必要な仕組みを一次資料と採用コードで照合した。対象アプリはコミット `1214b9bf67b1b18fe3e33e7a3b4eeab3981ef880`。本文用の解説材料と訂正点は [調査メモ](research-notes.md) にある。ここには一般資料の原文、採用パッケージの型、取得記録、履歴の証拠を置く。アプリは変更していない。実ブラウザー・実カメラ・Windowsのテストはこの調査の対象外。

## 保存物と適用範囲

| 保存物 | 何を確認するか | 適用範囲 |
| --- | --- | --- |
| `mdn-*.md` | HTMLの読込順、DOM、イベントとPromise、videoとMediaStream、描画、HTTP/MIME/CORS、保存、Webフォントの原理 | MDN公式原稿の取得時点のスナップショット。特定のMediaPipe版の契約や、特定ブラウザーでの実測結果ではない |
| `npm-pose-*` / `npm-camera-utils-*` | npmの指定版メタデータ、配布物内package.json/index.d.ts、tarball完全性と同梱ファイルの照合 | Pose **0.5.1675469404** / Camera Utils **0.3.1675466862**。現行Tasks/PoseLandmarkerとは異なる |
| `dotnet-HttpListener.xml` | URL prefix、同期GetContext、Windows HTTP.sysの役割 | 取得原稿には.NET 11の機能もある。それらをWindows標準 `powershell.exe` の.NET Frameworkへ適用しない。Windows実行環境の版は未確認 |
| `powershell-execution-policies.md` | Bypassと実行方針の優先順位 | PowerShell **7.5** 向け説明。グループポリシー等の仕組みの補助根拠として読む。採用起動コマンドは `powershell` で、7.5を要求していない |
| `python-http-server.rst` / `python-http-server.py` | 静的ファイル配信、bind、MIME、HTTPの実装 | CPython **3.12ブランチ**の固定コミット。実機のPython 3.12.14と完全に同じソースとは証明していない |
| `font-metadata.json` / `ibm-plex-LICENSE.txt` | 同梱WOFF2のnameテーブル、数値幅、字形、提供元のOFL | フォント内部版2.3。npm/Fontsourceの配布版・配布元までは確定していない |
| `history-*.txt` / `history-path-guard.diff` / `history-records.json` | 同梱・フォント・鏡像・寸法・パス判定を変更した記録 | ローカルgitの記録。メッセージにある狙いと現状を区別し、実行成功や設計妥当性の証明にはしない |
| `saved-mediapipe-verification.json` | 既存 `../mediapipe/` の公式原稿4ファイルを既存SHA-256と再照合 | 取得日2026-10-10の原稿が保存記録と一致。原稿のコミットをnpmパッケージのビルドコミットとみなさない |
| `bundled-runtime-excerpts.md` | 圧縮されたJSのWASM読込・fallback・人物検出モデル配置を読みやすく確認 | 実コードの一部抜粋。全文はvendorにある |
| `sources.json` / `fetch_sources.py` | URL、固定コミットまたは版、取得時刻、バイト数、SHA-256。再取得処理 | tarballは完全性を検証してから必要なテキストを抽出。tarball本体は保存していない |

原文はバイト列を変えずに保存した。URL・commit・date・version・sha256は [sources.json](sources.json) を参照。npmから抽出したファイルは配布tarballのURLとarchive_memberも記録する。同梱Pose10ファイル、Camera Utils1ファイルは指定版配布物とすべてバイト一致した。検証済みの `dist.integrity` / `dist.shasum` と各ファイルのSHA-256は `npm-*-verification.json` を参照。

## コミットの固定方法と取得の制約

MDN `main`、dotnet-api-docs `main`、CPython `3.12`、IBM Plex `master`、PowerShell-Docs `main` に対して `git ls-remote <公式GitHub URL> refs/heads/<branch>` を実行してコミットを確定し、そのコミットを指定した `raw.githubusercontent.com` のURLを取得した。ブランチの最新位置は後日変わるが、保存内容と記録URLは固定される。原稿更新日・仕様の制定日と、今回の取得日は別である。

GitHub REST APIのコミット取得はこの環境のプロキシで403になったため使っていない。MDNの旧パス `web/api/document_object_model/introduction` と `web/security/same-origin_policy` は404になり、同コミットの `web/api/document_object_model` と `web/security/defenses/same-origin_policy` を取得した。この失敗は資料の移設・取得経路の制約であり、アプリの障害ではない。

原文内の画像、例の実行環境、MDNのマクロ展開、リンク先全文は保存しない。MarkdownのMDNマクロが未展開なのは保存原稿の形式である。ライセンスは `mdn-LICENSE.md`、`python-LICENSE`、`dotnet-LICENSE`、`powershell-LICENSE`、`ibm-plex-LICENSE.txt` を併置。MediaPipeは既存 `../mediapipe/LICENSE` と各パッケージのApache-2.0宣言を参照。保存した提供元LICENSEはアプリ全体のライセンス整備が完了したという意味ではない。

## 再照合

Python標準ライブラリで `python3 docs/references/runtime/fetch_sources.py` を実行すると、固定した公式原稿・指定版npmを再取得し、SHA-256・tarball完全性・vendor一致を記録する。これは資料の取得ツールであり、アプリの起動に必要なものではない。`sources.json` の `sha256` は保存原稿に対する値。`npm-*-verification.json` の `sha256` はtarball全体に対する値で、`vendor_comparison` は各同梱ファイルに対する値。
