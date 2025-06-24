import { FormField, GenericRecord } from "../../../types/interfaces"; // FormField と GenericRecord をインポート

/**
 *
 * @param fieldName　変換したいフィールド名
 * @param appFields　そのアプリの全フィールド定義
 * @returns ラベルが見つかった場合はラベルを。見つからない場合には引数をStringにキャストしたものを返します
 */
export const getFieldLabelByName = <T extends object>(
  fieldName: keyof T,
  appFields: FormField<T, any>[]
): string => {
  const field = appFields.find((f) => f.name === fieldName);
  return field ? field.label : String(fieldName);
};
