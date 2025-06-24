import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { FC, useEffect, useState } from "react";

import { customViewRepository } from "../../../repositories/customViewRepository";
import {
  CustomView,
  FilterCondition,
  FormField,
  GenericRecord,
  SortCondition,
} from "../../../types/interfaces";
import {
  getDisplayFieldsDisplay,
  getFilterConditionsDisplay,
  getSortConditionsDisplay,
} from "../utils/filterOperatorLabels"; // ヘルパー関数をインポート

interface SaveViewModalProps<T extends object> {
  open: boolean;
  onClose: () => void;
  appId: string; // 現在のアプリID
  customViews: CustomView<T>[]; // 既存のカスタムビューのリスト
  filterConditions: FilterCondition<T>[]; // 現在のフィルタリング条件
  sortConditions: SortCondition<T>[]; // 現在のソート条件
  selectedDisplayFields: (keyof T)[]; // 現在の表示列の選択状況
  onSaveSuccess: () => void; // ビューの保存が成功したときに、親に通知するためのコールバック

  // 親から渡されるビューの編集モード関連
  mode: "create" | "edit"; // モーダルのモード
  viewToEditId?: string | null; // 編集モードの場合のビューID

  allFields: FormField<T, any>[]; // フィルタリング条件やソート条件の表示用に、アプリの全フィールド定義
}

const SaveViewModal: FC<SaveViewModalProps<GenericRecord>> = ({
  open,
  onClose,
  appId,
  customViews,
  filterConditions,
  sortConditions,
  selectedDisplayFields,
  onSaveSuccess,
  mode, // 'create' or 'edit'
  viewToEditId, // editingViewId に相当
  allFields, // 全フィールド定義
}) => {
  const [newViewName, setNewViewName] = useState(""); // 新しいビューの名前
  const [editingViewId, setEditingViewId] = useState<string | null>(null);

  // モーダルが開かれたときに、初期値をセット
  useEffect(() => {
    if (open) {
      if (mode === "create") {
        setNewViewName("");
        setEditingViewId(null);
      } else if (mode === "edit" && viewToEditId) {
        setEditingViewId(viewToEditId);
        const view = customViews.find((v) => v.id === viewToEditId);
        if (view) {
          setNewViewName(view.name);
        }
      }
    }
  }, [open, mode, viewToEditId, customViews]);

  const handleSaveView = async () => {
    if (!newViewName.trim()) {
      alert("ビュー名を入力してください。");
      return;
    }
    if (!appId) {
      alert("アプリIDが見つかりません。");
      return;
    }

    const viewToSave: Omit<CustomView<GenericRecord>, "id"> = {
      name: newViewName.trim(),
      appId: appId,
      filterConditions: filterConditions,
      sortConditions: sortConditions,
      displayFields: selectedDisplayFields,
    };

    try {
      if (mode === "edit" && editingViewId) {
        // ★修正: saveViewMode と editingViewId で判定
        await customViewRepository.update(editingViewId, viewToSave, appId); // 上書き保存
        alert(`ビュー「${newViewName.trim()}」が更新されました！`);
      } else {
        // 'create' モード
        await customViewRepository.create(viewToSave, appId); // 新規作成
        alert(`ビュー「${newViewName.trim()}」が保存されました！`);
      }
      onSaveSuccess(); // 親に通知(要fetch)
      onClose();
    } catch (err) {
      console.error("Error saving view:", err);
      alert("ビューの保存に失敗しました。");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === "create" ? "新規ビューを保存" : "ビューを編集・上書き"}</DialogTitle>{" "}
      <DialogContent>
        {mode === "edit" &&
          customViews.length > 0 && ( // 編集モードの場合のみ既存ビュー選択を表示（今後直す）
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel>編集するビュー</InputLabel>
              <Select value={editingViewId || ""} label="編集するビュー" readOnly={true}>
                {customViews.map((view) => (
                  <MenuItem value={view.id}>{view.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

        <TextField
          autoFocus
          margin="dense"
          label="ビュー名"
          type="text"
          fullWidth
          variant="standard"
          value={newViewName}
          onChange={(e) => setNewViewName(e.target.value)}
        />

        <Typography variant="body2" sx={{ mb: 2 }}>
          ソート条件: {getSortConditionsDisplay(sortConditions, allFields)}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          フィルター条件:{getFilterConditionsDisplay(filterConditions, allFields)}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          表示列設定:{getDisplayFieldsDisplay(selectedDisplayFields, allFields)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSaveView}>{mode === "create" ? "保存" : "上書き保存"} </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveViewModal;
