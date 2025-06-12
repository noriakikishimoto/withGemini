import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // ★ここから追加
  test: {
    globals: true, // `describe`, `it`, `expect` などをグローバルに利用可能にする
    environment: 'jsdom', // テスト環境をブラウザDOM環境に設定
    setupFiles: './src/setupTests.ts', // テスト実行前に読み込むセットアップファイル
  },
  // ★ここまで追加
})
