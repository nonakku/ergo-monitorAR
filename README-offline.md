# ErgoMonitor AR オフライン版 起動手順

このアプリはインターネット接続なしで完全動作します。フォント・MediaPipe ライブラリ・姿勢推定モデルはすべて `vendor/` フォルダに同梱済みで、外部サーバへの通信は一切行いません。

## 起動方法（Windows）

1. **`start-offline.bat` をダブルクリック**します。
2. 黒いウィンドウ（ローカルサーバ）が開き、既定のブラウザで `http://localhost:8000/` が自動的に開きます。
3. 「カメラを起動」ボタンを押し、カメラへのアクセスを**許可**してください。
4. 終了するときは黒いウィンドウを閉じます（またはウィンドウ内で `Ctrl+C`）。

- 追加のインストールは不要です（Python も不要）。Windows 標準の PowerShell だけで動作し、管理者権限も要りません。
- ポート 8000 が使用中の場合は自動的に 8001〜8010 を試します。ブラウザに表示されたアドレスをそのまま使ってください。
- サーバは `localhost`（自分のPC内）だけで待ち受けるため、外部のPCからはアクセスできません。

### .bat が使えない場合（手動起動）

PowerShell を開き、このフォルダで次を実行してください：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1
```

Python が入っているPCなら、代わりに次でも起動できます：

```powershell
python -m http.server 8000
```

その後、ブラウザで `http://localhost:8000/` を開いてください。

## 注意：`index.html` をダブルクリックで直接開かないでください

`file://` で直接HTMLを開く方式は **Chrome / Edge では動作しません**。Chromium系ブラウザは `file://` を特殊なオリジンとして扱い、MediaPipe がモデルファイルを読み込むための `fetch` 通信を CORS でブロックするためです。必ず上記のローカルサーバ経由（`http://localhost:...`）で開いてください。

## 同梱アセットについて

- `vendor/mediapipe/pose/` … MediaPipe Pose `0.5.1675469404`（バージョン固定）
- `vendor/mediapipe/camera_utils/` … MediaPipe Camera Utils `0.3.1675466862`（バージョン固定）
- `vendor/fonts/` … IBM Plex Mono（数値表示用の欧文等幅フォント、ローカル同梱のためオフラインで動作）
- 姿勢推定モデルは、アプリが実際に使用する `pose_landmark_full.tflite`（`modelComplexity: 1` 用）のみ同梱しています。`script.js` の `modelComplexity` を `0` / `2` に変更する場合は、同バージョンの `pose_landmark_lite.tflite` / `pose_landmark_heavy.tflite` を `vendor/mediapipe/pose/` に追加してください（入手先例: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/`）。

## オフライン動作の確認方法

1. Wi-Fi を切断（または DevTools → Network → Offline）した状態で上記の手順で起動。
2. カメラ映像に骨格が重畳され、スコア／腰部負荷／体幹角度／膝角度が更新されることを確認。
3. DevTools の Network タブで、通信先がすべて `localhost` であること（`fonts.googleapis.com` や `cdn.jsdelivr.net` への通信が0件）を確認。
