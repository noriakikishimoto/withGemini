import React, { FC } from "react";
import { Link } from "react-router-dom";
import { Box, Typography, Button, IconButton, Toolbar } from "@mui/material"; // MUIコンポーネントをインポート
import MenuIcon from "@mui/icons-material/Menu"; // メニューアイコン

interface TopHeaderProps {
  onMenuOpen: () => void; // Drawerを開くためのコールバック
  onMenuClose: () => void; // Drawerを閉じるためのコールバック
  open: boolean;
  drawerWidth: number;
}

const TopHeader: FC<TopHeaderProps> = ({ onMenuOpen, onMenuClose, open, drawerWidth }) => {
  return (
    <Toolbar
      sx={{
        ml: open ? `${drawerWidth}px` : 0,
        transition: "margin-left 0.3s ease-out",
      }}
    >
      <IconButton
        color="inherit"
        aria-label="open drawer"
        onClick={open ? onMenuClose : onMenuOpen} // ★Drawerを開くハンドラをPropsとして受け取る
        edge="start"
        // sx={{ mr: 2, ...(open && { display: 'none' }) }} // open状態はLayout側で管理するため削除
      >
        <MenuIcon />
      </IconButton>
      <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
        My Application (POC)
      </Typography>
      {/* グローバルメニュー (右寄せ) */}
      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <Button component={Link} to="/" sx={{ color: "white", mr: 1 }}>
          ホーム
        </Button>
        <Button component={Link} to="/applications/list" sx={{ color: "white", mr: 1 }}>
          申請管理
        </Button>
        <Button component={Link} to="/generic-db/tasks/list" sx={{ color: "white" }}>
          タスク管理
        </Button>
      </Box>
    </Toolbar>
  );
};

export default TopHeader;
