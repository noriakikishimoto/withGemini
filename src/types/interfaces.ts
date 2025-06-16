// ★追加: IDを持つエンティティの基本インターフェース
export interface Identifiable {
  id: string;
}

// ★追加: 汎用的なCRUD操作のインターフェース
// <T extends Identifiable> は、Tが必ずidプロパティを持つことを保証する
export interface BaseRepository<T extends Identifiable, CreateDto, UpdateDto> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: CreateDto): Promise<T>;
  update(id: string, data: UpdateDto): Promise<T>;
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
export type FormFieldType = "text" | "textarea" | "number" | "date" | "checkbox" | "select";

// ★追加: セレクトボックスの選択肢の型
export interface FormFieldSelectOption {
  value: string;
  label: string;
}

// Tはフォームが扱うデータオブジェクトの型
// CはフィールドをレンダリングするReactコンポーネントの型
// Cは React.ComponentType<any> かつ、getInitialValue 静的メソッドを必須で持つことを保証
export interface FormField<
  T extends object,
  C extends React.ComponentType<any> & { getInitialValue: () => any },
> {
  name: keyof T;
  label: string;
  type: FormFieldType;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  options?: FormFieldSelectOption[];
  component: C;
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
