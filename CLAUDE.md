# 英文練習 App（App_English_Practice）

Fan 自己用的英文練習 App：口說對話、單字片語、聽力。Expo SDK 58 + Expo Router，Android APK 由 GitHub Actions 打包。

## 規則
- 回覆一律用繁體中文（台灣用語）；App 內的中文也一樣。
- 推到 main 要等 Fan 說「推到 main」或「發布」才做；push 到 main 就會觸發打包發布。
- 使用者英文程度是初級：新內容（情境、單字、聽力短文）用簡單常用字、短句，並附中文。
- 單字的 id 是 `<deck>:<英文小寫>`，複習進度靠這個 id 對應。改單字英文會讓那張卡的進度歸零，非必要不要改英文本身。

## 結構
- `src/app/`：路由（Expo Router）。`(tabs)/` 是五個分頁：今天、對話、單字、聽力、設定。
- `src/data/`：內建內容。`scenarios.ts` 對話情境、`decks.ts` 單字組、`listening.ts` 聽力短文。
- `src/lib/claude.ts`：直接呼叫 Anthropic Messages API，金鑰由使用者在設定頁輸入，存在 SecureStore。
- `src/lib/prompts.ts`：所有給 AI 的指令和 JSON 格式，以及解析（解析失敗要能優雅退回）。
- `src/lib/srs.ts`：間隔複習排程；`src/lib/match.ts`：比對說出／打出的英文。
- `src/lib/useRecognizer.ts`：語音辨識（expo-speech-recognition），`src/lib/tts.ts`：朗讀（expo-speech）。

## 指令
- 型別檢查：`npx tsc --noEmit`
- 邏輯與內容測試：`npm test`（Node 內建 test runner，測 srs、比對、解析、內建內容格式）
- 加套件：`npx expo install <pkg>`；在沒有 api.expo.dev 連線的環境用 `EXPO_OFFLINE=1 npx expo install <pkg>`
- 打 JS bundle 檢查：`EXPO_OFFLINE=1 npx expo export --platform android`
- `android/`、`ios/` 由 prebuild 產生，不要手動改、不要 commit，原生設定放 `app.json` 的 plugins。

## 發布
- push 到 main（或在 Actions 手動執行 Android APK）→ 打包 → 建立 GitHub Release。
- 下載網址固定：`https://github.com/yaufan/app_english_practice/releases/latest/download/english-practice.apk`，QR code 也在 Release 頁。
- versionCode 用 workflow 的 run number，所以新版可以直接蓋過舊版安裝；使用者看得到的版本號改 `app.json` 的 `version`。
- 沒設定簽章 Secrets 時用專案固定的 debug key 簽章（個人安裝夠用）。若之後加上 `ANDROID_KEYSTORE_BASE64`、`ANDROID_KEYSTORE_PASSWORD`、`ANDROID_KEY_ALIAS`、`ANDROID_KEY_PASSWORD`，第一次要先移除舊版再安裝。
