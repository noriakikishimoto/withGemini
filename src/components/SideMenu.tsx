import React, { FC, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Collapse,
  Divider,
  Toolbar,
  IconButton,
  Box,
  CircularProgress,
  Typography,
  Button,
  SvgIconProps,
} from "@mui/material"; // MUIコンポーネント
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"; // 左矢印アイコン
// アイコン
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import TableViewIcon from "@mui/icons-material/TableView";
import BarChartIcon from "@mui/icons-material/BarChart";
import LayersIcon from "@mui/icons-material/Layers";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AppsIcon from "@mui/icons-material/Apps";

import { AppSchema } from "../types/interfaces";
import { appSchemaRepository } from "../repositories/appSchemaRepository";

interface SideMenuProps {
  onDrawerClose: () => void; // Drawerを閉じるためのコールバック
}

// メニュー項目の型定義 (Layout.tsxから移動)
interface MenuItem {
  text: string;
  path?: string;
  icon?: React.ReactElement;
  children?: MenuItem[];
}

// メニュー項目を配列で定義 (Layout.tsxから移動)
const menuItems: MenuItem[] = [
  { text: "ダッシュボード", path: "/generic-db/dashboards", icon: <DashboardIcon /> },
  {
    text: "申請管理",
    path: "/applications",
    icon: <DescriptionIcon />,
    children: [
      { text: "申請リスト", path: "/applications/list" },
      { text: "新規申請", path: "/applications/new" },
    ],
  },
  {
    text: "タスク管理",
    path: "/generic-db/tasks",
    icon: <TableViewIcon />,
    children: [
      { text: "タスクリスト", path: "/generic-db/tasks/list" },
      { text: "新規タスク", path: "/generic-db/tasks/new" },
    ],
  },
  // ★追加: アプリスキーマ管理のメニュー項目
  {
    text: "アプリ管理",
    path: "/generic-db/app-schemas",
    icon: <AppsIcon />,
    children: [
      { text: "アプリ一覧", path: "/generic-db/app-schemas/list" },
      { text: "新規アプリ作成", path: "/generic-db/app-schemas/new" },
    ],
  },
];

const SideMenu: FC<SideMenuProps> = ({ onDrawerClose }) => {
  const location = useLocation();
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});

  // サブメニューの開閉ハンドラ
  const handleSubMenuClick = (itemPath: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [itemPath]: !prev[itemPath] }));
  };

  const [userApps, setUserApps] = useState<AppSchema[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // アプリスキーマデータをロードする関数
  const fetchAppSchemas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await appSchemaRepository.getAll();
      setUserApps(data);
    } catch (err) {
      console.error("Error fetching app schemas:", err);
      setError("アプリスキーマの読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  // コンポーネントマウント時にアプリスキーマをロード
  useEffect(() => {
    fetchAppSchemas();
  }, []);

  // ドロワーを開いたとき、現在のパスに合わせてサブメニューを自動開閉
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.path && location.pathname.startsWith(item.path)) {
        setOpenSubMenus((prev) => ({ ...prev, [item.path || item.text]: true }));
      }
    });
  }, [location.pathname]); // location.pathname が変わるたびに実行
  // ローディング中とエラー表示
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          アプリスキーマデータを読み込み中...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: "20px", textAlign: "center", color: "red" }}>
        <Typography variant="body1">エラー: {error}</Typography>
        <Button onClick={fetchAppSchemas} variant="contained">
          再試行
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Toolbar sx={{ justifyContent: "flex-end" }}>
        <IconButton onClick={onDrawerClose}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />

      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            {item.children ? (
              <>
                <ListItemButton
                  onClick={() => handleSubMenuClick(item.path || item.text)}
                  selected={location.pathname.startsWith(item.path || "")}
                >
                  {item.icon && (
                    <ListItemIcon sx={{ minWidth: 34 }}>
                      {/* ★修正: サブメニュー親アイコンのサイズ調整 */}
                      {React.cloneElement(item.icon as React.ReactElement<SvgIconProps>, {
                        fontSize: "small",
                      })}
                    </ListItemIcon>
                  )}
                  <ListItemText primary={item.text} />
                  {openSubMenus[item.path || item.text] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={openSubMenus[item.path || item.text]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.text}
                        component={Link}
                        to={child.path || ""}
                        selected={location.pathname === child.path}
                        sx={{ pl: 4 }}
                        //onClick={onDrawerClose} // サブメニュー項目クリックでドロワーを閉じる
                      >
                        {child.icon && (
                          <ListItemIcon sx={{ minWidth: 34 }}>
                            {React.cloneElement(item.icon as React.ReactElement<SvgIconProps>, {
                              fontSize: "small",
                            })}
                          </ListItemIcon>
                        )}
                        <ListItemText primary={child.text} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItemButton
                component={Link}
                to={item.path || ""}
                selected={location.pathname === item.path}
                //onClick={onDrawerClose} // ルートメニュー項目クリックでドロワーを閉じる
              >
                {item.icon && (
                  <ListItemIcon sx={{ minWidth: 34 }}>
                    {React.cloneElement(item.icon as React.ReactElement<SvgIconProps>, {
                      fontSize: "small",
                    })}
                  </ListItemIcon>
                )}
                <ListItemText primary={item.text} />
              </ListItemButton>
            )}
          </React.Fragment>
        ))}
        {/* ★追加: ユーザーが作成したアプリを動的にメニューに追加 */}
        {userApps.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItemButton
              onClick={() => handleSubMenuClick("/generic-db/data")} // 適当なキー
              selected={location.pathname.startsWith("/generic-db/data")}
            >
              <ListItemIcon sx={{ minWidth: 34 }}>
                <AppsIcon />
              </ListItemIcon>
              <ListItemText primary="マイアプリ" />
              {openSubMenus["/generic-db/data"] ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openSubMenus["/generic-db/data"]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {userApps.map((app) => (
                  <ListItemButton
                    key={app.id}
                    component={Link}
                    to={`/generic-db/data/${app.id}/list`} // 各アプリのデータ一覧へのリンク
                    selected={location.pathname.startsWith(`/generic-db/data/${app.id}`)}
                    sx={{ pl: 4 }}
                    //  onClick={onDrawerClose}
                  >
                    <ListItemText primary={app.name} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </>
        )}
      </List>
    </Box>
  );
};

export default SideMenu;
