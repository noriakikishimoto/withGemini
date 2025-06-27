import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, userRole } from "../types/interfaces"; // userRole もインポート

interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  role: userRole; // userRole を使用
}

interface UserContextType {
  currentUser: CurrentUser | null;
  login: (user: User) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined); // ★ここに export が必要

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      // localStorage から読み込んだ parsedUser の role が有効な userRole であるか確認
      if (parsedUser && (parsedUser.role === "admin" || parsedUser.role === "user")) {
        return parsedUser as CurrentUser;
      }
      return null;
    } catch (error) {
      console.error("Failed to parse currentUser from localStorage", error);
      return null;
    }
  });

  const login = (user: User) => {
    // User インターフェースの role は optional なので、デフォルト値を与える
    const userToStore: CurrentUser = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role || "user", // role が undefined の場合を考慮
    };
    setCurrentUser(userToStore);
    localStorage.setItem("currentUser", JSON.stringify(userToStore));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  const contextValue = {
    currentUser,
    login,
    logout,
  };

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
