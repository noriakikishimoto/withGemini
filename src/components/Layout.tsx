import React, { FC, ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import SideMenu from "./SideMenu.tsx";
import TopHeader from "./TopHeader.tsx";

import { AppBar, Box, Drawer, Slide, useScrollTrigger } from "@mui/material";

import { DrawerContext } from "../contexts/DrawerContext";
import { useUserContext } from "../contexts/UserContext.tsx";

const drawerWidth = 200;

interface LayoutProps {
  children: ReactNode;
}
interface Props {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
  children?: React.ReactElement<unknown>;
}

function HideOnScroll(props: Props) {
  const { children, window } = props;
  // Note that you normally won't need to set the window ref as useScrollTrigger
  // will default to window.
  // This is only being set here because the demo is in an iframe.
  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children ?? <div />}
    </Slide>
  );
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false); // Drawer (サイドバー) の開閉状態
  //const { currentUser } = useUserContext();
  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* AppBar (ヘッダーバー) */}
      <HideOnScroll>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer - 1 }}>
          <TopHeader
            onMenuOpen={handleDrawerOpen}
            open={open}
            drawerWidth={drawerWidth}
            onMenuClose={handleDrawerClose}
          />
        </AppBar>
      </HideOnScroll>
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
            backgroundColor: "#ffffff",
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
          sx={{
            flexGrow: 1,
            p: 0,
            mt: 8,
            ml: open ? 0 : `-${drawerWidth}px`,
            transition: "margin-left 0.3s ease-out",
            //height: "100vh",
            //  mt: 10,
            height: "calc(100vh - 80px)", // ★修正: ビューポートの残りの高さを確保
            //  overflowY: "auto", // ★追加: メインコンテンツ領域をスクロール可能にする
          }}
        >
          {children}
        </Box>
      </DrawerContext.Provider>
    </Box>
  );
};

export default Layout;
