import React, { FC, useState, useMemo, useEffect } from "react";
import {
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  CircularProgress,
  Box,
  Typography,
  ListItemButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";

// 共通の型定義をインポート
import { User, CommonFormFieldComponent } from "../../types/interfaces";
import { userRepository } from "../../repositories/userRepository.ts";

// Props の型定義
interface MuiUserSelectFieldWrapperProps {
  label: string;
  name: string;
  value: string; // 選択されたユーザーID
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean; // 読み取り専用の場合
  // ここで allUsers は直接受け取らず、useUserContext から取得する
}

const MuiUserSelectFieldWrapper: CommonFormFieldComponent<MuiUserSelectFieldWrapperProps> = ({
  label,
  name,
  value,
  onChange,
  required = false,
  disabled = false,
}) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await userRepository.getAll();
        setAllUsers(users);
      } catch (err) {
        console.error("Error loading users for display:", err);
      }
    };
    loadUsers();
  }, []);

  // モーダル表示/非表示のステート
  const [isModalOpen, setIsModalOpen] = useState(false);
  // モーダル内の検索キーワード
  const [searchTerm, setSearchTerm] = useState("");
  // モーダル内で一時的に選択中のユーザーID
  const [tempSelectedUserId, setTempSelectedUserId] = useState<string | null>(null);

  // 現在の value (ユーザーID) に対応するユーザー表示名
  const selectedUserDisplayName = useMemo(() => {
    if (!value || !allUsers) return "";
    const user = allUsers.find((u) => u.id === value);
    return user ? user.displayName || user.username : value;
  }, [value, allUsers]);

  // モーダル内の表示ユーザーリスト (検索フィルタリング)
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return allUsers.filter(
      (user) =>
        user.displayName.toLowerCase().includes(lowercasedSearchTerm) ||
        user.username.toLowerCase().includes(lowercasedSearchTerm) ||
        user.email.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [allUsers, searchTerm]);

  // モーダルを開くハンドラ
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setSearchTerm(""); // モーダルを開くときに検索キーワードをリセット
    setTempSelectedUserId(value || null); // 現在の値を一時選択状態にセット
  };

  // モーダルを閉じるハンドラ
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // ユーザー選択ハンドラ (モーダル内)
  const handleUserSelect = (user: User) => {
    setTempSelectedUserId(user.id);
  };

  // モーダル内で「選択」ボタンを押したときのハンドラ
  const handleConfirmSelect = () => {
    onChange(tempSelectedUserId || ""); // 親に選択されたIDを通知
    handleCloseModal();
  };

  // テキストフィールドの値をクリアするハンドラ
  const handleClear = () => {
    onChange("");
    setTempSelectedUserId(null); // モーダル内の一時選択状態もクリア
  };

  // `getInitialValue` の静的メソッド
  // 通常、ルックアップフィールドの初期値は空文字列
  MuiUserSelectFieldWrapper.getInitialValue = () => "";

  return (
    <>
      <TextField
        fullWidth
        label={label}
        name={name}
        value={selectedUserDisplayName} // 表示名を表示
        required={required}
        disabled={disabled}
        /*
        slotProps={{
          input: {
            readOnly: true,
          },
        }}*/
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              {value &&
                !disabled && ( // 値があり、無効化されていない場合にクリアボタンを表示
                  <IconButton onClick={handleClear} edge="end" size="small">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              <IconButton onClick={handleOpenModal} edge="end" size="small" disabled={disabled}>
                <SearchIcon /> {/* 検索アイコン */}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* ユーザー選択モーダル */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>ユーザーを選択</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="ユーザーを検索"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          <List dense>
            {allUsers && allUsers.length > 0 ? (
              filteredUsers.map((user) => (
                // ★修正: ListItem の代わりに ListItemButton を使用
                <ListItemButton
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  selected={tempSelectedUserId === user.id}
                >
                  <ListItemText
                    primary={`${user.displayName} (${user.username})`}
                    secondary={user.email}
                  />
                  {tempSelectedUserId === user.id && <CheckIcon color="primary" />}
                </ListItemButton>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 2 }}>
                ユーザーが見つかりません。
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">
            キャンセル
          </Button>
          <Button
            onClick={handleConfirmSelect}
            variant="contained"
            color="primary"
            disabled={!tempSelectedUserId}
          >
            選択
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

MuiUserSelectFieldWrapper.getInitialValue = () => "";
export default MuiUserSelectFieldWrapper;
