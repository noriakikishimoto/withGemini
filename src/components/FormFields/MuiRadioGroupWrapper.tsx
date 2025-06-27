import React, { FC } from "react";
import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from "@mui/material"; // MUIコンポーネントをインポート

// 共通の型定義をインポート
import { CommonFormFieldComponent, FormFieldSelectOption } from "../../types/interfaces";

// Propsの型定義
interface MuiRadioGroupWrapperProps {
  label: string;
  name: string;
  value: string; // ラジオボタンの値は通常文字列
  onChange: (value: string) => void;
  options: FormFieldSelectOption[]; // 選択肢の配列
  required?: boolean;
  readOnly?: boolean;
}

// MuiRadioGroupWrapper コンポーネントの定義
// CommonFormFieldComponent 型エイリアスを適用
const MuiRadioGroupWrapper: CommonFormFieldComponent<MuiRadioGroupWrapperProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  readOnly = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <FormControl component="fieldset" margin="normal" required={required}>
      <FormLabel component="legend">{label}</FormLabel>
      <RadioGroup
        aria-label={label}
        name={name}
        value={value}
        onChange={handleChange}
        row // ラジオボタンを横並びにする
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio />}
            label={option.label}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
};

// getInitialValue 静的メソッドの定義
MuiRadioGroupWrapper.getInitialValue = () => ""; // ラジオボタンの初期値は通常空文字列か、最初の選択肢の値

export default MuiRadioGroupWrapper;
