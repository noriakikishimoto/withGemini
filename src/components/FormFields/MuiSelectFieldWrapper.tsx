import React, { FC } from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { CommonFormFieldComponent } from "../../types/interfaces";

// 選択肢の型定義
interface SelectOption {
  value: string;
  label: string;
}

interface MuiSelectFieldWrapperProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[]; // 選択肢の配列
  required?: boolean;
}

const MuiSelectFieldWrapper: CommonFormFieldComponent<MuiSelectFieldWrapperProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}) => {
  const handleChange = (e: any) => {
    // Select の onChange イベントの型が複雑なため any にしているが、厳密には ChangeEvent<HTMLSelectElement> など
    onChange(e.target.value as string);
  };

  return (
    <FormControl fullWidth margin="normal" variant="outlined" required={required}>
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <Select
        labelId={`${name}-label`}
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        label={label}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

MuiSelectFieldWrapper.getInitialValue = () => "";
export default MuiSelectFieldWrapper;
