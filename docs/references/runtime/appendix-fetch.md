# 取得支援コード fetch_sources.py の全束縛・全関数

確認日2026-10-13 JST。対象はこのフォルダーの `fetch_sources.py` 82行、SHA-256 `35eb08f719b4e34892045ad011adaff6ab141114917103261a4d859a3939cafc`。アプリ実行コードではなく、公式原稿の再取得・採用版照合に使う自作支援コード。

Python標準ASTで**束縛イベント60件、scope別の名前59件（変数56件と関数名3件）、関数3件**を抽出した。別の `ast.walk` で全Store/引数/import/関数/except aliasを数え、位置を含むmultisetの一致を確認した。154件のName(Load)も束縛または組込/実行環境名へ漏れなく対応付けた。意味説明のkeyも抽出scope/名前と完全一致し、説明なしの名前は0件。[機械記録](support-inventory.json)には各束縛の位置・種別・source text、全Load位置と解決先を残す。

生成JSON等、npm配布の型、MDN/.NET/Python公式原稿（`python-http-server.py`を含む）は第三者原文または生成物のため、この自作コード一覧から除外する。Python組込名と `__file__` / `__name__` はこのソースに定義されず、JSONのexternal_readsに使用行を列記した。属性名、dict key、keyword引数名は独立した変数ではない。

if/for/with/tryはPythonの新しいlexical scopeを作らないので、mainブロックのloop/一時変数もmodule scopeである。list comprehensionの `f` / `p` と、関数の同名変数、moduleの同名変数は区別する。exceptの `e` はsuite退出時に束縛が削除される。型は型注釈・runtime検査の保証ではなく、固定値と標準APIからの推定。取得する原稿の数は32件、npm2packageからmetadataと2テキストを追加した正常時の取得記録は38件。

通常の `python3 fetch_sources.py` で実行する。tarball完全性確認にassertを使うため、`python -O/-OO` で実行すると検査が省略される。フラグをTrueとして記録する処理自体は残るので、最適化modeの記録を検証済み根拠として扱わない。一般原稿のtry内失敗はerror recordになるが、npm処理の失敗、hash不一致、archive不備は未捕捉で処理を止める。処理は既存保存物を同名で上書きし、トランザクションとして巻き戻す仕組みはない。

## A. 全束縛

### module

位置と使用行はすべて `fetch_sources.py` に対する行番号。範囲はソース上の期待値であり、外部応答への実行時検査を追加したという意味ではない。

