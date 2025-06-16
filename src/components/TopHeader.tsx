import React, { FC } from "react";
import { Link } from "react-router-dom";
import styles from "./Layout.module.css"; // レイアウト共通のスタイルをインポート
import "../App.css"; // グローバルなボタンクラスのためにApp.cssをインポート
import { AppBar, Toolbar, Typography } from "@mui/material";

interface TopHeaderProps {}

const TopHeader: FC<TopHeaderProps> = () => {
  return (
    <header className={styles.header}>
      <h1 className={styles.headerTitle}>My Application (POC)</h1>
      <nav className={styles.topNavigation}>
        <Link to="/" className="btn btn-primary">
          ホーム
        </Link>{" "}
        {/* / にリダイレクトを設定 */}
        <Link to="/applications/list" className="btn btn-secondary" style={{ marginLeft: "10px" }}>
          申請管理
        </Link>{" "}
        {/* ★追加: タスク管理メニュー */}
        <Link to="/generic-db/tasks/list" className="btn btn-secondary" style={{ marginLeft: "10px" }}>
          タスク管理
        </Link>
        {/* <Link to="/settings" className="btn btn-secondary" style={{ marginLeft: '10px' }}>設定</Link> */}
      </nav>
    </header>
  );
};

export default TopHeader;
