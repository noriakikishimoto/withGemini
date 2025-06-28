import React, { FC } from "react";
import { Link } from "react-router-dom";
import { Box, Typography, Button, IconButton, Toolbar } from "@mui/material"; // MUIコンポーネントをインポート
import MenuIcon from "@mui/icons-material/Menu"; // メニューアイコン
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import { useUserContext } from "../contexts/UserContext";
import { Bolt } from "@mui/icons-material";

interface TopHeaderProps {
  onMenuOpen: () => void; // Drawerを開くためのコールバック
  onMenuClose: () => void; // Drawerを閉じるためのコールバック
  open: boolean;
  drawerWidth: number;
}

const TopHeader: FC<TopHeaderProps> = ({ onMenuOpen, onMenuClose, open, drawerWidth }) => {
  const { currentUser, logout } = useUserContext();
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
      <Typography variant="h5" noWrap component="div" sx={{ flexGrow: 1, fontWeight: "bold" }}>
        LoGoラボラトリー
      </Typography>
      {/* グローバルメニュー (右寄せ) */}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {currentUser ? (
          <>
            <Typography variant="body1" color="secondary" sx={{ mr: 1 }}>
              {currentUser.displayName || currentUser.username}
            </Typography>
            <IconButton color="secondary" onClick={logout}>
              <AccountCircleIcon /> {/* ユーザーアイコン */}
            </IconButton>
          </>
        ) : (
          <>
            <Typography variant="body1" color="inherit" sx={{ mr: 1 }}>
              ゲスト
            </Typography>
            <Button color="inherit" component={Link} to="/generic-db/users" size="small">
              ログイン
            </Button>
          </>
        )}
      </Box>
    </Toolbar>
  );
};

export default TopHeader;