| 名前・定義行 | 型・意味・単位/基準 | 初期値・期待範囲 | 更新条件・使用行 |
| --- | --- | --- | --- |
| `base64` — 4 | module。digestをBase64文字列へ変換。単位なし | 初期: import base64。範囲: Python標準ライブラリmodule | import時だけ束縛。再代入なし。使用: 70 |
| `concurrent` — 4 | module。concurrent.futuresのThreadPoolExecutorを参照。単位なし | 初期: import concurrent.futures。ドット付きimportは先頭module名を束縛。範囲: Python標準ライブラリmodule | import時だけ束縛。再代入なし。使用: 63 |
| `datetime` — 4 | module。UTC時刻・JST日付を生成。単位なし | 初期: import datetime。範囲: Python標準ライブラリmodule | import時だけ束縛。再代入なし。使用: 52,56,67,76 |
| `hashlib` — 4 | module。SHA-1/SHA-256とintegrity指定algorithmのhashを計算。単位なし | 初期: import hashlib。範囲: Python標準ライブラリmodule | import時だけ束縛。再代入なし。使用: 59,67,70,71,72,76,79 |
| `io` — 4 | module。tarball bytesをメモリー上のBytesIOへ渡す。単位なし | 初期: import io。範囲: Python標準ライブラリmodule | import時だけ束縛。再代入なし。使用: 73 |
| `json` — 4 | module。メタデータ解析・JSON生成。単位なし | 初期: import json。範囲: Python標準ライブラリmodule | import時だけ束縛。再代入なし。使用: 66,80,81 |
| `tarfile` — 4 | module。gzip圧縮tarballを読む。単位なし | 初期: import tarfile。範囲: Python標準ライブラリmodule | import時だけ束縛。再代入なし。使用: 73 |
| `urllib` — 4 | module。urllib.request.urlopenでHTTP取得。単位なし | 初期: import urllib.request。ドット付きimportは先頭module名を束縛。範囲: Python標準ライブラリmodule | import時だけ束縛。再代入なし。使用: 49 |
| `Path` — 5 | type[pathlib.Path]。パスの構築・解決・親フォルダー参照・ファイル読み書きに使うクラス。OSのファイルパス | 初期: pathlibからimportしたPathクラス。範囲: 標準pathlib.Path | import時だけ束縛。再代入なし。使用: 6 |
| `ROOT` — 6 | pathlib.Path。この取得スクリプトの所在フォルダー。原稿と記録の保存先。絶対ファイルパス | 初期: Path(__file__).resolve().parent。範囲: 通常docs/references/runtime。別の配置ならその所在 | module読込時。再代入なし。使用: 58,66,75,77,79,80,81 |
| `MDN` — 7 | str。mdn/content の取得元を固定するgit commit ID。40桁の16進commit ID | 初期: 19370346042efad9e179fbf1f55deeeadee98c40。範囲: この固定値。ライブラリ版や資料取得日とは異なる | module読込時。変更は固定取得元を更新するとき。使用: 38 |
| `DOTNET` — 8 | str。dotnet/dotnet-api-docs の取得元を固定するgit commit ID。40桁の16進commit ID | 初期: b3f744389f83f55a54e9d9e4cad4b1fef80f5757。範囲: この固定値。ライブラリ版や資料取得日とは異なる | module読込時。変更は固定取得元を更新するとき。使用: 39,41 |
| `PYTHON` — 9 | str。python/cpython の取得元を固定するgit commit ID。40桁の16進commit ID | 初期: 58ed60b7415e218ce3d608302e39b5e55bfb0e88。範囲: この固定値。ライブラリ版や資料取得日とは異なる | module読込時。変更は固定取得元を更新するとき。使用: 42,43,44 |
| `IBM` — 10 | str。IBM/plex の取得元を固定するgit commit ID。40桁の16進commit ID | 初期: 763c36ef9117782905ae010056dfbe8fd2653a25。範囲: この固定値。ライブラリ版や資料取得日とは異なる | module読込時。変更は固定取得元を更新するとき。使用: 45 |
| `POWERSHELL` — 11 | str。MicrosoftDocs/PowerShell-Docs の取得元を固定するgit commit ID。40桁の16進commit ID | 初期: a3de8f22552170e70852470d46cd52cd9ca471ec。範囲: この固定値。ライブラリ版や資料取得日とは異なる | module読込時。変更は固定取得元を更新するとき。使用: 40,46 |
| `MDN_PATHS` — 12 | dict[str,str]。保存ファイル名とMDNリポジトリ内原稿パスの対応表。相対パス | 初期: 12–37行の固定dict、24件。範囲: 定義済みMDN原稿24件 | module読込時。実行中の更新なし。使用: 38 |
| `SOURCES` — 38 | list[tuple[str,str,str,str]]。一般公式原稿の取得一覧。各要素は保存名/repository/commit/upstream path。32件の原稿指定 | 初期: MDN24件の内包表記と他提供元8件を連結。範囲: 固定32件。npm指定版の取得はこの一覧の外 | module読込時生成。実行中の更新なし。使用: 63 |
| `get` — 48 | function。URLから応答bytes/status/Content-Typeを取得。単位なし | 初期: def getで作られる関数オブジェクト。範囲: 下記関数表参照 | module読込時の関数定義。再代入なし。使用: 58,66,68 |
| `stamp` — 51 | function。現在UTC時刻をISO形式文字列へする。単位なし | 初期: def stampで作られる関数オブジェクト。範囲: 下記関数表参照 | module読込時の関数定義。再代入なし。使用: 56,67,76 |
| `save_one` — 53 | function。一般公式原稿一件を保存して取得記録を返す。単位なし | 初期: def save_oneで作られる関数オブジェクト。範囲: 下記関数表参照 | module読込時の関数定義。再代入なし。使用: 63 |
| `pool` — 63 | concurrent.futures.ThreadPoolExecutor。一般公式原稿32件の取得を最大6workerで並列化するexecutor。worker上限6 | 初期: ThreadPoolExecutor(max_workers=6)。範囲: 固定上限6。完了順とrecordsの並びは別 | mainでwith進入時。退出時にworker完了を待ちshutdown。使用: 63 |
| `records` — 63 | list[dict[str,object]]。sources.jsonへ保存する全原稿/npm抽出物の取得記録。件数、各bytesはbyte | 初期: pool.map(save_one,SOURCES)をlist化した32件。範囲: 通常32→38件。map結果順はSOURCES順 | 63行作成、各packageのmetadataで67行append、2memberで76行append。使用: 67,76,81,82 |
| `name` — 64 | str。取得して同梱物を照合するnpm packageの末尾名。package名 | 初期: 64行tupleの各第一要素。範囲: pose、camera_utils | 64行の2反復で更新。使用: 65,72,77 |
| `version` — 64 | str。取得するnpmの固定版。npm version文字列 | 初期: 64行tupleの各第二要素。範囲: pose:0.5.1675469404、camera_utils:0.3.1675466862 | 64行の2反復で更新。使用: 65,67,72,76 |
| `prefix` — 64 | str。metadata/抽出ファイル/verificationの保存名接頭辞。ファイル名文字列 | 初期: 64行tupleの各第三要素。範囲: npm-pose、npm-camera-utils | 64行の2反復で更新。使用: 66,75,80 |
| `url` — 65 | str。指定版npm registry metadataの取得URL。HTTPS URL | 初期: 65行でname/versionを連結。範囲: https://registry.npmjs.org/@mediapipe/{name}/{version} | packageの各反復で更新。使用: 66,67 |
| `raw` — 66 | bytes。registry metadataの原文JSON。原文のまま保存する。byte列 | 初期: get(url)[0]。範囲: 成功応答の全本文。2package分を順に保持 | 66行の各package取得で更新。使用: 66,67 |
| `status` — 66 | int。registry metadata応答のHTTP status。HTTP status code | 初期: get(url)[1]。範囲: 実取得は200。67行記録へ入る | 66行の各package取得で更新。使用: 67 |
| `mime` — 66 | str \| None。registry metadataのContent-Type。取得するが記録/判定には使わない。MIME文字列 | 初期: get(url)[2]。範囲: header文字列またはNone | 66行の各package取得で更新。読出し使用なし。使用: 読出し使用なし |
| `meta` — 66 | dict[str,object]。registry JSONを解析したpackage metadata。tarball/integrity/shasumを読む。distのURL/hash文字列 | 初期: json.loads(raw)。範囲: 期待するdistキーを持つdict。コードにschema検査なし | 66行の各packageで更新。使用: 68,69,71,72,76 |
| `filename` — 66 | str。registry metadata原文の保存名。相対ファイル名 | 初期: prefix+"-metadata.json"。範囲: npm-pose-metadata.json、npm-camera-utils-metadata.json | 66行の各packageで更新。使用: 66,67 |
| `archive` — 68 | bytes。指定版package tarball全体。検証後にメモリー上で開く。byte列 | 初期: get(meta["dist"]["tarball"])[0]。範囲: gzip tar archive。tarball本体は保存しない | 68行の各packageで更新。使用: 70,71,72,73 |
| `astatus` — 68 | int。tarball応答HTTP status。取得するが後段では使わない。HTTP status code | 初期: get(tarball URL)[1]。範囲: 実取得は200 | 68行各packageで更新。読出し使用なし。使用: 読出し使用なし |
| `amime` — 68 | str \| None。tarball応答Content-Type。取得するが後段では使わない。MIME文字列 | 初期: get(tarball URL)[2]。範囲: header文字列またはNone | 68行各packageで更新。読出し使用なし。使用: 読出し使用なし |
| `alg` — 69 | str。dist.integrityのhash algorithm。hashlib.newへ渡す。hash algorithm名 | 初期: integrity.split("-",1)[0]。範囲: この指定版ではsha512。関数はmetadata値を使う | 69行各packageで更新。使用: 70 |
| `b64` — 69 | str。dist.integrityにある期待digest。archiveの計算値と比較する。Base64 digest文字列 | 初期: integrity.split("-",1)[1]。範囲: metadataの期待SHA-512 digest | 69行各packageで更新。使用: 70 |
| `dist` — 72 | dict[str,object]。package版・tarball hash・完全性結果・vendor比較一覧を保存する。byte数、SHA-256 hex、boolean | 初期: 72行dict。通常実行の直前assert成功後にverified=True。範囲: 通常vendor比較はpose10件/camera_utils1件。globで得た全entryを処理 | 72行作成、79行vendor_comparisonをappend。使用: 79,80 |
| `tf` — 73 | tarfile.TarFile。検証済みtarballを読むarchive handle。gzip tar member | 初期: tarfile.open(fileobj=io.BytesIO(archive),mode="r:gz")。範囲: 読込mode。filesystemへのextractallはしない | 73行with進入時。退出時close。使用: 75,78 |
| `member` — 74 | str。保存対象のpackage内テキストmember名。archive内相対パス | 初期: 74行の固定listの各要素。範囲: package/package.json、package/index.d.ts | 各package内2反復で更新。使用: 75,76 |
| `data` — 75,78 | bytes。tarball内memberの内容。テキスト保存またはvendor比較に使う。byte列 | 初期: 75行でpackage.jsonのmember bytes。範囲: 75行:package.json/index.d.ts、78行:各同梱ファイルに対応するmember | 75行の各memberと78行の各vendor反復で再代入。使用: 75,76,79 |
| `f` — 75 | str。packageから抽出するテキストの保存名。内包表記/関数の同名とは別。相対ファイル名 | 初期: 75行でprefix+"-"+member basename。範囲: 各packageのpackage.json/index.d.ts用保存名 | 75行の各member反復で更新。使用: 75,76 |
| `local` — 77 | pathlib.Path。vendor内の照合対象ファイルpath。ファイルパス | 初期: 77行sorted(glob("*"))の各Path。範囲: 現同梱pose10file/camera_utils1file。globが将来増えればそのentryも対象 | 77行各vendor反復で更新。使用: 78,79 |
| `actual` — 78 | bytes。vendor照合対象を実際に読んだ内容。byte列 | 初期: local.read_bytes()。範囲: 同梱file全内容。archive内dataとのbytes比較 | 78行各vendor反復で更新。使用: 79 |
| `rec` — 82 | dict[str,object]。最後にConsoleへ概要表示するrecordsの一件。record一件、bytes欄はbyte | 初期: 82行recordsの各要素。範囲: 通常38record。失敗recordはerrorを表示 | 82行最終loopの各反復で更新。recordsは変えない。使用: 82 |

