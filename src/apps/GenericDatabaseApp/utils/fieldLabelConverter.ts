import { FormField, User } from "../../../types/interfaces"; // FormField と GenericRecord をインポート

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

export const getFormattedUserName = (userId: string, allUsers?: User[]): string => {
  return allUsers?.find((u) => u.id === userId)?.displayName || userId;
};

export const getFormattedUserNameByList = (userIds: string[], allUsers?: User[]): string => {
  if (typeof userIds === "string") {
    return getFormattedUserName(userIds, allUsers);
  }

  if (!userIds || userIds.length === 0) {
    return "";
  }
  let formattedUserIds: string[] = [];
  userIds.forEach((userId) => {
    formattedUserIds.push(getFormattedUserName(userId, allUsers));
  });
  return formattedUserIds.join(",");
};

export const getFormattedDateString = (isoDate: string): string => {
  return isoDate ? new Date(isoDate).toLocaleString() : "";
};
