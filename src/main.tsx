import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css"; // グローバルなCSS

// ★追加: MUIの ThemeProvider と createTheme をインポート
import { ThemeProvider, createTheme } from "@mui/material/styles";
// ★追加: MUIのCSSリセット (ブラウザのデフォルトスタイルをリセット)
import CssBaseline from "@mui/material/CssBaseline";

// ★追加: カスタムテーマの定義 (デフォルトテーマでも可)
const defaultTheme = createTheme();

// ★追加: react-router-dom から BrowserRouter をインポート
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* ★追加: アプリケーション全体を BrowserRouter で囲む */}
    <BrowserRouter>
      {/* ★追加: ThemeProvider でアプリケーションを囲む */}
      <ThemeProvider theme={defaultTheme}>
        {/* ★追加: CssBaseline でブラウザのデフォルトスタイルをリセット */}
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
