import {
  Add as AddIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

import { FormField, SortCondition, SortDirection } from "../../../types/interfaces";

interface SortSettingsModalProps<T extends object> {
  open: boolean; // モーダルの開閉状態
  onClose: () => void; // モーダルを閉じるためのコールバック
  fields: FormField<T, any>[]; // 親から渡されるフィールド定義 (ソート対象選択用)
  currentSortConditions: SortCondition<T>[]; // 現在設定されているソート条件の配列
  onSave: (newSortConditions: SortCondition<T>[]) => void; // ソート条件が保存されたときに通知するコールバック
}

function SortSettingsModal<T extends object>({
  open,
  onClose,
  fields,
  currentSortConditions,
  onSave,
}: SortSettingsModalProps<T>) {
  const [newSortField, setNewSortField] = useState<keyof T | undefined>(undefined);
  const [newSortDirection, setNewSortDirection] = useState<SortDirection>("asc");
  const [editingSortConditions, setEditingSortConditions] =
    useState<SortCondition<T>[]>(currentSortConditions);

  // モーダルが開かれたときに、現在のソート条件を編集用ステートにコピー
  React.useEffect(() => {
    setEditingSortConditions(currentSortConditions);
    setNewSortField(undefined); // フィールド選択をリセット
    setNewSortDirection("asc"); // 方向をリセット
  }, [open, currentSortConditions]);

  // ソート条件をモーダルで追加するハンドラ
  const handleAddSortCondition = () => {
    if (newSortField && newSortDirection) {
      // 既に同じフィールドが存在するかチェック (既存のものを更新)
      const existingIndex = editingSortConditions.findIndex((cond) => cond.field === newSortField);
      let updatedConditions = [...editingSortConditions];

      if (existingIndex !== -1) {
        updatedConditions[existingIndex] = { field: newSortField, direction: newSortDirection };
      } else {
        updatedConditions.push({ field: newSortField, direction: newSortDirection });
      }
      setEditingSortConditions(updatedConditions);
      setNewSortField(undefined);
      setNewSortDirection("asc");
    }
  };

  // モーダルでソート条件を削除するハンドラ
  const handleRemoveSortCondition = (index: number) => {
    const updatedConditions = editingSortConditions.filter((_, i) => i !== index);
    setEditingSortConditions(updatedConditions);
  };

  // ソート条件をモーダルで上下に移動するハンドラ
  const handleMoveSortCondition = (index: number, direction: "up" | "down") => {
    if (editingSortConditions.length < 2) return;
    const updatedConditions = [...editingSortConditions];
    const itemToMove = updatedConditions[index];

    if (direction === "up") {
      if (index === 0) return;
      updatedConditions.splice(index, 1); // 現在の場所から削除
      updatedConditions.splice(index - 1, 0, itemToMove); // 1つ上の位置に挿入
    } else {
      // 'down'
      if (index === updatedConditions.length - 1) return;
      updatedConditions.splice(index, 1); // 現在の場所から削除
      updatedConditions.splice(index + 1, 0, itemToMove); // 1つ下の位置に挿入
    }
    setEditingSortConditions(updatedConditions);
  };

  // ソート設定を適用して保存するハンドラ
  const handleSaveSortSettings = () => {
    onSave(editingSortConditions); // 親に更新されたソート条件を通知
    onClose(); // モーダルを閉じる
  };

  // ソート条件を全てクリアするハンドラ
  const handleClearAllSortConditions = () => {
    setEditingSortConditions([]);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>ソート設定</DialogTitle>
      <DialogContent>
        {/* ソート条件追加フォーム */}
        <Box sx={{ display: "flex", gap: 1, mb: 2, pt: 2 }}>
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>フィールド</InputLabel>
            <Select
              value={newSortField}
              label="フィールド"
              onChange={(e) => setNewSortField(e.target.value as keyof T)}
            >
              {fields.map((field) => (
                <MenuItem key={field.name as string} value={field.name as string}>
                  {field.label}
                </MenuItem>
              ))}
              {/* IDフィールドもソート対象に含める */}
              <MenuItem value="id">ID</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 100 }} size="small">
            <InputLabel>方向</InputLabel>
            <Select
              value={newSortDirection}
              label="方向"
              onChange={(e) => setNewSortDirection(e.target.value as SortDirection)}
            >
              <MenuItem value="asc">昇順</MenuItem>
              <MenuItem value="desc">降順</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddSortCondition}>
            追加
          </Button>
        </Box>

        {/* 現在のソート条件リスト */}
        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          設定済みソート条件:
        </Typography>
        <List dense>
          {editingSortConditions.length === 0 ? (
            <ListItem>
              <ListItemText primary="なし" />
            </ListItem>
          ) : (
            editingSortConditions.map((condition, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${index + 1}. ${String(
                    fields.find((f) => f.name === condition.field)?.label || condition.field
                  )} (${condition.direction === "asc" ? "昇順" : "降順"})`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={() => handleMoveSortCondition(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleMoveSortCondition(index, "down")}
                    disabled={index === editingSortConditions.length - 1}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" edge="end" onClick={() => handleRemoveSortCondition(index)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          閉じる
        </Button>
        {/* クリアボタンはオプションで追加可能 */}
        <Button onClick={() => handleClearAllSortConditions} color="error">
          全クリア
        </Button>
        <Button onClick={handleSaveSortSettings} variant="contained" color="primary">
          適用
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SortSettingsModal;
