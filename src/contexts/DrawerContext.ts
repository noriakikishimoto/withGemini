import { createContext, useContext } from "react";

interface DrawerContextType {
  drawerOpen: boolean;
  // setDrawerOpen: (open: boolean) => void; // 必要であればセッターも公開
}

export const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawerContext = () => {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    throw new Error("useDrawerContext must be used within a DrawerProvider");
  }
  return context;
};
