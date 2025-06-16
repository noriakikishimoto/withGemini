import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // ★ここから追加
  test: {
    globals: true, // `describe`, `it`, `expect` などをグローバルに利用可能にする
    environment: "jsdom", // テスト環境をブラウザDOM環境に設定
    setupFiles: "./src/setupTests.ts", // テスト実行前に読み込むセットアップファイル
    // ★ここを追加: グローバルなテストタイムアウトを延長
    // 例: 10秒 (10000ms) に設定
    testTimeout: 10000, // または 20000 など、もう少し長めに設定
    hookTimeout: 10000, // beforeEach, afterEach などのフックのタイムアウトも合わせて延長
  },
  // ★ここまで追加
});
