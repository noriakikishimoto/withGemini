import React, { FC, ReactNode, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import TopHeader from "./TopHeader.tsx";
import SideMenu from "./SideMenu.tsx";

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Box,
  Divider,
  Button,
  Collapse,
  ListItemIcon,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu"; // メニューアイコン
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"; // 左矢印アイコン (Drawerを閉じる用)
import DescriptionIcon from "@mui/icons-material/Description";
import TableViewIcon from "@mui/icons-material/TableView";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import BarChartIcon from "@mui/icons-material/BarChart";
import LayersIcon from "@mui/icons-material/Layers";

const drawerWidth = 240;

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false); // Drawer (サイドバー) の開閉状態

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* AppBar (ヘッダーバー) */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <TopHeader onMenuOpen={handleDrawerOpen} />
      </AppBar>
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
            backgroundColor: "#e0e0e0",
            pt: (theme) => `${theme.mixins.toolbar.minHeight}px`,
          },
        }}
      >
        <SideMenu onDrawerClose={handleDrawerClose} />
      </Drawer>
      {/* メインコンテンツエリア */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: open ? 0 : `-${drawerWidth}px`,
          //ml: 0,
          transition: "margin-left 0.3s ease-out",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
