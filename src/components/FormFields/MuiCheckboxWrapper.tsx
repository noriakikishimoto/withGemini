import React, { FC } from "react";
import { FormControlLabel, Checkbox } from "@mui/material";

interface MuiCheckboxWrapperProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const MuiCheckboxWrapper: FC<MuiCheckboxWrapperProps> = ({ label, name, checked, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <FormControlLabel
      control={<Checkbox id={name} name={name} checked={checked} onChange={handleChange} />}
      label={label}
      sx={{ mt: 1, mb: 1 }} // 上下マージン
    />
  );
};

export default MuiCheckboxWrapper;
