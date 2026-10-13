# 仕様書・検証を含む一式の受け渡し

配布版：`20261013`。元アプリ：`1214b9bf67b1b18fe3e33e7a3b4eeab3981ef880`。

本書作成で追加した仕様書・資料・検証コードは、上記元アプリのコミットには含まれない。作業ツリー一式をローカルのZIPへ保存した。GitHubへ公開・push済みという意味ではない。

- [一式のZIP](ergo-monitorAR_20261013.zip)
- [ZIPのSHA-256](ergo-monitorAR_20261013.zip.sha256)
- [各保存物のmanifest](manifest.json)

## 受け取りから起動・検証まで

1. ZIPと、そのZIPに対応するSHA-256ファイルを受け取る。ZIPを既存の作業フォルダーへ上書きせず、空のフォルダーへ全て展開する。展開後の `ergo-monitorAR/` に `index.html`、`vendor/`、`仕様説明書.md`、`docs/verification/README.md`、`docs/verification/package.json`、`docs/verification/package-lock.json` がそろっていれば、起動・検証のファイル一式を受け取れている。
2. ZIPのSHA-256と、展開した保存物のmanifestを照合する。これは配布物の一致を確認する操作で、第三者認証や電子署名ではない。manifestのsource_commitは元アプリの版、ファイルごとのSHA-256は追加文書を含む具体的な内容を示す。
3. 展開した `ergo-monitorAR/` を作業ディレクトリとして、仕様書7.2のPython起動または7.3のWindows起動を使う。成功条件と終了方法もその節を読む。
4. 検証は `docs/verification/` のREADMEに従い、依存を導入して実行する。node_modules、ブラウザー本体、Gitの履歴・認証設定はZIPに同梱しない。初回の検証依存取得にはネットワークが必要だが、アプリの通常測定がCDN依存になるという意味ではない。
5. 新しい検証結果を保存する前に以前のresults.json/inventory.jsonを退避し、版・実行日時・実行コマンドとともに保持する。

manifestの照合は展開直後に行う。検証を実行するとresults.json/inventory.jsonが更新され、取得ツールを実行すると取得記録も更新される。その後に配布時のmanifestと一致しなくなることは、直ちにアプリの破損を意味しない。受取時の一致と、再実行後の記録を分けて扱う。

Linuxの照合例（通常のPython 3、展開した `ergo-monitorAR/` で実行）：

```bash
python3 - <<'PY'
import hashlib, json
from pathlib import Path
manifest = json.loads(Path('docs/handoff/manifest.json').read_text())
for item in manifest['files']:
    payload = Path(item['path']).read_bytes()
    if len(payload) != item['size_bytes'] or hashlib.sha256(payload).hexdigest() != item['sha256']:
        raise RuntimeError('Mismatch: ' + item['path'])
print('Manifest files match:', len(manifest['files']))
PY
```

ZIP自体のハッシュは展開前に `sha256sum ergo-monitorAR_20261013.zip` 等で確認できる。このLinux手順は実行確認し、Windowsの展開・照合・起動は未確認として区別する。

## 含まれるものと含まれないもの

元アプリ全ファイルとvendor、本書・利用者文書、取得した資料と来歴、検証ソース・固定依存宣言・結果、レビューと修正記録、文書作成スキルを含む。Gitメタデータ、node_modules、キャッシュ、ZIP自身とそのハッシュファイルはZIP内部に含めない。manifestは自身をハッシュ対象に含めない。

モデル・第三者原稿のライセンスや確認範囲は仕様書3章を参照。Windows実機、実カメラ・人体の精度、実読者の理解は、この受け渡し確認で検証したものではない。
