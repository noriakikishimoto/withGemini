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
export interface BaseRepository<T extends Identifiable, CreateDto, UpdateDto, AppIdType> {
  // ★AppIdType を追加
  getAll(appId?: AppIdType): Promise<T[]>;
  getById(id: string, appId?: AppIdType): Promise<T | null>;
  create(data: CreateDto, appId: AppIdType, currentUserId?: string): Promise<T>;
  update(id: string, data: UpdateDto, appId: AppIdType, currentUserId?: string): Promise<T>;
  delete(id: string, appId?: AppIdType): Promise<void>;
}
export interface BaseRepositoryNotForApp<T extends Identifiable, CreateDto, UpdateDto> {
  // ★AppIdType を追加
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: CreateDto, currentUserId?: string): Promise<T>;
  update(id: string, data: UpdateDto, currentUserId?: string): Promise<T>;
  delete(id: string): Promise<void>;
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
export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "checkbox"
  | "select"
  | "radio"
  | "email"
  | "lookup"
  | "table";

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

export interface LookupCopyField {
  from: string; // ルックアップ元アプリのフィールド名
  to: string; // 現在のフォームのフィールド名
}

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

  // ★追加: ルックアップフィールドのメタデータ
  lookupAppId?: string; // 参照元アプリのID
  lookupKeyField?: string; // 参照元アプリのキーとなるフィールド名
  //lookupDisplayFields?: string[]; // 参照元アプリから表示/コピーするフィールド名
  lookupDisplayFields?: string;
  //lookupCopyToFields?: LookupCopyField[];
  lookupCopyToFields?: string;

  // ★追加: グループ名
  group?: string;
  // ★追加: Grid アイテムの幅（MUI Grid の xs, sm, md プロップに対応）
  xs?: number;
  sm?: number;
  md?: number;

  // ★追加: table タイプの場合の、テーブルの列定義

  tableSourceAppId?: string; // 参照元アプリのID (テーブル表示データ用)
  tableFilterField?: string; // 抽出条件フィールド名 (テーブル表示データ用)
  tableFilterValue?: string; // 抽出条件値 (テーブル表示データ用)
  tableFields?: string;
  // tableFields?: FormField<any, any>[];

  readOnly?: boolean; //読み取り専用（システム設定値など）

  // ★追加: 値を整形して表示するためのFormatter関数
  valueFormatter?: (value: any, allUsers?: User[]) => string;
}

export type SortDirection = "asc" | "desc" | undefined;
// ★追加: ソート条件のインターフェース
export interface SortCondition<T extends object> {
  field: keyof T;
  direction: Exclude<SortDirection, undefined>; // 'asc' または 'desc' のみ
}

//　アプリケーションスキーマのデータモデル
// これが「ユーザーが作成するアプリの定義」そのもの
export interface AppSchema extends Identifiable, SyetemInfo {
  name: string; // アプリケーションの名前（例: 顧客管理、商品管理）
  description?: string; // アプリケーションの説明（オプション）
  fields: Omit<FormField<any, any>, "component">[];
}

export interface GenericRecord extends Identifiable, SyetemInfo {
  [key: string]: any; // フィールド名 (string) に対応する値 (any)
  // createdBy?: string; // 作成者のユーザーID
  // updatedBy?: string; // 最終更新者のユーザーID
  // createdAt?: string; // 作成日時 (ISO 8601 形式の文字列)
  // updatedAt?: string; // 最終更新日時 (ISO 8601 形式の文字列)
}
export interface SyetemInfo {
  createdBy?: string; // 作成者のユーザーID
  updatedBy?: string; // 最終更新者のユーザーID
  createdAt?: string; // 作成日時 (ISO 8601 形式の文字列)
  updatedAt?: string; // 最終更新日時 (ISO 8601 形式の文字列)
}
// ★追加: フィルタリングの比較演算子
export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "lt"
  | "ge"
  | "le"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with";

// ★追加: フィルタリング条件のインターフェース
export interface FilterCondition<T extends object> {
  field: keyof T;
  operator: FilterOperator;
  value: any; // 比較対象の値
}

export interface CustomView<T extends object> extends Identifiable, SyetemInfo {
  name: string;
  appId: string; // このビューが紐づくアプリのID
  filterConditions: FilterCondition<T>[];
  sortConditions: SortCondition<T>[];
  displayFields?: (keyof T)[]; // ★追加: ビューで表示するフィールド名 (keyof T の配列)
  //createdBy?: string; // 作成者のユーザーID
  //updatedBy?: string; // 最終更新者のユーザーID
  //createdAt?: string; // 作成日時 (ISO 8601 形式の文字列)
  //updatedAt?: string; // 最終更新日時 (ISO 8601 形式の文字列)
}

export type ChartType = "bar" | "pie" | "line";

// ダッシュボードウィジェットの型定義
export type WidgetType = "chart" | "list" | "text" | "image"; // ウィジェットの種類

export type ChartAggregationUnit = "day" | "month" | "year" | undefined; // グラフの集計単位

export interface DashboardWidget<T extends object> {
  id: string; // ウィジェットの一意なID
  type: WidgetType; // ウィジェットの種類
  title: string; // ウィジェットのタイトル
  appId?: string; // 関連するアプリのID (Chart, List ウィジェットの場合)
  // フィルタリングとソートはウィジェットごとに独立して持つ
  filterConditions?: FilterCondition<T>[];
  sortConditions?: SortCondition<T>[];
  displayFields?: (keyof T)[]; // List ウィジェットの場合の表示列
  // Grid レイアウトプロパティ
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  // Chart ウィジェット固有のプロパティ
  chartField?: keyof T; // グラフ化するフィールド
  chartType?: ChartType; // グラフの種類 (bar, pie, line)
  chartAggregationUnit?: ChartAggregationUnit; // 日付グラフの場合の集計単位
  // Text/Image ウィジェット固有のプロパティ (今回は簡易化)
  content?: string; // テキストや画像URLなど
  customViewId?: string; //  適用するカスタムビューのID
}

// ダッシュボードの型定義
export interface Dashboard extends Identifiable {
  name: string; // ダッシュボードの名前
  widgets: DashboardWidget<GenericRecord>[]; // ダッシュボードに含まれるウィジェットの配列
  // その他の設定 (レイアウトオプションなど) をここに追加可能
}

export interface User extends Identifiable {
  username: string; // ログインに使用するユーザー名 (必須、一意)
  displayName: string; // ★追加: システム内でのユーザー表示名
  email: string; // ★追加: メールアドレス (一意性を考慮)
  password?: string; // パスワード (ハッシュ化を考慮し、オプションに)
  role?: userRole; // ロール (管理者、一般ユーザーなど)
  [key: string]: any; // その他の動的なプロパティを許容
}

export type userRole = "admin" | "user";
