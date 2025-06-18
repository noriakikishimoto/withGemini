// 汎用フォームパーツをインポート
import MuiTextFieldWrapper from "../../../components/FormFields/MuiTextFieldWrapper.tsx";
import MuiCheckboxWrapper from "../../../components/FormFields/MuiCheckboxWrapper.tsx";
import MuiDatePickerWrapper from "../../../components/FormFields/MuiDatePickerWrapper.tsx";
import MuiSelectFieldWrapper from "../../../components/FormFields/MuiSelectFieldWrapper.tsx";

// 共通の型定義をインポート
import { FormFieldType, CommonFormFieldComponent } from "../../../types/interfaces";

/**
 * フィールドタイプに基づいて、対応する汎用フォームパーツコンポーネントを返すヘルパー関数。
 * @param fieldType フィールドのタイプ (例: 'text', 'date', 'select')
 * @returns そのフィールドタイプに対応する CommonFormFieldComponent 型のコンポーネント
 */
export const getFieldComponentByType = (fieldType: FormFieldType): CommonFormFieldComponent<any> => {
  switch (fieldType) {
    case "text":
    case "number":
    case "textarea":
      return MuiTextFieldWrapper;
    case "date":
      return MuiDatePickerWrapper;
    case "checkbox":
      return MuiCheckboxWrapper;
    case "select":
      return MuiSelectFieldWrapper;
    default:
      console.error(`Unknown field type: ${fieldType}. Falling back to MuiTextFieldWrapper.`);
      return MuiTextFieldWrapper;
  }
};