### module/<listcomp@38>

位置と使用行はすべて `fetch_sources.py` に対する行番号。範囲はソース上の期待値であり、外部応答への実行時検査を追加したという意味ではない。

| 名前・定義行 | 型・意味・単位/基準 | 初期値・期待範囲 | 更新条件・使用行 |
| --- | --- | --- | --- |
| `f` — 38 | str。MDN_PATHSの保存ファイル名。SOURCES要素の第一欄へ渡す。相対ファイル名 | 初期: MDN_PATHS.items()の各key。範囲: MDN_PATHSの24key | 内包表記の各反復で更新。moduleのfへは漏れない。使用: 38 |
| `p` — 38 | str。MDN_PATHSの取得元原稿パス。SOURCES要素の第四欄へ渡す。リポジトリ内相対パス | 初期: MDN_PATHS.items()の各value。範囲: MDN_PATHSの24value | 内包表記の各反復で更新。使用: 38 |

### get

位置と使用行はすべて `fetch_sources.py` に対する行番号。範囲はソース上の期待値であり、外部応答への実行時検査を追加したという意味ではない。

| 名前・定義行 | 型・意味・単位/基準 | 初期値・期待範囲 | 更新条件・使用行 |
| --- | --- | --- | --- |
| `url` — 48 | str。取得するHTTP/HTTPS URL。URL文字列 | 初期: 呼出元の引数。範囲: 本スクリプトでは固定公式GitHub raw/npm registry/tarball URL。関数自身は制限しない | 呼出ごとに束縛。関数内再代入なし。使用: 49 |
| `r` — 49 | HTTPResponse相当。urlopenの応答。本文・status・Content-Type取得元。HTTP応答 | 初期: urlopen(url,timeout=45)成功時の応答。範囲: 正常応答。非正常HTTP/接続エラーでは通常urlopenが例外 | with進入時に束縛。退出時にcloseされる。使用: 50 |

