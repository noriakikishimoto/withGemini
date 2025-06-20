import { Box, Button, Typography } from "@mui/material"; // MUIコンポーネントをインポート
import { FormEvent, useEffect, useState } from "react";

import { CommonFormFieldComponent, FormField } from "../types/interfaces";
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

  return (
    <Box sx={{ flex: 1, paddingRight: "20px", borderRight: "1px solid #eee" }}>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        {formTitle}
      </Typography>
      <form onSubmit={handleSubmit}>
        {/* ★修正: fields.map の中身を FormFieldRenderer に置き換える */}
        {fields.map((field) => (
          <FormFieldRenderer<T> field={field} formData={formData} handleChange={handleChange} />
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
