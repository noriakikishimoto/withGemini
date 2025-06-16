import React, { FC, ReactNode } from "react";
import TopHeader from "./TopHeader.tsx"; // ★追加: TopHeader をインポート
import SideMenu from "./SideMenu.tsx"; // ★追加: SideMenu をインポート
import styles from "./Layout.module.css";

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className={styles.layoutContainer}>
      {/* グローバルヘッダー */}
      <TopHeader />

      {/* メインコンテンツ部分を囲むコンテナ */}
      <div className={styles.mainContentWrapper}>
        {/* サイドメニュー */}
        <SideMenu />

        {/* ルーティングされたコンテンツエリア */}
        <main className={styles.mainContentArea}>
          {children} {/* ここに Routes コンポーネントがレンダリングされる */}
        </main>
      </div>

      {/* フッター部分 */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Gemini's React Rehab Project</p>
      </footer>
    </div>
  );
};

export default Layout;