### save_one

位置と使用行はすべて `fetch_sources.py` に対する行番号。範囲はソース上の期待値であり、外部応答への実行時検査を追加したという意味ではない。

| 名前・定義行 | 型・意味・単位/基準 | 初期値・期待範囲 | 更新条件・使用行 |
| --- | --- | --- | --- |
| `item` — 53 | tuple[str,str,str,str]。保存名/repository/commit/upstream pathをまとめた取得指定。4要素 | 初期: ThreadPoolExecutor.mapがSOURCESの各要素を渡す。範囲: 本実装の32tuple。要素数4を解体で要求 | 関数呼出ごと。使用: 54 |
| `f` — 54 | str。保存する原稿ファイル名。相対ファイル名 | 初期: item[0]。範囲: SOURCESで指定したファイル名 | 54行のtuple解体時。以降再代入なし。使用: 56,58 |
| `repo` — 54 | str。公式GitHubのowner/repository。repository名 | 初期: item[1]。範囲: SOURCESにある提供元5repository | 54行のtuple解体時。以降再代入なし。使用: 55 |
| `commit` — 54 | str。原稿を固定するgit commit。40桁16進ID | 初期: item[2]。範囲: 固定した5commit | 54行のtuple解体時。以降再代入なし。使用: 55,56 |
| `path` — 54 | str。取得元repository内の原稿パス。相対パス | 初期: item[3]。範囲: SOURCESの指定path | 54行のtuple解体時。以降再代入なし。使用: 55,56 |
| `url` — 55 | str。raw.githubusercontent.comの固定commit原稿URL。HTTPS URL | 初期: repo/commit/pathを55行で連結。範囲: https://raw.githubusercontent.com/{repo}/{commit}/{path} | 関数呼出ごと構築。再代入なし。使用: 56,58 |
| `rec` — 56 | dict[str,object]。原稿一件の出典・時刻・size/hashまたはerrorを返す記録。bytesはbyte、時刻はUTC、日付はJST、hashはhex | 初期: file/url/upstream_path/commit/version=None/UTC時刻/JST日付。範囲: 成功:status/content_type/bytes/sha256。失敗:error文字列 | 56行作成、59行成功欄追加、60行例外欄追加。使用: 59,60,61 |
| `raw` — 58 | bytes。取得した原稿の無改変本文。byte列 | 初期: get(url)[0]。範囲: 応答本文全体。容量制限は関数内にない | 58行取得成功時だけ束縛。使用: 58,59 |
| `status` — 58 | int。取得応答のHTTP status。HTTP status code | 初期: get(url)[1]。範囲: 実取得は200。API値をそのまま記録 | 58行取得成功時だけ束縛。使用: 59 |
| `mime` — 58 | str \| None。応答Content-Type header。原稿の形式情報。MIME文字列 | 初期: get(url)[2]。範囲: headerの文字列または欠落時None | 58行取得成功時だけ束縛。使用: 59 |
| `e` — 60 | Exception。取得または保存失敗を記録するcatch変数。例外オブジェクト | 初期: try内で発生したException。範囲: Exception subclass。tuple解体等try前の例外は対象外 | 60行のexcept開始時。except終了後にPythonが束縛を削除。使用: 60 |

