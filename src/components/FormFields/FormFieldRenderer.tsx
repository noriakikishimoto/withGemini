import React, { FC } from "react";
import { Box, Typography } from "@mui/material";

import MuiTextFieldWrapper from "./MuiTextFieldWrapper.tsx";
import MuiCheckboxWrapper from "./MuiCheckboxWrapper.tsx";
import MuiDatePickerWrapper from "./MuiDatePickerWrapper.tsx";
import MuiSelectFieldWrapper from "./MuiSelectFieldWrapper.tsx";

// 共通の型定義をインポート
import { FormField, CommonFormFieldComponent, GenericRecord, User } from "../../types/interfaces";
import MuiRadioGroupWrapper from "./MuiRadioGroupWrapper.tsx";
import MuiLookupFieldWrapper from "./MuiLookupFieldWrapper.tsx";
import MuiTableFieldWrapper from "./MuiTableFieldWrapper.tsx";

import { Key } from "@mui/icons-material";
import MuiUserSelectFieldWrapper from "./MuiUserSelectFieldWrapper.tsx";

interface FormFieldRendererProps<T extends object> {
  field: FormField<T, CommonFormFieldComponent<any>>;
  formData: Record<string, any>;
  handleChange: (name: keyof T, value: any) => void;
  allUsers?: User[];
}

// FormFieldRenderer コンポーネントの定義
// ジェネリクス <T extends object> を使用して、DynamicForm と同じ T 型を扱う
function FormFieldRenderer<T extends object>({
  field,
  formData,
  handleChange,
  allUsers,
}: FormFieldRendererProps<T>) {
  // field.name は keyof T だが、formData アクセスと handleChange の引数には string が必要
  const fieldNameAsString = field.name as string;
  const currentValue = formData[fieldNameAsString];

  // field.valueFormatter があればそれを使用して値を整形
  const displayValue = field.valueFormatter
    ? field.valueFormatter(currentValue, allUsers) // allUsers も渡す
    : String(currentValue ?? ""); // デフォルトの表示

  // field.options が string の場合に FormFieldSelectOption[] に変換するロジック
  // これは MuiSelectFieldWrapper に渡すため
  const parsedOptions = React.useMemo(() => {
    if (field.type === "select" && typeof field.options === "string") {
      try {
        return (field.options as string)
          .split(",")
          .map((s: string) => ({ value: s.trim(), label: s.trim() }));
      } catch (e) {
        console.error(`Error parsing options string for field '${fieldNameAsString}':`, e);
        return []; // パース失敗時は空配列
      }
    } else if (field.type === "select" && Array.isArray(field.options)) {
      return field.options; // 既に配列の場合はそのまま
    }
    return []; // select 以外、または options がない場合は空配列
  }, [field.options, field.type, fieldNameAsString]); // 依存配列

  if (field.readOnly) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {field.label}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          {displayValue}
        </Typography>
      </Box>
    );
  }

  // 各フィールドタイプに応じたコンポーネントを動的にレンダリング
  switch (field.type) {
    case "text":
    case "textarea":
    case "number":
    case "email":
      return (
        <MuiTextFieldWrapper
          label={field.label}
          name={fieldNameAsString}
          value={displayValue ? (displayValue as string | number).toString() : field.initialValue}
          onChange={(val) => handleChange(field.name, field.type === "number" ? Number(val) : val)}
          multiline={field.multiline || field.type === "textarea"}
          rows={field.rows}
          required={field.required}
          type={field.type}
          readOnly={field.readOnly}
          placeHolder={field.placeHolder}
        />
      );
    case "checkbox":
      return (
        <MuiCheckboxWrapper
          label={field.label}
          name={fieldNameAsString}
          checked={
            formData[fieldNameAsString] ? (formData[fieldNameAsString] as boolean) : field.initialValue
          }
          onChange={(val) => handleChange(field.name, val)}
          readOnly={field.readOnly}
        />
      );
    case "date":
      return (
        <MuiDatePickerWrapper
          label={field.label}
          name={fieldNameAsString}
          value={
            formData[fieldNameAsString]
              ? (formData[fieldNameAsString] as string | null)
              : field.initialValue
          }
          onChange={(val) => handleChange(field.name, val)}
          required={field.required}
          readOnly={field.readOnly}
        />
      );
    case "select":
      return (
        <MuiSelectFieldWrapper
          label={field.label}
          name={fieldNameAsString}
          value={
            formData[fieldNameAsString] ? (formData[fieldNameAsString] as string) : field.initialValue
          }
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
      );
    case "radio":
      return (
        <MuiRadioGroupWrapper
          label={field.label}
          name={fieldNameAsString}
          value={
            formData[fieldNameAsString] ? (formData[fieldNameAsString] as string) : field.initialValue
          }
          onChange={(val) => handleChange(field.name, val)}
          options={
            typeof field.options === "string" && field.options // 文字列の場合
              ? field.options.split(",").map((s: string) => ({ value: s.trim(), label: s.trim() }))
              : Array.isArray(field.options)
                ? field.options
                : [] // 配列の場合、またはなければ空配列
          }
          required={field.required}
          readOnly={field.readOnly}
        />
      );
    case "lookup":
      return (
        <MuiLookupFieldWrapper
          label={field.label}
          name={fieldNameAsString}
          value={
            formData[fieldNameAsString] ? (formData[fieldNameAsString] as string) : field.initialValue
          }
          onChange={(val, selectedRecord) => {
            handleChange(field.name, val);
            if (selectedRecord) {
              for (const key in selectedRecord) {
                // `hasOwnProperty` を使うことで、プロトタイプチェーン上のプロパティを除外できる (推奨)
                if (Object.prototype.hasOwnProperty.call(selectedRecord, key)) {
                  const value = selectedRecord[key]; // キーを使って値にアクセス
                  handleChange(key as keyof T, value);
                }
              }
            }
          }}
          required={field.required}
          lookupAppId={field.lookupAppId || ""}
          lookupKeyField={field.lookupKeyField || ""}
          lookupDisplayFields={field.lookupDisplayFields || ""}
          lookupCopyToFields={field.lookupCopyToFields || ""}
        />
      );
    case "table": // ★追加: table タイプ
      return (
        <MuiTableFieldWrapper
          label={field.label}
          name={fieldNameAsString} // 親フォームの formData のキーとして使う
          value={(formData[fieldNameAsString] as GenericRecord[] | undefined) || []} // テーブルのデータ
          onChange={(val) => handleChange(field.name, val)} // テーブルデータの変更を親に通知
          required={field.required}
          tableFields={field.tableFields || ""} // テーブルの列定義
          tableSourceAppId={field.tableSourceAppId || ""}
          tableFilterField={field.tableFilterField || ""}
          tableFilterValue={field.tableFilterValue || ""}
          parentFormData={formData}
        />
      );
    case "user_select":
      return (
        <MuiUserSelectFieldWrapper
          label={field.label}
          name={fieldNameAsString}
          value={
            formData[fieldNameAsString] ? (formData[fieldNameAsString] as string) : field.initialValue
          }
          onChange={(val) => handleChange(field.name, val)}
          required={field.required}
          //disabled={false}
        />
      );
    default:
      // 未知のフィールドタイプの場合のフォールバック
      return (
        <Typography color="error" variant="body2">
          Unknown field type: {field.type} for {fieldNameAsString}
        </Typography>
      );
  }
}

export default FormFieldRenderer;
