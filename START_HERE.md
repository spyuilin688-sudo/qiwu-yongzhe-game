# 開始之前：GitHub 儲存庫與操作順序

## 已查證（2026-11-05）
- URL：https://github.com/spyuilin688-sudo/-
- Repository name：`-` （建議改為 `qiwu-yongzhe-game`，但目前**尚未代替使用者改名**）
- Visibility：**Public**（建議改為 Private，尚未代替使用者變更）
- Repo 檔案：size 0，空白儲存庫
- default branch：`main`

## 在 GitHub 網頁變更
1. 開啟上方 Repo → Settings → General。
2. Repository name 改成 `qiwu-yongzhe-game` → Rename。
3. 同一頁下方 Danger Zone → Change repository visibility → Make private（按 GitHub 確認步驟操作）。
4. 如果以後由朋友協助開發，請在 Settings → Collaborators 正式授權該 GitHub 帳號。不要傳送密碼或 Personal Access Token。

## 在 Claude Code 執行
1. 先看 GitHub repo 最新網址，並複製正式 Clone URL。
2. 在開發者電腦執行 `git clone <最新的 Clone URL>`，進入剛建立的專案目錄。
3. 將本 ZIP 解壓後的 `CLAUDE.md`、`START_HERE.md`、`FIRST_TASK.md`、`docs/` 放入該專案根目錄。
4. 在該根目錄執行 `claude`，貼上 `FIRST_TASK.md` 的全文。
5. 本地完成驗證後確認 Git remote、repo Private，再允許 push；不執行 GitHub Actions 或 Android 完整 Build。

## 文件優先順序
使用者明確確認的核心玩法規則 > 完整架構 v0.2（特別是 C 標記） > v0.2 P/N 設計提案 > v0.1 早期草稿。
若有衝突，先標記差異，不能以較早草稿覆蓋已確認規格。

## 提醒
大於 200MB 的原始遊戲參考影片不在 ZIP 內。使用者若要 Claude Code 參考影片介面，須另外提供原影片。文件含參考影片的介面觀察文字。