## B. 全関数

### get — 48行

一つのURLをtimeout=45秒で開き、全文byte列・HTTP status・Content-Typeを返す。

| 項目 | 内容 |
| --- | --- |
| 引数 | url (str) 取得先URL |
| 戻り値 | tuple[bytes,int,str\|None]。順序はbody/status/Content-Type。 |
| 副作用 | HTTP/HTTPS通信と本文のメモリー読込。with退出で応答をclose。ファイル保存なし。 |
| 呼出元 | save_one 58行、mainのregistry取得66行、tarball取得68行。 |
| エラー | URL/接続/timeout/HTTPError/読込等の例外をそのまま呼出元へ伝える。save_oneのtry内ならerror記録、mainの直接呼出なら未捕捉で処理停止。timeoutはネットワーク操作の待ち時間指定で全スクリプトの総実行上限ではない。 |

### stamp — 51行

現在時刻をUTCのISO 8601文字列にする。

| 項目 | 内容 |
| --- | --- |
| 引数 | なし |
| 戻り値 | str。例:2026-10-13T00:07:24+00:00（小数秒を含み得る）。 |
| 副作用 | OS時計の読み取り。通信・保存・状態更新なし。 |
| 呼出元 | save_oneのrec構築56行、mainのregistry記録67行、archive member記録76行。 |
| エラー | 独自catchなし。datetime等の例外があれば伝播。save_oneでは56行がtryの外なのでその例外も外へ伝わる。 |

