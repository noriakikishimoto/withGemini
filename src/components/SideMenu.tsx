// src/components/SideMenu.tsx

import React, { FC, useState, useEffect } from "react"; // ★useState を追加
import { Link, useLocation } from "react-router-dom";
import styles from "./Layout.module.css";

interface SideMenuProps {}

const SideMenu: FC<SideMenuProps> = () => {
  const location = useLocation();

  const [isApplicationMenuOpen, setIsApplicationMenuOpen] = useState(true); // デフォルトで開いておく
  const [isTaskMenuOpen, setIsTaskMenuOpen] = useState(true); // デフォルトで開いておく

  const isApplicationPath = location.pathname.startsWith("/applications/");
  const isTaskPath = location.pathname.startsWith("/generic-db/tasks/");

  useEffect(() => {
    setIsApplicationMenuOpen(isApplicationPath);
    setIsTaskMenuOpen(isTaskPath);
  }, [location.pathname, isApplicationPath, isTaskPath]); // location.pathname が変わるたびに実行

  // ★追加: クリックでメニュー開閉をトグルするハンドラ
  // const toggleApplicationMenu = () => setIsApplicationMenuOpen((prev) => !prev);
  // const toggleTaskMenu = () => setIsTaskMenuOpen((prev) => !prev);

  return (
    <nav className="{styles.sideMenu}">
      {/* 申請管理メニュー */}
      {/* ★修正: isApplicationMenuOpen の条件の中に h3 と ul の両方を入れる */}
      {isApplicationMenuOpen && (
        <>
          {/* Fragment を使って複数の要素をまとめる */}
          <h3 className={styles.sideMenuTitle}>
            {" "}
            {/* onClick は削除 */}
            申請管理
            {/* 開閉を示すアイコンも不要 */}
          </h3>
          <ul className={styles.sideMenuList}>
            <li className={styles.sideMenuItem}>
              <Link
                to="/applications/list"
                className={`${styles.sideMenuLink} ${location.pathname === "/list" || location.pathname.startsWith("/applications/") ? styles.activeLink : ""}`}
              >
                申請リスト
              </Link>
            </li>
            <li className={styles.sideMenuItem}>
              <Link
                to="/applications/new"
                className={`${styles.sideMenuLink} ${location.pathname === "/new" ? styles.activeLink : ""}`}
              >
                新規申請
              </Link>
            </li>
          </ul>
        </>
      )}

      {/* タスク管理メニュー */}
      {/* ★修正: isTaskMenuOpen の条件の中に h3 と ul の両方を入れる */}
      {isTaskMenuOpen && (
        <>
          {/* Fragment を使って複数の要素をまとめる */}
          <h3 className={styles.sideMenuTitle} style={{ marginTop: "20px" }}>
            {/* onClick は削除 */}
            タスク管理
            {/* 開閉を示すアイコンも不要 */}
          </h3>
          <ul className={styles.sideMenuList}>
            <li className={styles.sideMenuItem}>
              <Link
                to="/generic-db/tasks/list"
                className={`${styles.sideMenuLink} ${location.pathname === "/tasks/list" ? styles.activeLink : ""}`}
              >
                タスクリスト
              </Link>
            </li>
            <li className={styles.sideMenuItem}>
              <Link
                to="/generic-db/tasks/new"
                className={`${styles.sideMenuLink} ${location.pathname === "/tasks/new" ? styles.activeLink : ""}`}
              >
                新規タスク
              </Link>
            </li>
          </ul>
        </>
      )}
    </nav>
  );
};

export default SideMenu;
