import React, { FC } from "react";
import { TextField } from "@mui/material";
import { CommonFormFieldComponent } from "../../types/interfaces";

// Propsの型定義
interface MuiTextFieldWrapperProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  type?: string; // "text", "number", "email", "password" など
  error?: boolean; // エラー表示用
  helperText?: string; // エラーメッセージ表示用
  readOnly?: boolean;
  placeHolder?: string;
}

const MuiTextFieldWrapper: CommonFormFieldComponent<MuiTextFieldWrapperProps> = ({
  label,
  name,
  value,
  onChange,
  multiline = false, // デフォルト値を設定
  rows,
  required = false,
  type = "text",
  error = false,
  helperText,
  readOnly = false,
  placeHolder,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // 数値入力の場合、NaNチェックなどが必要になるが、今回は簡易的にそのまま渡す
    onChange(e.target.value);
  };

  const resolvedHelperText =
    type === "email" && !error ? "正しいメールアドレス形式で入力してください。" : helperText;

  const inputType = type === "number" ? "number" : type === "email" ? "email" : "text";

  return (
    <TextField
      fullWidth
      margin="normal"
      label={label}
      id={name}
      name={name}
      value={value}
      onChange={handleChange}
      required={required}
      multiline={multiline}
      rows={rows}
      type={inputType}
      error={error}
      helperText={resolvedHelperText}
      variant="outlined"
      placeholder={placeHolder}
      // 数値入力の場合に、inputMode="numeric" や pattern="[0-9]*" を設定することも可能
      inputProps={type === "number" ? { inputMode: "numeric", pattern: "[0-9]*" } : {}}
      slotProps={{
        input: {
          readOnly: readOnly,
        },
      }}
    />
  );
};

MuiTextFieldWrapper.getInitialValue = () => "";

export default MuiTextFieldWrapper;
