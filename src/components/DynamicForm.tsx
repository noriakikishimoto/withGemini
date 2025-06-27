import { Box, Button, Grid, Paper, Typography } from "@mui/material"; // MUIコンポーネントをインポート
import { FormEvent, useEffect, useMemo, useState } from "react";

import { CommonFormFieldComponent, FormField, User } from "../types/interfaces";
import FormFieldRenderer from "./FormFields/FormFieldRenderer.tsx";

interface DynamicFormProps<T extends object> {
  fields: FormField<T, CommonFormFieldComponent<any>>[];
  initialData?: T | null;
  onSubmit: (data: T) => void;
  onCancel?: () => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  formTitle?: string;
  // ★追加: フィールドの値が変更されたときに親に通知するコールバック
  onFieldChange?: (fieldName: keyof T, value: any) => void;
  allUsers?: User[];
}

// DynamicForm コンポーネントの定義
// ジェネリクス <T extends object> を使用して、どんなデータオブジェクトでも扱えるようにする
function DynamicForm<T extends object>({
  fields,
  initialData,
  onSubmit,
  onCancel,
  submitButtonText = "保存",
  cancelButtonText = "キャンセル",
  formTitle = "フォーム",
  onFieldChange,
  allUsers,
}: DynamicFormProps<T>) {
  // フォームデータを管理するステート
  // initialDataがない場合は、フィールド定義から初期値を生成
  const [formData, setFormData] = useState<T>(() => {
    if (initialData) {
      return initialData;
    }
    const initial: { [key: string]: any } = {};
    fields.forEach((field) => {
      //initial[field.name as string] = field.component.getInitialValue();
      initial[field.name as string] = field.initialValue
        ? field.initialValue
        : field.component.getInitialValue();
    });
    return initial as T;
  });

  // initialData が変更されたら formData を更新（編集モード切り替え時など）
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // initialData が null/undefined の場合、フォームをリセット
      const initial: { [key: string]: any } = {};
      fields.forEach((field) => {
        initial[field.name as string] = field.component.getInitialValue();
      });
      setFormData(initial as T);
    }
  }, [initialData]); // fields も依存配列に入れることで、フィールド定義が変わった場合も対応

  // 入力フィールドの値が変更されたときのハンドラ
  const handleChange = (name: keyof T, value: any) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value, // 動的なプロパティ名で値を更新
    }));
    if (onFieldChange) {
      onFieldChange(name, value);
    }
  };

  // フォーム送信時のハンドラ
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData); // 親にフォームデータを渡す
  };

  // ★追加: フィールドをグループごとに分類するロジック
  const groupedFields = useMemo(() => {
    const groups: Record<string, FormField<T, CommonFormFieldComponent<any>>[]> = {};
    const defaultGroup = "基本情報"; // グループが指定されていないフィールドのデフォルトグループ

    fields.forEach((field) => {
      const groupName = field.group || defaultGroup; // group プロパティがあればそれを使用、なければデフォルト
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(field);
    });

    // グループ名をソートして順序を安定させる
    const sortedGroupNames = Object.keys(groups).sort((a, b) => {
      // '基本情報' グループを常に先頭にする
      if (a === defaultGroup) return -1;
      if (b === defaultGroup) return 1;
      return a.localeCompare(b); // それ以外はアルファベット順
    });

    return sortedGroupNames.map((groupName) => ({
      name: groupName,
      fields: groups[groupName],
    }));
  }, [fields]); // fields プロップが変更されたら再計算

  return (
    <Box sx={{ flex: 1, paddingRight: "20px", borderRight: "1px solid #eee" }}>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        {formTitle}
      </Typography>
      <form onSubmit={handleSubmit}>
        {/* ★修正: グループごとにフォームフィールドをレンダリング */}
        {groupedFields.map((group) => (
          <Paper key={group.name} sx={{ mt: 2, p: 2 }}>
            {" "}
            {/* 各グループをPaperで囲む */}
            <Typography variant="h6" component="h3" gutterBottom align="left">
              {group.name}
            </Typography>
            <Grid container spacing={2}>
              {" "}
              {/* グループ内のフィールドをGridでレイアウト */}
              {group.fields.map((field) => (
                <Grid
                  key={field.name as string}
                  size={{
                    xs: field.xs || 12,
                    sm: field.sm || field.xs || 12,
                    md: field.md || field.sm || field.xs || 12,
                  }}
                >
                  <FormFieldRenderer<T>
                    field={field}
                    formData={formData}
                    handleChange={handleChange}
                    allUsers={allUsers}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        ))}

        <Box sx={{ mt: 3, mb: 2, textAlign: "center" }}>
          <Button type="submit" variant="contained" color="primary" sx={{ mr: 1 }}>
            {submitButtonText}
          </Button>
          {onCancel && (
            <Button type="button" variant="outlined" color="secondary" onClick={onCancel}>
              {cancelButtonText}
            </Button>
          )}
        </Box>
      </form>
    </Box>
  );
}

export default DynamicForm;
