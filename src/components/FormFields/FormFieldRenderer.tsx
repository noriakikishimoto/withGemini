import React, { FC } from "react";
import { Box, Typography } from "@mui/material"; // レイアウト用のBoxコンポーネント

// 各汎用フォームパーツをインポート
import MuiTextFieldWrapper from "./MuiTextFieldWrapper.tsx";
import MuiCheckboxWrapper from "./MuiCheckboxWrapper.tsx";
import MuiDatePickerWrapper from "./MuiDatePickerWrapper.tsx";
import MuiSelectFieldWrapper from "./MuiSelectFieldWrapper.tsx";

// 共通の型定義をインポート
import { FormField, CommonFormFieldComponent } from "../../types/interfaces";

// FormFieldRenderer が受け取るPropsの型定義
interface FormFieldRendererProps<T extends object> {
  // field は単一の FormField オブジェクト
  field: FormField<T, CommonFormFieldComponent<any>>;
  // formData は DynamicForm から渡されるフォームの全データ
  formData: Record<string, any>;
  // handleChange は DynamicForm から渡される値変更ハンドラ
  handleChange: (name: string, value: any) => void;
}

// FormFieldRenderer コンポーネントの定義
// ジェネリクス <T extends object> を使用して、DynamicForm と同じ T 型を扱う
function FormFieldRenderer<T extends object>({
  field,
  formData,
  handleChange,
}: FormFieldRendererProps<T>) {
  // field.name は keyof T だが、formData アクセスと handleChange の引数には string が必要
  const fieldNameAsString = field.name as string;

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

  // 各フィールドタイプに応じたコンポーネントを動的にレンダリング
  switch (field.type) {
    case "text":
    case "textarea":
    case "number":
      return (
        <MuiTextFieldWrapper
          label={field.label}
          name={fieldNameAsString}
          value={String(formData[fieldNameAsString] ?? "")} // nullish coalescing で安全なデフォルト
          onChange={(val) =>
            handleChange(fieldNameAsString, field.type === "number" ? Number(val) : val)
          }
          multiline={field.multiline || field.type === "textarea"} // textarea タイプなら強制的に multiline
          rows={field.rows}
          required={field.required}
          type={field.type}
        />
      );
    case "checkbox":
      return (
        <MuiCheckboxWrapper
          label={field.label}
          name={fieldNameAsString}
          checked={!!(formData[fieldNameAsString] ?? false)} // nullish coalescing で安全なデフォルト
          onChange={(val) => handleChange(fieldNameAsString, val)}
          required={field.required}
        />
      );
    case "date":
      return (
        <MuiDatePickerWrapper
          label={field.label}
          name={fieldNameAsString}
          value={(formData[fieldNameAsString] as string | null) ?? null} // nullish coalescing で安全なデフォルト
          onChange={(val) => handleChange(fieldNameAsString, val)}
          required={field.required}
        />
      );
    case "select":
      return (
        <MuiSelectFieldWrapper
          label={field.label}
          name={fieldNameAsString}
          value={String(formData[fieldNameAsString] ?? "")} // nullish coalescing で安全なデフォルト
          onChange={(val) => handleChange(fieldNameAsString, val)}
          options={parsedOptions} // パース済みの options を渡す
          required={field.required}
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
