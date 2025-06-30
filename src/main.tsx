import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css"; // グローバルなCSS

// ★追加: MUIの ThemeProvider と createTheme をインポート
import { ThemeProvider, createTheme } from "@mui/material/styles";
// ★追加: MUIのCSSリセット (ブラウザのデフォルトスタイルをリセット)
import CssBaseline from "@mui/material/CssBaseline";
import { UserProvider } from "./contexts/UserContext.tsx";

// ★追加: カスタムテーマの定義 (デフォルトテーマでも可)
//const theme = createTheme();
const theme = createTheme({
  /*
  shape: {
    borderRadius: 8, // デフォルトは 4px。値を大きくするとより丸くなる (単位はpx)
  },
  */
  palette: {
    background: {
      // メインコンテンツの背景色をここで設定
      default: "#F7F7F7",
      paper: "#ffffff",
    },

    primary: {
      main: "#1ABB9C",
    },

    secondary: {
      main: "#73879C",
    },
    text: {
      primary: "rgba(0, 0, 0, 0.87)", // デフォルトのプライマリテキスト色
      secondary: "#73879C", // グレー

      // または、MUIの色パレットから選ぶ場合
      // secondary: '#757575', // material-ui/colors の grey[600] など
    },
  },

  // ★重要: スペーシングの調整
  // デフォルト 8px。これを小さくすると全体のマージン/パディングが小さくなる
  spacing: 8, // デフォルト8pxを4px単位にする (4px, 8px, 12px, ...)
  // もし Mui がデフォルトで 8px 単位で p={1} などと使っている場合、
  // p={1} は 4px になり、全体的に詰まる。

  // ★重要: タイポグラフィ（文字サイズ）の調整
  typography: {
    // 全体の基本フォントサイズを小さくする
    fontSize: 11, // デフォルト16px。これを小さくすると全体的に文字が小さくなる
    htmlFontSize: 12, // 1rem が 12px になるように (デフォルト16px)
    fontFamily: ["Roboto", "Noto Sans JP", "Helvetica", "Arial", "sans-serif"].join(","),

    // 各 variant の文字サイズを調整
    h1: { fontSize: "2.5rem" }, // デフォルトより少し小さめ
    h2: { fontSize: "2rem" },
    h3: { fontSize: "1.75rem" },
    h4: { fontSize: "1.4rem" },
    h5: { fontSize: "1.1rem" }, // ListTitle (既存のタスク) など
    h6: { fontSize: "1rem" }, // CardTitle (新しいタスク) など
    subtitle1: { fontSize: "0.9rem" },
    subtitle2: { fontSize: "0.85rem" },
    body1: { fontSize: "0.85rem" }, // デフォルトの本文
    body2: { fontSize: "0.75rem" }, // 小さいテキスト
    button: { fontSize: "0.6rem" }, // ボタンの文字
    caption: { fontSize: "0.65rem" },
    overline: { fontSize: "0.6rem" },
  },

  // ★重要: コンポーネントのデフォルトスタイルを上書き
  components: {
    // ボタンのデフォルトサイズを小さくする
    MuiButton: {
      defaultProps: {
        size: "small", // 全てのButtonのデフォルトサイズを 'small' に
      },
      styleOverrides: {
        root: {
          padding: "4px 4px", // デフォルトのpaddingをさらに小さく
        },
        contained: {
          color: "#ffffff",
        },
      },
    },
    // TextField のデフォルトサイズを小さくする
    MuiTextField: {
      defaultProps: {
        size: "small", // 全てのTextFieldのデフォルトサイズを 'small' に
      },
      styleOverrides: {
        root: {
          marginTop: "8px", // マージンを小さく (normal は 16px)
          marginBottom: "8px",
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        root: {
          //  color: "#ffffff",
        },
      },
      defaultProps: {
        color: "secondary",
      },
    },
    /*
    MuiTableHead: {
      styleOverrides: {
        root: {
          position: "sticky",
          top: 0,
        },
      },
    },
    */
    // テーブルのセルを詰める
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "4px 8px", // デフォルトのpaddingを小さく
          fontSize: "0.85rem",
          borderRight: "0.5px solid #e0e0e0", // 右線 (セル間)
          "&:last-child": {
            borderRight: "none", // 最後のセルには右線を適用しない
          },
        },
        head: {
          fontSize: "0.85rem",
          padding: "8px 8px", // デフォルトのpaddingを小さく
          borderRight: "1px solid #ffffff", // 右線 (セル間)
          "&:last-child": {
            borderRight: "none", // 最後のセルには右線を適用しない
          },
          backgroundColor: "#EDEDED",
        },
        body: {
          //fontSize: "0.9rem",
        },
        sizeSmall: {
          // size="small" の場合のpaddingも調整
          padding: "2px 4px",
        },
      },
    },
    // ListItem を詰める (サイドメニューなど)
    MuiListItemButton: {
      styleOverrides: {
        root: {
          paddingTop: "4px",
          paddingBottom: "4px",
        },
      },
    },
    // Card のパディングを詰める (DynamicCards)
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "16px", // デフォルトの 16px から小さく
          "&:last-child": {
            // MUI CardContent の最後の要素の特殊なpaddingを調整
            paddingBottom: "12px",
          },
        },
      },
    },
    // DialogContent (モーダルのコンテンツ) のパディングを詰める
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "16px 24px", // デフォルト24pxより少し小さく
        },
      },
    },
    // AppBar Toolbar の高さ調整 (Appbarの高さを抑える)
    MuiToolbar: {
      styleOverrides: {
        dense: {
          // dense variant の Toolbar の高さ
          minHeight: 48,
        },
        regular: {
          // regular variant の Toolbar の高さ (default)
          minHeight: 56, // デフォルト 64px から少し小さく
        },
      },
    },
    MuiPaper: {
      // Paper コンポーネントのデフォルトスタイルを上書き
      styleOverrides: {
        root: {
          borderRadius: 4, // 例: 16px の丸み
          // boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)', // 例: デフォルトの影をカスタマイズ
        },
        // variant: {
        //   outlined: { // 'outlined' variant の Paper だけカスタマイズする場合
        //     borderColor: 'red',
        //   },
        // },
      },
      defaultProps: {
        elevation: 0, // デフォルトの影の強さを設定 (デフォルトは1)
      },
    },
  },
});

// ★追加: react-router-dom から BrowserRouter をインポート
import { BrowserRouter } from "react-router-dom";
import { GlobalDataProvider } from "./contexts/GlobalDataContext.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* ★追加: アプリケーション全体を BrowserRouter で囲む */}
    <BrowserRouter>
      {/* ★追加: ThemeProvider でアプリケーションを囲む */}
      <ThemeProvider theme={theme}>
        {/* ★追加: CssBaseline でブラウザのデフォルトスタイルをリセット */}
        <CssBaseline />
        <GlobalDataProvider>
          <UserProvider>
            <App />
          </UserProvider>
        </GlobalDataProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
