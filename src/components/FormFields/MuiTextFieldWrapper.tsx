import React, { FC } from "react";
import { TextField } from "@mui/material";

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
}

const MuiTextFieldWrapper: FC<MuiTextFieldWrapperProps> = ({
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
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // 数値入力の場合、NaNチェックなどが必要になるが、今回は簡易的にそのまま渡す
    onChange(e.target.value);
  };

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
      type={type === "number" ? "number" : type} // type="number"の場合はMUI側で調整
      error={error}
      helperText={helperText}
      variant="outlined"
      // 数値入力の場合に、inputMode="numeric" や pattern="[0-9]*" を設定することも可能
      inputProps={type === "number" ? { inputMode: "numeric", pattern: "[0-9]*" } : {}}
    />
  );
};

export default MuiTextFieldWrapper;