### save_one — 53行

一般公式原稿一件のURL・出典を作り、無改変bytesを保存し、取得成功/失敗をdictで返す。

| 項目 | 内容 |
| --- | --- |
| 引数 | item (tuple[str,str,str,str]) 保存名/repository/固定commit/upstream path |
| 戻り値 | dict[str,object]。成功時status/content_type/bytes/sha256、try内失敗時errorを基礎出典へ追加。 |
| 副作用 | HTTP取得とROOT/fへのwrite_bytes（同名保存物を上書き）。rec dictへの欄追加。map workerで実行。 |
| 呼出元 | main63行のpool.map(save_one,SOURCES)が各32tupleを渡す。 |
| エラー | 58–59行のget/write/hash/記録更新のExceptionを60行で文字列にして返す。53–56行の引数解体・URL・基礎record構築はtry外で、そこでの例外は伝播しpool.mapの結果読込を止め得る。KeyboardInterrupt/SystemExit等Exception外の例外はcatchしない。 |

## 読み方と確認範囲

主処理はmainブロック63–82行で、独立した自作関数定義ではない。原稿32件を最大6workerで取得し、結果をSOURCES順で集める。その後npm2版を順次取得し、tarballの完全性を検査してからpackage.json/index.d.tsの内容を保存し、vendorの全entryとbytes比較を記録する。`identical=false` のvendor比較を記録するだけで、それ自体をassertで中断する処理はない。tarball本体は保存しない。最後に全取得記録をsources.jsonへ書き、概要をprintする。

ファイルへの書込み、ネットワークの再取得、生成物変更は今回の付録作成では実行しない。ASTの機械照合は網羅性の確認で、外部通信先の将来応答、全異常系の実行、Windows動作やブラウザー動作を検証した意味ではない。
