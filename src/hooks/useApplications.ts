import { useState, useEffect, useCallback } from "react";
import { ApplicationData } from "../types/interfaces";
// ★変更: リポジトリをインポート
import { applicationRepository } from "../repositories/applicationRepository";

interface UseApplicationsReturn {
  applications: ApplicationData[];
  isLoading: boolean;
  error: string | null;
  // 各操作メソッドも Promise を返すようにする (非同期だから)
  addApplication: (data: Omit<ApplicationData, "id">) => Promise<void>;
  updateApplication: (id: string, data: Partial<Omit<ApplicationData, "id">>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  reloadApplications: () => Promise<void>; // データ再読み込み用
}

export const useApplications = (): UseApplicationsReturn => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // データのフェッチ処理を useCallback でメモ化
  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await applicationRepository.getAll(); // リポジトリの getAll を呼ぶ
      setApplications(data);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("データの読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, []); // 依存配列は空、初回のみ定義

  // コンポーネントマウント時にデータをロード
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]); // fetchApplications を依存配列に入れる

  const addApplication = useCallback(async (data: Omit<ApplicationData, "id">) => {
    setIsLoading(true);
    setError(null);
    try {
      const newApp = await applicationRepository.create(data); // リポジトリの create を呼ぶ
      setApplications((prev) => [...prev, newApp]);
    } catch (err) {
      console.error("Error creating application:", err);
      setError("データの保存に失敗しました。");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []); // 依存配列は空

  const updateApplication = useCallback(
    async (id: string, data: Partial<Omit<ApplicationData, "id">>) => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedApp = await applicationRepository.update(id, data); // リポジトリの update を呼ぶ
        setApplications((prev) => prev.map((app) => (app.id === id ? updatedApp : app)));
      } catch (err) {
        console.error("Error updating application:", err);
        setError("データの更新に失敗しました。");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  ); // 依存配列は空

  const deleteApplication = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await applicationRepository.delete(id); // リポジトリの delete を呼ぶ
      setApplications((prev) => prev.filter((app) => app.id !== id));
    } catch (err) {
      console.error("Error deleting application:", err);
      setError("データの削除に失敗しました。");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []); // 依存配列は空

  return {
    applications,
    isLoading,
    error,
    addApplication,
    updateApplication,
    deleteApplication,
    reloadApplications: fetchApplications,
  };
};
