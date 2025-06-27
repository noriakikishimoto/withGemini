import {
  AppSchema,
  CommonFormFieldComponent,
  FormField,
  GenericRecord,
  User,
} from "../../../types/interfaces";
import { getFieldComponentByType } from "./fieldComponentMapper"; // fieldComponentMapper をインポート

/**
 * アプリスキーマのフィールド定義にシステムフィールド (createdBy, createdAt など) を注入する関数。
 * これらのフィールドは読み取り専用として設定される。
 * @param appSchema アプリのスキーマ定義
 * @returns システムフィールドが注入された FormField の配列
 */
export const addSystemFieldsToSchema = (
  appSchema: AppSchema
): FormField<GenericRecord, CommonFormFieldComponent<any>>[] => {
  if (!appSchema || !appSchema.fields) {
    return [];
  }

  // 元のフィールドに component を付与
  const baseFields: FormField<GenericRecord, CommonFormFieldComponent<any>>[] = appSchema.fields.map(
    (fieldDef) => ({
      ...fieldDef,
      name: fieldDef.name as keyof GenericRecord, // 型キャスト
      component: getFieldComponentByType(fieldDef.type),
    })
  ) as FormField<GenericRecord, CommonFormFieldComponent<any>>[];

  const systemFields: FormField<GenericRecord, CommonFormFieldComponent<any>>[] = [
    {
      name: "createdBy",
      label: "作成者",
      type: "text", // 将来的にルックアップ表示も考慮
      readOnly: true,
      group: "システム情報",
      component: getFieldComponentByType("text"),
      valueFormatter: (userId: string, allUsers?: User[]) =>
        allUsers?.find((u) => u.id === userId)?.displayName || userId,
    },
    {
      name: "createdAt",
      label: "作成日時",
      type: "text",
      readOnly: true,
      group: "システム情報",
      component: getFieldComponentByType("date"),
      valueFormatter: (isoDate: string) => (isoDate ? new Date(isoDate).toLocaleString() : ""),
    },
    {
      name: "updatedBy",
      label: "更新者",
      type: "text", // 将来的にルックアップ表示も考慮
      readOnly: true,
      group: "システム情報",
      component: getFieldComponentByType("text"),
      valueFormatter: (userId: string, allUsers?: User[]) =>
        allUsers?.find((u) => u.id === userId)?.displayName || userId,
    },
    {
      name: "updatedAt",
      label: "更新日時",
      type: "text",
      readOnly: true,
      group: "システム情報",
      component: getFieldComponentByType("date"),
      valueFormatter: (isoDate: string) => (isoDate ? new Date(isoDate).toLocaleString() : ""),
    },
  ];

  // 既存のフィールドにシステムフィールドが重複しないようにフィルタリングし、追加する
  const filteredSystemFields = systemFields.filter(
    (sysField) => !baseFields.some((baseField) => baseField.name === sysField.name)
  );

  return [...baseFields, ...filteredSystemFields];
};
