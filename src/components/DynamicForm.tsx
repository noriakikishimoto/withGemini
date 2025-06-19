import React, { FC, useState, useEffect, FormEvent } from "react";
import { Box, Button, Typography } from "@mui/material"; // MUIコンポーネントをインポート

import MuiTextFieldWrapper from "./FormFields/MuiTextFieldWrapper.tsx";
import MuiCheckboxWrapper from "./FormFields/MuiCheckboxWrapper.tsx";
import MuiDatePickerWrapper from "./FormFields/MuiDatePickerWrapper.tsx";
import MuiSelectFieldWrapper from "./FormFields/MuiSelectFieldWrapper.tsx";
import { FormField, CommonFormFieldComponent } from "../types/interfaces";
import MuiRadioGroupWrapper from "./FormFields/MuiRadioGroupWrapper.tsx";

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
      initial[field.name as string] = field.component.getInitialValue();
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
    console.log("通過");
    console.log(("name:" + name.toString + "value:" + value) as string);
    // ★追加: onFieldChange コールバックがあれば呼び出す
    if (onFieldChange) {
      console.log("onchange");
      console.log(("name:" + name.toString + "value:" + value) as string);
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
        {fields.map((field) => (
          <Box key={field.name as string} sx={{ mb: 2 }}>
            {" "}
            {/* 各フィールドのコンテナ */}
            {field.type === "text" ||
            field.type === "textarea" ||
            field.type === "number" ||
            field.type === "email" ? (
              <MuiTextFieldWrapper
                label={field.label}
                name={field.name as string}
                value={
                  formData[field.name]
                    ? (formData[field.name] as string | number).toString()
                    : field.initialValue
                }
                onChange={(val) => handleChange(field.name, field.type === "number" ? Number(val) : val)}
                multiline={field.multiline || field.type === "textarea"}
                rows={field.rows}
                required={field.required}
                type={field.type}
              />
            ) : field.type === "checkbox" ? (
              <MuiCheckboxWrapper
                label={field.label}
                name={field.name as string}
                checked={formData[field.name] ? (formData[field.name] as boolean) : field.initialValue}
                onChange={(val) => handleChange(field.name, val)}
              />
            ) : field.type === "date" ? (
              <MuiDatePickerWrapper
                label={field.label}
                name={field.name as string}
                value={
                  formData[field.name] ? (formData[field.name] as string | null) : field.initialValue
                }
                onChange={(val) => handleChange(field.name, val)}
                required={field.required}
              />
            ) : field.type === "select" ? (
              <MuiSelectFieldWrapper
                label={field.label}
                name={field.name as string}
                value={formData[field.name] ? (formData[field.name] as string) : field.initialValue}
                onChange={(val) => handleChange(field.name, val)}
                options={
                  typeof field.options === "string" && field.options // 文字列の場合
                    ? field.options.split(",").map((s: string) => ({ value: s.trim(), label: s.trim() }))
                    : Array.isArray(field.options)
                      ? field.options
                      : [] // 配列の場合、またはなければ空配列
                }
                required={field.required}
              />
            ) : field.type === "radio" ? ( // ★追加: radio タイプ
              <MuiRadioGroupWrapper
                label={field.label}
                name={field.name as string}
                value={formData[field.name] ? (formData[field.name] as string) : field.initialValue}
                onChange={(val) => handleChange(field.name, val)}
                options={
                  typeof field.options === "string" && field.options // 文字列の場合
                    ? field.options.split(",").map((s: string) => ({ value: s.trim(), label: s.trim() }))
                    : Array.isArray(field.options)
                      ? field.options
                      : [] // 配列の場合、またはなければ空配列
                }
                required={field.required}
              />
            ) : null}
          </Box>
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
