import { SortDirection } from "@mui/material";
import { FilterCondition, FilterOperator, FormField, SortCondition } from "../../../types/interfaces"; // FilterOperator をインポート
import { fi } from "date-fns/locale";
import { getFieldLabelByName } from "./fieldLabelConverter";

/**
 * FilterOperator の値を、ユーザーに分かりやすい日本語のラベルに変換するヘルパー関数。
 * @param operator FilterOperator の値 (例: 'eq', 'ne', 'contains')
 * @returns 対応する日本語のラベル
 */
export const getFilterOperatorLabel = (operator: FilterOperator): string => {
  switch (operator) {
    case "eq":
      return "と等しい";
    case "ne":
      return "と等しくない";
    case "gt":
      return "より大きい";
    case "lt":
      return "より小さい";
    case "ge":
      return "以上";
    case "le":
      return "以下";
    case "contains":
      return "を含む";
    case "not_contains":
      return "を含まない";
    case "starts_with":
      return "で始まる";
    case "ends_with":
      return "で終わる";
    default:
      return String(operator); // 未知の演算子の場合はそのまま表示
  }
};

export const getFilterConditionsDisplay = <GenericRecord extends object>(
  filterConditions: FilterCondition<GenericRecord>[],
  fields: FormField<GenericRecord, any>[]
): string => {
  if (filterConditions.length === 0) {
    return "未設定";
  }
  return filterConditions
    .map((cond) => {
      const fieldLabel = getFieldLabelByName(cond.field, fields);
      return getFilterConditionValueDisplay(fieldLabel, cond.operator, cond.value);
    })
    .join(" / ");
};

/**
 * FilterOperator と値を受け取り、完全な日本語の条件文字列を生成するヘルパー関数。
 * @param fieldName 対象のフィールド
 * @param operator FilterOperator の値
 * @param value 比較対象の値
 * @returns 「演算子 + 値」の日本語表現
 */
export const getFilterConditionValueDisplay = (
  fieldName: string,
  operator: FilterOperator,
  value: any
): string => {
  const operatorLabel = getFilterOperatorLabel(operator);

  // 日付型やチェックボックス型などの特殊な表示調整もここで行う
  let displayValue = String(value ?? ""); // undefined/null の場合は空文字列

  // 例: チェックボックスの真偽値
  if (typeof value === "boolean") {
    displayValue = value ? "選択" : "未選択";
  }
  // 例: 日付 (ISO文字列からより人間に優しい表示へ)
  // if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
  //     displayValue = new Date(value).toLocaleDateString('ja-JP');
  // }

  // 演算子と値を組み合わせた表現
  switch (operator) {
    case "eq":
    case "ne":
      return `「${fieldName}」が「${displayValue}」${operatorLabel} `;
    case "gt":
    case "lt":
    case "ge":
    case "le":
      return `「${fieldName}」が「${displayValue}」${operatorLabel}`;
    case "contains":
    case "not_contains":
    case "starts_with":
    case "ends_with":
      return `「${fieldName}」が「${displayValue}」${operatorLabel}`;
    default:
      return `「${fieldName}」が「${displayValue}」${operatorLabel}`;
  }
};

/**
 * ソート条件の配列を文字列に変換するヘルパー関数。
 * @param sortConditions SortCondition の配列
 * @param fields アプリのフィールド定義 (ラベル取得用)
 * @returns 例: 「氏名 (昇順), 日付 (降順)」
 */
export const getSortConditionsDisplay = <GenericRecord extends object>(
  sortConditions: SortCondition<GenericRecord>[],
  fields: FormField<GenericRecord, any>[]
): string => {
  if (sortConditions.length === 0) {
    return "未設定";
  }
  return sortConditions
    .map((cond, index) => {
      const fieldLabel = getFieldLabelByName(cond.field, fields);
      return getSortConditionValueDisplay(index, fieldLabel, cond.direction);
    })
    .join(" / ");
};

/**
 *
 * @param index
 * @param fieldLabel
 * @param direction
 * @returns
 */
export const getSortConditionValueDisplay = (
  index: number,
  fieldLabel: string,
  direction: Exclude<SortDirection, undefined>
): string => {
  return `${index + 1}. ${fieldLabel} (${direction === "asc" ? "昇順" : "降順"})`;
};

/**
 * 表示フィールドの配列を文字列に変換するヘルパー関数。
 * @param displayFields 表示フィールド名の配列
 * @param allFields アプリの全フィールド定義 (ラベル取得用)
 * @returns 例: 「氏名, 住所, 電話番号」
 */
export const getDisplayFieldsDisplay = <T extends object>(
  displayFields: (keyof T)[],
  allFields: FormField<T, any>[]
): string => {
  if (!displayFields || displayFields.length === 0) {
    return "全て"; // 全てのフィールドが表示される場合
  }
  const labels = displayFields.map((fieldName) => {
    return allFields.find((f) => f.name === fieldName)?.label || String(fieldName);
  });
  return labels.join(" / ");
};
