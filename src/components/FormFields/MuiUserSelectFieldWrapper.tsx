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
import { useGlobalDataContext } from "../../contexts/GlobalDataContext.tsx";

// Props の型定義
interface MuiUserSelectFieldWrapperProps {
  label: string;
  name: string;
  value: string[]; // 選択されたユーザーID
  onChange: (value: string[]) => void;
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
  const { allUsers } = useGlobalDataContext();

  // モーダル表示/非表示のステート
  const [isModalOpen, setIsModalOpen] = useState(false);
  // モーダル内の検索キーワード
  const [searchTerm, setSearchTerm] = useState("");
  // モーダル内で一時的に選択中のユーザーID
  const [tempSelectedUserIds, setTempSelectedUserIds] = useState<string[]>([]);

  // 現在の value (ユーザーID) に対応するユーザー表示名
  const selectedUserDisplayNames = useMemo(() => {
    if (!value || value.length === 0 || !allUsers || allUsers.length === 0) return "";
    const selectedUsers = allUsers.filter((user) => value.includes(user.id));
    return selectedUsers.map((user) => user.displayName || user.username).join(", ");
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
    // ★変更: 現在の value を一時選択状態にセット
    setTempSelectedUserIds(value ? [...value] : []);
  };

  // モーダルを閉じるハンドラ
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // ユーザー選択ハンドラ (モーダル内)
  // ★変更: ユーザー選択ハンドラ (モーダル内) - 複数選択トグル
  const handleUserSelect = (user: User) => {
    setTempSelectedUserIds((prevSelectedIds) => {
      if (prevSelectedIds.includes(user.id)) {
        // 既に選択されていれば削除
        return prevSelectedIds.filter((id) => id !== user.id);
      } else {
        // 選択されていなければ追加
        return [...prevSelectedIds, user.id];
      }
    });
  };

  // モーダル内で「選択」ボタンを押したときのハンドラ
  const handleConfirmSelect = () => {
    onChange(tempSelectedUserIds); // 親に選択されたIDを通知
    handleCloseModal();
  };

  // テキストフィールドの値をクリアするハンドラ
  const handleClear = () => {
    onChange([]); // 親のステートを空の配列に更新
    setTempSelectedUserIds([]); // モーダル内の一時選択状態もクリア
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
        value={selectedUserDisplayNames} // 表示名を表示
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
              {value && value.length > 0 && !disabled && (
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
                  selected={tempSelectedUserIds.includes(user.id)}
                >
                  <ListItemText
                    primary={`${user.displayName} (${user.username})`}
                    secondary={user.email}
                  />
                  {tempSelectedUserIds.includes(user.id) && <CheckIcon color="primary" />}
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
            disabled={!tempSelectedUserIds}
          >
            選択
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

MuiUserSelectFieldWrapper.getInitialValue = () => [];
export default MuiUserSelectFieldWrapper;
