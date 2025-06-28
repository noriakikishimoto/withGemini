import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { appSchemaRepository } from "../repositories/appSchemaRepository";
import { userRepository } from "../repositories/userRepository";
import { AppSchema, User } from "../types/interfaces";

// GlobalDataContext の型定義
interface GlobalDataContextType {
  allUsers: User[];
  allAppSchemas: AppSchema[];
  isLoadingGlobalData: boolean;
  globalDataError: string | null;
  refetchGlobalData: () => void; // データを再取得するための関数
}

// Context の作成
const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

// GlobalDataProvider コンポーネント
interface GlobalDataProviderProps {
  children: ReactNode;
}

export const GlobalDataProvider: React.FC<GlobalDataProviderProps> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allAppSchemas, setAllAppSchemas] = useState<AppSchema[]>([]);
  const [isLoadingGlobalData, setIsLoadingGlobalData] = useState<boolean>(true);
  const [globalDataError, setGlobalDataError] = useState<string | null>(null);

  const fetchAllGlobalData = async () => {
    setIsLoadingGlobalData(true);
    setGlobalDataError(null);
    try {
      const [users, schemas] = await Promise.all([
        userRepository.getAll(),
        appSchemaRepository.getAll(),
      ]);
      setAllUsers(users);
      setAllAppSchemas(schemas);
    } catch (err) {
      console.error("Error fetching global data:", err);
      setGlobalDataError("参照データの読み込みに失敗しました。");
    } finally {
      setIsLoadingGlobalData(false);
    }
  };

  useEffect(() => {
    fetchAllGlobalData();
  }, []); // 初回マウント時のみ実行

  // データを再取得するためのハンドラ
  const refetchGlobalData = () => {
    fetchAllGlobalData();
  };

  const contextValue = {
    allUsers,
    allAppSchemas,
    isLoadingGlobalData,
    globalDataError,
    refetchGlobalData,
  };

  return <GlobalDataContext.Provider value={contextValue}>{children}</GlobalDataContext.Provider>;
};

// GlobalDataContext を利用するためのカスタムフック
export const useGlobalDataContext = () => {
  const context = useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error("useGlobalDataContext must be used within a GlobalDataProvider");
  }
  return context;
};
