import React, { FC } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"; // date-fns 用アダプター
import { ja } from "date-fns/locale"; // 日本語ロケールをインポート
import { TextField } from "@mui/material";

interface MuiDatePickerWrapperProps {
  label: string;
  name: string;
  value: string | null; // YYYY-MM-DD 形式の文字列、または null
  onChange: (value: string | null) => void; // YYYY-MM-DD 形式の文字列、または null を返す
  required?: boolean;
}

const MuiDatePickerWrapper: FC<MuiDatePickerWrapperProps> = ({
  label,
  name,
  value,
  onChange,
  required = false,
}) => {
  // ISO形式の文字列 (YYYY-MM-DD) を Date オブジェクトに変換
  const dateValue = value ? new Date(value) : null;

  const handleChange = (date: Date | null) => {
    // Date オブジェクトを YYYY-MM-DD 形式の文字列に変換して親に渡す
    onChange(date ? date.toISOString().split("T")[0] : null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      {" "}
      {/* ロケールを日本語に設定 */}
      <DatePicker
        label={label}
        value={dateValue}
        onChange={handleChange}
        format="yyyy-MM-dd"
        // textField は入力フィールド部分
        // ★追加: エラーメッセージが指示しているプロップ
        enableAccessibleFieldDOMStructure={false} // これを追加！
        slots={{
          textField: TextField,
        }}
        // slotProps プロパティで、各スロットコンポーネントに渡すPropsを定義
        slotProps={{
          textField: {
            fullWidth: true,
            margin: "normal",
            id: name,
            name: name,
            required: required,
            variant: "outlined",
            // readOnly: true, // ユーザーが直接入力できないようにする場合
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default MuiDatePickerWrapper;
