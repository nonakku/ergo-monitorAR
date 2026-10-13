# 保存したMediaPipe公式資料

MediaPipeを初めて担当する開発者が、仕様説明書の根拠を手元で確認できるよう、公式GitHubリポジトリの原文を保存した。取得日は2026-10-10。

日本語の説明とこのアプリへの対応付けは、[仕様説明書の3.4](../../../仕様説明書.md#34-mediapipeの基礎と本アプリでの使い方)を読む。

| 保存ファイル | 内容 | 読む箇所 |
| --- | --- | --- |
| [upstream-README.md](upstream-README.md) | MediaPipe全体の公式概要。取得時点では現行のTasks等の説明も含む | Solutions、Framework、Legacy solutions。製品全体の概要として読む |
| [legacy-pose.md](legacy-pose.md) | このアプリが使う旧Pose Solutionの公式解説 | Overview、ML Pipeline、Models、Solution APIsのOutput、JavaScript Solution API |
| [graphs.md](graphs.md) | 処理要素と接続を定義するグラフの公式解説 | Graph。`pose_web.binarypb` が何を担うかを理解するために読む |
| [LICENSE](LICENSE) | 取得した公式リポジトリのLICENSE原文 | 原文と一緒に保持する。本アプリ独自のライセンス宣言ではない |
| [sources.json](sources.json) | 原文の取得URL、コミット、ファイルサイズ、SHA-256 | 原文を再取得・照合するときに使用 |

取得元は [google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe)、固定したコミットは `210cb240955256958c3376c34cfbaf34a5c86308`。原文4ファイルは取得内容を改変せず保存した。ファイル名 `upstream-README.md` は取得元のルート `README.md` に対応する。

このアプリは `@mediapipe/pose` **0.5.1675469404** の旧APIを使う。現行Tasks / PoseLandmarkerへの移行は実施していない。概要READMEの現行Tasks向けのAPIやPrivacy Noticeを、そのまま旧Poseの契約と扱わない。採用版の型・API・挙動は仕様説明書に示す同梱JSおよび指定版npm配布物と照合している。

33点の番号確認用として2026-10-13に [公式Pythonソースの原文](upstream-pose-landmarks.py.txt) も追加取得した（同じ固定コミット、番号定義は56～90行）。これは参考資料であり、アプリがPython版を使うことを意味しない。追加原文の取得URL・ハッシュ、採用JSの9/10の名称との差、作図の根拠は [landmark-map-source.json](landmark-map-source.json) に保存した。

公式本文の33点画像は公式サイトへの接続が403で拒否されたため保存できなかった。本書用に [人体の番号図](../../images/mediapipe_pose_33_landmarks.svg) と [アプリの角度入力図](../../images/mediapipe_app_angle_points.svg) を作図し、PNGも同梱した。公式転載画像・推定座標・画面画像と混同しない。公式の番号・接続、採用JS、アプリの計算・描画範囲と照合する。

原文中のその他の画像、動画、外部リンク、ここに保存していない資料への相対リンクは未保存で、表示や参照にインターネット接続が必要な場合がある。これはサイト全体のオフライン複製ではない。原文のPython/C++/JavaScript例は参考用で、このアプリの実装や起動手順ではない。
