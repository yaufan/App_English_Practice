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
- `src/lib/llm.ts`：手機上的離線模型（llama.rn / llama.cpp）。模型檔第一次在設定頁從 Hugging Face 下載到 App 的文件資料夾，之後完全離線；不使用任何雲端 API 或金鑰。
- 模型：Qwen3.5 2B（標準，約 1.2 GB，預設）和 4B（高品質，約 2.6 GB，較新的手機），都是 Q4_K_M GGUF。0.8B 測過品質太差（會教錯英文），不要再加回來。
- `src/lib/schemas.ts`：給模型的 JSON schema，llama.cpp 會轉成文法強制輸出合法 JSON；`reply` 必須排第一個欄位，App 才能邊產生邊顯示、先唸出來。
- `src/lib/zh.ts`：小模型常冒出簡體字，模型輸出的中文一律用 OpenCC 轉成台灣繁體。
- `src/lib/prompts.ts`：給模型的指令（為小模型寫得短、附一個範例）、解析與防呆（混中文的英文、無效修正、英文寫的中文欄位都不顯示）。
- 對話提示是自己用 `buildChatPrompt` 組的 Qwen 格式，結尾是空的思考區塊；不要改回交給 llama.rn 的 messages／範本處理，手機上會變成長篇思考、JSON 格式也不會從第一個字生效（模擬器實測過）。
- `src/lib/srs.ts`：間隔複習排程；`src/lib/match.ts`：比對說出／打出的英文。
- `src/lib/useRecognizer.ts`：語音辨識（expo-speech-recognition），`src/lib/tts.ts`：朗讀（expo-speech）。

## 指令
- 型別檢查：`npx tsc --noEmit`
- 邏輯與內容測試：`npm test`（Node 內建 test runner，測 srs、比對、解析、schema、繁簡轉換、內建內容格式）
- 模擬器和模型品質檢查：push 到 `ci/emulator-test` 或 `feat/offline-model` 分支會跑 `.github/workflows/emulator-check.yml`：在 CI 用 llama.cpp 跑同一個模型和 prompt 檢查回覆品質，並在 Android 模擬器下載輕量模型實際對話；結果 commit 回該分支的 `ci-results/`。
- 加套件：`npx expo install <pkg>`；在沒有 api.expo.dev 連線的環境用 `EXPO_OFFLINE=1 npx expo install <pkg>`
- 打 JS bundle 檢查：`EXPO_OFFLINE=1 npx expo export --platform android`
- `android/`、`ios/` 由 prebuild 產生，不要手動改、不要 commit，原生設定放 `app.json` 的 plugins。

## 發布
- push 到 main（或在 Actions 手動執行 Android APK）→ 打包 → 建立 GitHub Release。
- 下載網址固定：`https://github.com/yaufan/app_english_practice/releases/latest/download/english-practice.apk`，QR code 也在 Release 頁。
- versionCode 用 workflow 的 run number，所以新版可以直接蓋過舊版安裝；使用者看得到的版本號改 `app.json` 的 `version`。
- 簽章：repo 有 keystore Secret（`ANDROID_KEYSTORE_BASE64` 等常見名稱）就用它，密碼 Secret 必須有；alias 沒設會自動從 keystore 讀，key 密碼沒設就用 keystore 密碼。完全沒有 keystore Secret 時用專案固定的 debug key。兩種簽章互換時要先移除舊版再安裝。
