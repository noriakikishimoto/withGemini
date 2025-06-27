import { useState, useEffect, useMemo } from "react";
import {
  AppSchema,
  GenericRecord,
  SortCondition,
  FilterCondition,
  FormField,
  CommonFormFieldComponent,
  CustomView,
} from "../../../types/interfaces";
import { getFieldComponentByType } from "../utils/fieldComponentMapper";
import { addSystemFieldsToSchema } from "../utils/appSchemaUtils";

interface UseListSettingsProps {
  appId: string | undefined;
  appSchema: AppSchema | null;
  records: GenericRecord[];
  customViews: CustomView<GenericRecord>[]; // 親から customViews を受け取る
  isLoading: boolean; // appSchema のロード完了を待つため
  viewId?: string | undefined;
}

interface UseListSettingsResult {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  sortConditions: SortCondition<GenericRecord>[];
  setSortConditions: React.Dispatch<React.SetStateAction<SortCondition<GenericRecord>[]>>;
  handleSortConditionsChange: (newSortConditions: SortCondition<GenericRecord>[]) => void;
  filterConditions: FilterCondition<GenericRecord>[];
  setFilterConditions: React.Dispatch<React.SetStateAction<FilterCondition<GenericRecord>[]>>;
  handleFilterConditionsChange: (newFilterConditions: FilterCondition<GenericRecord>[]) => void;
  selectedDisplayFields: (keyof GenericRecord)[];
  setSelectedDisplayFields: React.Dispatch<React.SetStateAction<(keyof GenericRecord)[]>>;
  handleDisplayFieldsChange: (newDisplayFields: (keyof GenericRecord)[]) => void;
  filteredAndSortedRecords: GenericRecord[];
  fieldsForDynamicList: FormField<GenericRecord, CommonFormFieldComponent<any>>[];
  currentViewId: string | "default"; // 現在選択中のビューID
  setCurrentViewId: React.Dispatch<React.SetStateAction<string | "default">>;
}
// DynamicList に渡すフィールド定義の型を AppSchemaFormPage と合わせるための型
type FormFieldForDynamicList<T extends object> = FormField<T, CommonFormFieldComponent<any>>;

