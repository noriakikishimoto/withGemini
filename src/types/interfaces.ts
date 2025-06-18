import { Component } from "react";

// ★追加: IDを持つエンティティの基本インターフェース
export interface Identifiable {
  id: string;
}

// ★追加: 汎用的なCRUD操作のインターフェース
// <T extends Identifiable> は、Tが必ずidプロパティを持つことを保証する
/*
export interface BaseRepository<T extends Identifiable, CreateDto, UpdateDto> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: CreateDto): Promise<T>;
  update(id: string, data: UpdateDto): Promise<T>;
  delete(id: string): Promise<void>;
}
  */
export interface BaseRepository<T extends Identifiable, CreateDto, UpdateDto, AppIdType = void> {
  // ★AppIdType を追加
  getAll(appId?: AppIdType): Promise<T[]>; // ★appId をオプションで受け取るように
  getById(id: string, appId?: AppIdType): Promise<T | null>; // ★appId をオプションで受け取るように
  create(data: CreateDto, appId?: AppIdType): Promise<T>; // ★appId をオプションで受け取るように
  update(id: string, data: UpdateDto, appId?: AppIdType): Promise<T>; // ★appId をオプションで受け取るように
  delete(id: string, appId?: AppIdType): Promise<void>; // ★appId をオプションで受け取るように
}

// 既存の ApplicationData はそのまま使う
export interface ApplicationData extends Identifiable {
  title: string;
  description: string;
  applicant: string;
}

export interface TaskData extends Identifiable {
  title: string;
  description: string;
  dueDate: string; // 日付型（ISO文字列 YYYY-MM-DD）
  completed: boolean; // 完了フラグ
  assignee: string; // 担当者（テキストまたは選択肢）
}
// ★追加: フォームフィールドのタイプを表すユニオン型
export type FormFieldType = "text" | "textarea" | "number" | "date" | "checkbox" | "select";

// ★追加: セレクトボックスの選択肢の型
export interface FormFieldSelectOption {
  value: string;
  label: string;
}

// 全ての汎用フォームコンポーネントが従うべき共通の型エイリアス
// P はそのコンポーネントが受け取るPropsの型
export type CommonFormFieldComponent<P = {}> = React.ComponentType<P> & {
  getInitialValue: () => any; // ここは具体的な初期値型を返す関数とする
  // 例: getInitialValue: () => string; (MuiTextFieldWrapper向け)
  //     getInitialValue: () => boolean; (MuiCheckboxWrapper向け)
  // より厳密な型を求める場合は、getInitialValue の戻り値もジェネリクスにするか、
  // 各コンポーネント側で export default のキャスト時に明示する。
  // ここでは、共通インターフェースとしては any を許容し、個別の型は実装側で保証する
};

export interface FormField<T extends object, C extends CommonFormFieldComponent<any>> {
  name: keyof T;
  label: string;
  type: FormFieldType;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  options?: FormFieldSelectOption[] | string;
  component: C;
  initialValue?: any;
}

export interface DynamicListProps<T extends Identifiable & object> {
  // Tはリストのデータオブジェクトの型
  items: T[]; // 表示するデータの配列
  fields: FormField<T, any>[]; // 表示するフィールドの定義 (DynamicForm と同じ FormField を利用)
  onEdit: (id: string) => void; // 編集ボタンが押されたときに呼ばれるコールバック
  onDelete: (id: string) => void; // 削除ボタンが押されたときに呼ばれるコールバック
  itemBasePath: string; // 詳細ページへのリンクのベースパス (例: '/generic-db/tasks')
  listTitle: string; // リストのタイトル (例: '既存のタスク')
}

//　アプリケーションスキーマのデータモデル
// これが「ユーザーが作成するアプリの定義」そのもの
export interface AppSchema extends Identifiable {
  name: string; // アプリケーションの名前（例: 顧客管理、商品管理）
  description?: string; // アプリケーションの説明（オプション）
  fields: Omit<FormField<any, any>, "component">[];
}

export interface GenericRecord extends Identifiable {
  [key: string]: any; // フィールド名 (string) に対応する値 (any)
}
