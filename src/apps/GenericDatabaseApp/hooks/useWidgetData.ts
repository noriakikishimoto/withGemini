import { useState, useEffect, useMemo } from "react";
import {
  AppSchema,
  GenericRecord,
  DashboardWidget,
  FilterCondition,
  SortCondition,
  FormFieldType,
} from "../../../types/interfaces";
import { appSchemaRepository } from "../../../repositories/appSchemaRepository";
import { genericDataRepository } from "../../../repositories/genericDataRepository";

interface UseWidgetDataProps {
  widget: DashboardWidget<GenericRecord>;
  allAppSchemas: AppSchema[]; // 全アプリスキーマ (AppSchema が必要)
}

interface UseWidgetDataResult {
  appSchema: AppSchema | null;
  records: GenericRecord[];
  filteredAndSortedRecords: GenericRecord[];
  isLoading: boolean;
  error: string | null;
}

export const useWidgetData = ({ widget, allAppSchemas }: UseWidgetDataProps): UseWidgetDataResult => {
  const [appSchema, setAppSchema] = useState<AppSchema | null>(null);
  const [records, setRecords] = useState<GenericRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ウィジェットのデータフェッチ
  useEffect(() => {
    const fetchDataForWidget = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!widget.appId) {
          throw new Error("対象アプリIDが設定されていません。");
        }
        const schema = allAppSchemas.find((s) => s.id === widget.appId);
        if (!schema) {
          throw new Error("指定されたアプリスキーマが見つかりません。");
        }
        setAppSchema(schema);

        const data = await genericDataRepository.getAll(widget.appId);
        setRecords(data);
      } catch (err) {
        console.error(`Error fetching data for widget ${widget.id}:`, err);
        setError("ウィジェットデータの読み込みに失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };
    if (widget.appId) {
      fetchDataForWidget();
    } else {
      setIsLoading(false); // appIdがない場合はロード不要
      setError("対象アプリIDが設定されていません。");
    }
  }, [widget.appId, allAppSchemas]); // allAppSchemas も依存配列に追加 (更新されたら再フェッチ)

  // filteredAndSortedRecords の計算 (ウィジェットレベルでフィルタ・ソートを適用)
  const filteredAndSortedRecords = useMemo(() => {
    let currentRecords = [...records];
    if (!appSchema) return [];

    const filterConditions = widget.filterConditions || [];
    const sortConditions = widget.sortConditions || [];

    // フィルタリングロジック
    if (filterConditions.length > 0) {
      currentRecords = currentRecords.filter((record) => {
        return filterConditions.every((condition) => {
          const fieldDef = appSchema.fields.find((f) => f.name === condition.field);
          if (!fieldDef) return false;

          let fieldValue = record[condition.field as string];
          let filterValue = condition.value;

          if (fieldDef.type === "date") {
            const dateFieldValue = fieldValue ? new Date(String(fieldValue)) : null;
            const dateFilterValue = filterValue ? new Date(String(filterValue)) : null;
            if (
              dateFieldValue === null ||
              dateFilterValue === null ||
              isNaN(dateFieldValue.getTime()) ||
              isNaN(dateFilterValue.getTime())
            ) {
              return false;
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
          } else if (fieldDef.type === "number") {
            const numFieldValue = Number(fieldValue);
            const numFilterValue = Number(filterValue);
            if (isNaN(numFieldValue) || isNaN(numFilterValue)) return false;
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
          } else {
            // text, select, radio, checkbox, email, lookup
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
      });
    }

    // ソートロジック
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
        return 0;
      });
    }
    return currentRecords;
  }, [records, appSchema, widget.filterConditions, widget.sortConditions]);

  return { appSchema, records, filteredAndSortedRecords, isLoading, error };
};
