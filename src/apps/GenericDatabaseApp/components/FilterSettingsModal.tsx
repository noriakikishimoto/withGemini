import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
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
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import MuiCheckboxWrapper from "../../../components/FormFields/MuiCheckboxWrapper.tsx"; // DynamicForm が必要なので
import MuiDatePickerWrapper from "../../../components/FormFields/MuiDatePickerWrapper.tsx"; // DynamicForm が必要なので
import MuiSelectFieldWrapper from "../../../components/FormFields/MuiSelectFieldWrapper.tsx"; // DynamicForm が必要なので
import MuiTextFieldWrapper from "../../../components/FormFields/MuiTextFieldWrapper.tsx"; // DynamicForm が必要なので
import { FilterCondition, FilterOperator, FormField } from "../../../types/interfaces";
import { getFieldComponentByType } from "../utils/fieldComponentMapper"; // fieldComponentMapper も使用
import { getFilterConditionValueDisplay } from "../utils/filterOperatorLabels.ts";
import { getFieldLabelByName } from "../utils/fieldLabelConverter.ts";

interface FilterSettingsModalProps<T extends object> {
  open: boolean;
  onClose: () => void;
  fields: FormField<T, any>[]; // 親から渡されるフィールド定義 (フィルタ対象選択用)
  currentFilterConditions: FilterCondition<T>[]; // 現在設定されているフィルタ条件の配列
  onSave: (newFilterConditions: FilterCondition<T>[]) => void; // フィルタ条件が保存されたときに通知するコールバック
}
function FilterSettingsModal<T extends object>({
  // GenericRecord を使用
  open,
  onClose,
  fields,
  currentFilterConditions,
  onSave,
}: FilterSettingsModalProps<T>) {
  const [newFilterField, setNewFilterField] = useState<keyof T | undefined>(undefined);
  const [newFilterOperator, setNewFilterOperator] = useState<FilterOperator>("eq");
  const [newFilterValue, setNewFilterValue] = useState<any>(undefined);
  const [editingFilterConditions, setEditingFilterConditions] =
    useState<FilterCondition<T>[]>(currentFilterConditions);

  // モーダルが開かれたときに、現在のフィルタ条件を編集用ステートにコピー
  useEffect(() => {
    setEditingFilterConditions(currentFilterConditions);
    setNewFilterField(undefined);
    setNewFilterOperator("eq");
    setNewFilterValue(undefined);
  }, [open, currentFilterConditions]);

  // 選択されたフィールドのタイプを取得
  const selectedFieldType = useMemo(() => {
    return fields.find((f) => f.name === newFilterField)?.type;
  }, [newFilterField, fields]);

  // オペレーターの選択肢を動的に生成
  const operatorOptions: { value: FilterOperator; label: string }[] = useMemo(() => {
    switch (selectedFieldType) {
      case "text":
      case "textarea":
      case "email":
      case "lookup": // ルックアップもテキストベースの検索
      case "user_select":
        return [
          { value: "eq", label: "と等しい" },
          { value: "ne", label: "と等しくない" },
          { value: "contains", label: "を含む" },
          { value: "not_contains", label: "を含まない" },
          { value: "starts_with", label: "で始まる" },
          { value: "ends_with", label: "で終わる" },
        ];
      case "number":
      case "date": // 日付も比較演算子が使える
        return [
          { value: "eq", label: "と等しい" },
          { value: "ne", label: "と等しくない" },
          { value: "gt", label: "より大きい" },
          { value: "lt", label: "より小さい" },
          { value: "ge", label: "以上" },
          { value: "le", label: "以下" },
        ];
      case "checkbox":
        return [{ value: "eq", label: "と等しい (チェックあり/なし)" }];
      case "select":
      case "radio":
        return [
          { value: "eq", label: "と等しい" },
          { value: "ne", label: "と等しくない" },
        ];
      default:
        return [];
    }
  }, [selectedFieldType]);

  // フィルタ条件をモーダルで追加するハンドラ
  const handleAddFilterCondition = () => {
    if (newFilterField && newFilterOperator !== undefined && newFilterValue !== undefined) {
      // 既存の条件に同じフィールドとオペレーターがあるかチェック (更新)
      const existingIndex = editingFilterConditions.findIndex(
        (cond) => cond.field === newFilterField && cond.operator === newFilterOperator
      );
      let updatedConditions = [...editingFilterConditions];

      if (existingIndex !== -1) {
        updatedConditions[existingIndex] = {
          field: newFilterField,
          operator: newFilterOperator,
          value: newFilterValue,
        };
      } else {
        updatedConditions.push({
          field: newFilterField,
          operator: newFilterOperator,
          value: newFilterValue,
        });
      }
      setEditingFilterConditions(updatedConditions);
      setNewFilterField(undefined);
      setNewFilterOperator("eq");
      setNewFilterValue(undefined);
    }
  };

  // モーダルでフィルタ条件を削除するハンドラ
  const handleRemoveFilterCondition = (index: number) => {
    const updatedConditions = editingFilterConditions.filter((_, i) => i !== index);
    setEditingFilterConditions(updatedConditions);
  };

  // ソート設定を適用して保存するハンドラ
  const handleSaveFilterSettings = () => {
    onSave(editingFilterConditions);
    onClose();
  };

  // フィルタ条件を全てクリアするハンドラ
  const handleClearAllFilterConditions = () => {
    setEditingFilterConditions([]);
  };

  // フィールドタイプに応じた入力コンポーネントをレンダリング
  const renderFilterValueInput = () => {
    const fieldDef = fields.find((f) => f.name === newFilterField);
    if (!fieldDef) return <TextField size="small" label="値" disabled />;

    const fieldComponent = getFieldComponentByType(fieldDef.type); // type からコンポーネントを取得
    const initialVal = fieldDef.initialValue ?? fieldComponent.getInitialValue();

    // 各MUIラッパーが期待する Props に合わせて調整
    switch (fieldDef.type) {
      case "text":
      case "textarea":
      case "email":
      case "number": // TextFieldWrapper で数値も扱うため
      case "lookup": // ルックアップもテキスト入力
      case "user_select":
        return (
          <MuiTextFieldWrapper
            label="値"
            name="filterValue"
            value={String(newFilterValue ?? initialVal ?? "")}
            onChange={(val) => setNewFilterValue(val)}
            //size="small"
            type={fieldDef.type === "number" ? "number" : "text"}
          />
        );
      case "date":
        return (
          <MuiDatePickerWrapper
            label="値"
            name="filterValue"
            value={(newFilterValue as string | null) ?? (initialVal as string | null) ?? null}
            onChange={(val) => setNewFilterValue(val)}
            //size="small"
          />
        );
      case "checkbox":
        return (
          <MuiCheckboxWrapper
            label="チェック状態"
            name="filterValue"
            checked={!!(newFilterValue ?? initialVal ?? false)}
            onChange={(val) => setNewFilterValue(val)}
            //size="small"
          />
        );
      case "select":
      case "radio":
        return (
          <MuiSelectFieldWrapper
            label="値"
            name="filterValue"
            value={String(newFilterValue ?? initialVal ?? "")}
            onChange={(val) => setNewFilterValue(val)}
            options={
              typeof fieldDef.options === "string"
                ? fieldDef.options.split(",").map((s) => ({ value: s.trim(), label: s.trim() }))
                : Array.isArray(fieldDef.options)
                  ? fieldDef.options
                  : []
            }
            //size="small"
          />
        );
      default:
        return <TextField size="small" label="値" disabled />;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      {" "}
      {/* maxWidth を md に */}
      <DialogTitle>絞り込み設定</DialogTitle>
      <DialogContent>
        {/* フィルタ条件追加フォーム */}
        <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "center" }}>
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel>フィールド</InputLabel>
            <Select
              value={newFilterField}
              label="フィールド"
              onChange={(e) => {
                setNewFilterField(e.target.value as keyof T);
                // フィールドが変わったらオペレーターと値をリセット
                setNewFilterOperator("eq");
                setNewFilterValue(undefined);
              }}
            >
              <MenuItem value="id">ID</MenuItem>
              {fields.map((field) => (
                <MenuItem key={field.name as string} value={field.name as string}>
                  {field.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 100 }} size="small">
            <InputLabel>演算子</InputLabel>
            <Select
              value={newFilterOperator}
              label="演算子"
              onChange={(e) => setNewFilterOperator(e.target.value as FilterOperator)}
            >
              {operatorOptions.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1, minWidth: 150 }}>
            {" "}
            {/* 値の入力フィールドが柔軟に幅を取るように */}
            {renderFilterValueInput()}
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddFilterCondition}>
            追加
          </Button>
        </Box>

        {/* 現在のフィルタ条件リスト */}
        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          設定済み絞り込み条件:
        </Typography>
        <List dense>
          {editingFilterConditions.length === 0 ? (
            <ListItem>
              <ListItemText primary="なし" />
            </ListItem>
          ) : (
            editingFilterConditions.map((condition, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${getFilterConditionValueDisplay(getFieldLabelByName(condition.field, fields), condition.operator, condition.value)}`}
                />
                <ListItemSecondaryAction>
                  <IconButton size="small" edge="end" onClick={() => handleRemoveFilterCondition(index)}>
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
        <Button onClick={handleClearAllFilterConditions} color="error">
          全クリア
        </Button>
        <Button onClick={handleSaveFilterSettings} variant="contained" color="primary">
          適用
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FilterSettingsModal;
