import { useState, useEffect } from "react";
import { AppSchema, CustomView, GenericRecord } from "../../../types/interfaces";
import { appSchemaRepository } from "../../../repositories/appSchemaRepository";
import { genericDataRepository } from "../../../repositories/genericDataRepository";
import { customViewRepository } from "../../../repositories/customViewRepository";

interface UseAppDataResult {
  appSchema: AppSchema | null;
  records: GenericRecord[];
  customViews: CustomView<GenericRecord>[];
  isLoading: boolean;
  error: string | null;
  fetchData: () => Promise<void>; // データを再フェッチするための関数
}

/**
 * 指定されたアプリIDに基づいてアプリスキーマとレコードデータをフェッチするカスタムHook。
 * @param appId アプリケーションのID
 * @returns appSchema, records, customViews, isLoading, error, fetchData を含むオブジェクト
 */
export const useAppData = (appId: string | undefined): UseAppDataResult => {
  const [appSchema, setAppSchema] = useState<AppSchema | null>(null);
  const [records, setRecords] = useState<GenericRecord[]>([]);
  const [customViews, setCustomViews] = useState<CustomView<GenericRecord>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // 初期ロードは常にtrueから開始
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!appId) {
        throw new Error("アプリIDが指定されていません。");
      }
      // 1. アプリスキーマをロード
      const schema = await appSchemaRepository.getById(appId);
      if (!schema) {
        throw new Error("指定されたアプリスキーマが見つかりません。");
      }
      setAppSchema(schema);
      // 2. そのスキーマに紐づく実際のレコードデータをロード
      const data = await genericDataRepository.getAll(appId); // appId を渡す
      setRecords(data);
      // 3.カスタムビューもロード
      const views = await customViewRepository.getAll(appId); // appId でフィルタリング
      setCustomViews(views);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("データの読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appId]); // appId が変更されたらデータを再フェッチ

  return { appSchema, records, customViews, isLoading, error, fetchData };
};
