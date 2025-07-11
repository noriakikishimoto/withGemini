import React, { FC } from "react";
import { FormControlLabel, Checkbox } from "@mui/material";
import { CommonFormFieldComponent } from "../../types/interfaces";

interface MuiCheckboxWrapperProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  readOnly?: boolean;
}

const MuiCheckboxWrapper: CommonFormFieldComponent<MuiCheckboxWrapperProps> = ({
  label,
  name,
  checked,
  onChange,
  required = false,
  readOnly = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <FormControlLabel
      control={
        <Checkbox
          id={name}
          name={name}
          checked={checked}
          onChange={handleChange}
          required={required}
          readOnly={readOnly}
        />
      }
      label={label}
      sx={{ mt: 1, mb: 1 }} // 上下マージン
    />
  );
};

MuiCheckboxWrapper.getInitialValue = () => false; // チェックボックスの初期値は false

export default MuiCheckboxWrapper;