export const useListSettings = ({
  appId,
  appSchema,
  records,
  customViews,
  isLoading,
  viewId,
}: UseListSettingsProps): UseListSettingsResult => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConditions, setSortConditions] = useState<SortCondition<GenericRecord>[]>([]);
  const [filterConditions, setFilterConditions] = useState<FilterCondition<GenericRecord>[]>([]);
  const [selectedDisplayFields, setSelectedDisplayFields] = useState<(keyof GenericRecord)[]>([]);
  const [currentViewId, setCurrentViewId] = useState<string | "default">(viewId || "default");

  // 現在のビューIDが変更されたら、フィルタ/ソート条件を適用
  useEffect(() => {
    // appSchema がまだロードされていない場合は何もしない
    if (!appSchema) {
      // ただし、isLoading が false になった後も appSchema が null ならエラー表示
      if (!isLoading && !appSchema) {
        //    setError("アプリスキーマが見つからないか、読み込みに失敗しました。");
      }
      return;
    }

    if (currentViewId === "default") {
      setFilterConditions([]);
      setSortConditions([]);
      setSelectedDisplayFields(appSchema.fields.map((f) => f.name as keyof GenericRecord));
    } else {
      const selectedView = customViews.find((view) => view.id === currentViewId);
      if (selectedView) {
        setFilterConditions([...selectedView.filterConditions] as FilterCondition<GenericRecord>[]);
        setSortConditions([...selectedView.sortConditions] as SortCondition<GenericRecord>[]);
        setSelectedDisplayFields(
          selectedView.displayFields || appSchema.fields.map((f) => f.name as keyof GenericRecord)
        );
      } else {
        setCurrentViewId("default");
      }
    }
  }, [currentViewId, customViews, appSchema, isLoading]); // isLoading も依存配列に追加 (appSchema のロード完了を待つため)

  const filteredAndSortedRecords = useMemo(() => {
    let currentRecords = [...records];

    if (appSchema) {
      currentRecords = currentRecords.filter((record) => {
        // テキスト検索
        const passesSearchTerm =
          !searchTerm ||
          appSchema.fields.some((field) => {
            const fieldValue = record[field.name as string];
            return String(fieldValue ?? "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
          });

        // 複数条件フィルタリング
        const passesFilterConditions = filterConditions.every((condition) => {
          const fieldDef = appSchema.fields.find((f) => f.name === condition.field);
          if (!fieldDef) return false; // フィールド定義が見つからない場合はスキップ

          let fieldValue = record[condition.field as string];
          let filterValue = condition.value;

          // ★修正: 日付型の比較ロジック
          if (fieldDef.type === "date") {
            const dateFieldValue = fieldValue ? new Date(String(fieldValue)) : null;
            const dateFilterValue = filterValue ? new Date(String(filterValue)) : null;

            // 日付が不正な場合（NaN）は比較しない
            if (
              dateFieldValue === null ||
              dateFilterValue === null ||
              isNaN(dateFieldValue.getTime()) ||
              isNaN(dateFilterValue.getTime())
            ) {
              return false; // または true, 要件によるがここでは false (比較できないので合致しない)
            }
            switch (condition.operator) {
              case "eq":
                return dateFieldValue.getTime() === dateFilterValue.getTime();
              case "ne":
                return dateFieldValue.getTime() !== dateFilterValue.getTime();
              case "gt":
                return dateFieldValue.getTime() > dateFilterValue.getTime();
              case "lt":
                return dateFieldValue.getTime() < dateFilterValue.getTime();
              case "ge":
                return dateFieldValue.getTime() >= dateFilterValue.getTime();
              case "le":
                return dateFieldValue.getTime() <= dateFilterValue.getTime();
              default:
                return true;
            }
          }
          // 数値型の比較ロジック (Number に変換)
          else if (fieldDef.type === "number") {
            const numFieldValue = Number(fieldValue);
            const numFilterValue = Number(filterValue);
            if (isNaN(numFieldValue) || isNaN(numFilterValue)) return false; // 数値でない場合は比較しない
            switch (condition.operator) {
              case "eq":
                return numFieldValue === numFilterValue;
              case "ne":
                return numFieldValue !== numFilterValue;
              case "gt":
                return numFieldValue > numFilterValue;
              case "lt":
                return numFieldValue < numFilterValue;
              case "ge":
                return numFieldValue >= numFilterValue;
              case "le":
                return numFieldValue <= numFilterValue;
              default:
                return true;
            }
          }
          // チェックボックスの比較ロジック
          else if (fieldDef.type === "checkbox") {
            const boolFieldValue = Boolean(fieldValue); // 真偽値に変換
            const boolFilterValue = Boolean(filterValue);
            switch (condition.operator) {
              case "eq":
                return boolFieldValue === boolFilterValue;
              case "ne":
                return boolFieldValue !== boolFilterValue;
              default:
                return true;
            }
          }
          // テキストベースの比較ロジック (文字列に変換して比較)
          else {
            const strFieldValue = String(fieldValue ?? "").toLowerCase();
            const strFilterValue = String(filterValue ?? "").toLowerCase();
            switch (condition.operator) {
              case "eq":
                return strFieldValue === strFilterValue;
              case "ne":
                return strFieldValue !== strFilterValue;
              case "contains":
                return strFieldValue.includes(strFilterValue);
              case "not_contains":
                return !strFieldValue.includes(strFilterValue);
              case "starts_with":
                return strFieldValue.startsWith(strFilterValue);
              case "ends_with":
                return strFieldValue.endsWith(strFilterValue);
              default:
                return true;
            }
          }
        });

        return passesSearchTerm && passesFilterConditions;
      });
    }
    // 2. ソート
    if (sortConditions.length > 0) {
      currentRecords.sort((a, b) => {
        for (const condition of sortConditions) {
          const aValue = String(a[condition.field] ?? "").toLowerCase();
          const bValue = String(b[condition.field] ?? "").toLowerCase();

          if (aValue < bValue) {
            return condition.direction === "asc" ? -1 : 1;
          }
          if (aValue > bValue) {
            return condition.direction === "asc" ? 1 : -1;
          }
        }
        return 0; // 全ての条件で同値の場合
      });
    }

    return currentRecords;
  }, [records, searchTerm, appSchema, sortConditions, filterConditions]);

  // DynamicList に渡す fields を変換するロジック
  const fieldsForDynamicList = useMemo((): FormFieldForDynamicList<GenericRecord>[] => {
    if (!appSchema) return [];

    const appSchemaWithSystemFields = addSystemFieldsToSchema(appSchema);

    const fieldsToDisplay =
      selectedDisplayFields.length > 0
        ? appSchemaWithSystemFields.filter((field) =>
            selectedDisplayFields.includes(field.name as keyof GenericRecord)
          )
        : appSchemaWithSystemFields;
    /*
    return fieldsToDisplay.map((field) => ({
      ...field,
      component: getFieldComponentByType(field.type),
    })) as FormFieldForDynamicList<GenericRecord>[];
  */
    return fieldsToDisplay;
  }, [appSchema, selectedDisplayFields, customViews]);

  // ソート条件変更ハンドラ
  const handleSortConditionsChange = (newSortConditions: SortCondition<GenericRecord>[]) => {
    setSortConditions(newSortConditions);
    setCurrentViewId("default");
  };

  // フィルタリング条件変更ハンドラ
  const handleFilterConditionsChange = (newFilterConditions: FilterCondition<GenericRecord>[]) => {
    setFilterConditions(newFilterConditions);
    setCurrentViewId("default");
  };

  // 表示列変更時のハンドラ (DisplayFieldsModal から呼ばれる)
  const handleDisplayFieldsChange = (newDisplayFields: (keyof GenericRecord)[]) => {
    setSelectedDisplayFields(newDisplayFields);
    // ここで setCurrentViewId('default') を呼び出さない (ビュー選択状態のリセットは行わない)
  };

  return {
    searchTerm,
    setSearchTerm,
    sortConditions,
    setSortConditions, // setSortConditions も公開
    handleSortConditionsChange,
    filterConditions,
    setFilterConditions, // setFilterConditions も公開
    handleFilterConditionsChange,
    selectedDisplayFields,
    setSelectedDisplayFields, // setSelectedDisplayFields も公開
    handleDisplayFieldsChange,
    filteredAndSortedRecords,
    fieldsForDynamicList,
    currentViewId,
    setCurrentViewId, // setCurrentViewId も公開
  };
};
