import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import { useEffect, useState } from "react";

// 共通の型定義をインポート
import { FormField } from "../../../types/interfaces";

interface DisplayFieldsModalProps<T extends object> {
  open: boolean; // モーダルの開閉状態
  onClose: () => void; // モーダルを閉じるためのコールバック
  fields: FormField<T, any>[]; // 親から渡される全てのフィールド定義 (表示対象選択用)
  selectedDisplayFields: (keyof T)[]; // 現在選択中の表示列の配列
  // onToggleDisplayField: (fieldName: keyof T) => void; // チェックボックスがクリックされたときに親に通知するコールバック
  onSave: (newDisplayFields: (keyof T)[]) => void; // 変更を適用して保存するためのコールバック
}

function DisplayFieldsModal<T extends object>({
  open,
  onClose,
  fields,
  selectedDisplayFields,
  onSave,
}: DisplayFieldsModalProps<T>) {
  // モーダル内で編集中の選択状態を保持 (親の selectedDisplayFields とは独立)
  const [editingDisplayFields, setEditingDisplayFields] = useState<(keyof T)[]>([]);

  // モーダルが開かれたとき、または親の selectedDisplayFields が変更されたときに、編集用ステートを更新
  useEffect(() => {
    if (open) {
      setEditingDisplayFields(selectedDisplayFields);
    }
  }, [open, selectedDisplayFields]);

  // モーダル内のチェックボックスのトグルハンドラ
  const handleInternalToggle = (fieldName: keyof T) => {
    setEditingDisplayFields((prev) => {
      if (prev.includes(fieldName)) {
        return prev.filter((f) => f !== fieldName);
      } else {
        return [...prev, fieldName];
      }
    });
  };

  // 適用ボタンクリック時
  const handleApply = () => {
    onSave(editingDisplayFields); // 親に更新された表示フィールドを通知
    onClose();
  };

  // 全クリアボタンクリック時
  const handleClearAll = () => {
    setEditingDisplayFields([]);
  };

  // 全選択ボタンクリック時
  const handleSelectAll = () => {
    setEditingDisplayFields(fields.map((f) => f.name as keyof T));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>表示列設定</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 2 }}>
          <Button variant="outlined" size="small" onClick={handleSelectAll}>
            全選択
          </Button>
          <Button variant="outlined" size="small" onClick={handleClearAll}>
            全クリア
          </Button>
        </Box>
        <FormGroup>
          {fields.map((field) => (
            <FormControlLabel
              key={field.name as string}
              control={
                <Checkbox
                  checked={editingDisplayFields.includes(field.name as keyof T)}
                  onChange={() => handleInternalToggle(field.name as keyof T)}
                />
              }
              label={field.label}
            />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          キャンセル
        </Button>
        <Button onClick={handleApply} variant="contained" color="primary">
          適用
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DisplayFieldsModal;
