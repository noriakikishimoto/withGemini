import React, { FC, forwardRef, ReactNode, useEffect, useRef, useState } from "react";
import SideMenu from "./SideMenu.tsx";
import TopHeader from "./TopHeader.tsx";

import { AppBar, Box, Drawer, Slide, useScrollTrigger, useTheme } from "@mui/material";

import { DrawerContext } from "../contexts/DrawerContext";

const drawerWidth = 200;

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(true); // Drawer (サイドバー) の開閉状態
  const mainContentRef = useRef<HTMLElement>(null);

  const trigger = useScrollTrigger({
    target: mainContentRef.current || undefined, // main コンテンツのスクロールを監視
    disableHysteresis: true,
    threshold: 0,
  });

  const theme = useTheme(); // テーマから Toolbar の高さを取得
  const appBarHeight = theme.mixins.toolbar.minHeight; // 通常 64px

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* AppBar (ヘッダーバー) */}

      <Slide appear={false} direction="down" in={!trigger}>
        <AppBar
          position="fixed"
          elevation={1}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer - 1,
            backgroundColor: "#EDEDED",
            color: "#73879C",
          }}
        >
          <TopHeader
            onMenuOpen={handleDrawerOpen}
            open={open}
            drawerWidth={drawerWidth}
            onMenuClose={handleDrawerClose}
          />
        </AppBar>
      </Slide>
      {/* Drawer (サイドバー) */}

      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#2A3F54",
            color: "#ffffff",
            //  pt: (theme) => `${theme.mixins.toolbar.minHeight}px`,
          },
        }}
      >
        <SideMenu onDrawerClose={handleDrawerClose} />
      </Drawer>

      {/* メインコンテンツエリア */}

      <DrawerContext.Provider value={{ drawerOpen: open }}>
        <Box
          component="main"
          ref={mainContentRef}
          sx={{
            flexGrow: 1,
            p: 0,
            //mt: 8,
            mt: trigger ? 0 : `${appBarHeight}px`, // trigger が true なら AppBar は非表示なので mt:0

            ml: open ? 0 : `-${drawerWidth}px`,
            transition: "margin-left 0.3s ease-out",
            //height: "100vh",
            //  mt: 10,
            //height: "calc(100vh - 80px)", // ★修正: ビューポートの残りの高さを確保
            height: `calc(100vh - ${trigger ? 0 : appBarHeight}px)`,
            overflowY: "auto", // ★修正: 縦スクロールはここで管理
            overflowX: "auto", // ★追加: 横スクロールもここで明示的に管理
          }}
        >
          {children}
        </Box>
      </DrawerContext.Provider>
    </Box>
  );
};

export default Layout;
