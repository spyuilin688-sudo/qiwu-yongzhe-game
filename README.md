# 奇物勇者｜Claude Code 開發交付包 v0.2

## 這份包裡有什麼
- `CLAUDE.md`：專案持續有效的開發原則；Claude Code 在專案根目錄啟動時讀取。
- `START_HERE.md`：第一次交接步驟，包含 GitHub 安全提醒。
- `FIRST_TASK.md`：第一階段「可玩的直式遊戲原型」完整任務指令，可直接貼給 Claude Code。
- `docs/spec_v0.2.md`：完整架構與遊戲設計規格（**優先閱讀**）。
- `docs/data_v0.2.json`：職業、技能、裝備、關卡與介面資料（**優先閱讀**）。
- `docs/spec_v0.2.docx`、`docs/spec_v0.2.pdf`：給人閱讀的文件，與文字稿內容對應。
- `docs/v0.1_career_and_ui.md`、`docs/v0.1_stages_360.txt`：早期設計參考。若與 v0.2 不一致，以 v0.2 為準；使用者已確認規則始終最優先。
- `docs/original_readme.txt`：v0.2 規格來源與驗證聲明。

## 簡單操作
1. 在 GitHub 把目前的 `spyuilin688-sudo/-` 改成可辨識名稱，並改為 `Private`（**目前已查證是 Public，且為空儲存庫**）。建議名稱：`qiwu-yongzhe-game`。
2. 在 Claude Code 使用者的電腦登入有權限的 GitHub 帳號，克隆**實際存在的最新儲存庫網址**。如果交給朋友，需先正式授權他存取私人 repo；單靠 URL 無法讀寫私人 repo。
3. 將這份 ZIP **解壓至克隆的儲存庫根目錄**，不是把 ZIP 本身當成專案程式碼。不得覆寫既有檔案；遇到同名先比對內容。
4. 在儲存庫資料夾啟動 Claude Code (`claude`)，貼上 `FIRST_TASK.md` 的全文。
5. 優先在本地完成可執行原型與小型測試，再提交與推送；**不要自行建立 GitHub Actions Workflow，也不要做完整 Android APK/AAB 打包**。

## 檔案狀態
這是設計規格與開發指令，不是遊戲程式，也不是已完成平衡測試的遊戲。完整主文件內的 C／P／N 類別：C 已確認規則，P 既有提案，N 待驗證的實作建議或起始數值。原始影片約 201MB，本包不包含；如果需要重看按鈕／介面，請另外把原影片交給 Claude Code。這份交付沒有產生圖片。

---

## 開發與啟動（原型）

需求：Node.js 22.12 以上、npm 10。

```bash
npm install              # 安裝依賴（版本已鎖定）
npm run dev              # 開發伺服器 http://localhost:5173（手機可連同網段 IP）
npm run build            # 正式建置到 apps/mobile-web/dist
npm run preview          # 預覽正式建置 http://localhost:4173
```

驗證（全部在本機執行，不使用 GitHub Actions）：

```bash
npm run typecheck        # 三個套件與平衡工具的 TypeScript 型別檢查
npm run validate:content # 35 職業／70 技能／88 裝備／12 圖／360 關等內容自動檢查（含設計倍率與實作一致）
npm test                 # 核心規則、經濟、BOSS 狀態機、戰鬥機制、35 職業壓力測試、美術渲染測試
npm run e2e              # Playwright：核心循環與 320／360／390／430 寬版面（會自動啟動開發伺服器）
npm run balance          # 14 路線同投入平衡模擬，輸出 docs/BALANCE_REPORT.md（本機離線，約 10 秒）
npm run balance:breakdown -- JOB03 JOB28   # 指定路線的傷害來源拆解
npm run balance:progression   # 14 條三轉路線從 Lv1 玩到通關的真實進度模擬，輸出 docs/PROGRESSION_REPORT.md（4 核心約 9 分鐘）
```

開發模式小工具（只在 `npm run dev` 有效，正式建置不會包含）：
- 網址加 `?devSpeed=10` 以 10 倍時間推進（畫面上會顯示「開發加速」標記）。
- 瀏覽器主控台 `window.__qiwuDev.loadFixture('bossReady')` 載入測試前置狀態；可用名稱：`fresh`、`gold`、`lv10`、`bossReady`、`bossStrong`、`fullBag`、`swordSaint`、`mechCommander`，以及 14 條三轉路線的 `route:JOB03`～`route:JOB35`（Lv80、全身稀有）。手機上可在「更多 → 開發測試」直接點選。
- 網址加 `?gallery=1` 開啟美術總覽（角色、怪物、BOSS、背景、圖示、召喚物）。

實作說明、規則落點與假設見 `docs/IMPLEMENTATION_NOTES.md`；平衡結果見 `docs/BALANCE_REPORT.md`。
