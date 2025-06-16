import { useState, useEffect } from "react";

// useLocalStorage カスタムフックの定義
// ジェネリクス <T> を使うことで、どんな型のデータでも扱えるようにする
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // ステートを定義。初期値はローカルストレージから読み込むか、引数のinitialValueを使う
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      // ローカルストレージに値があればパースして返す、なければinitialValueを返す
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue; // エラー時は初期値を返す
    }
  });

  // value が変更されたらローカルストレージに保存する副作用
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key, value]); // key または value が変更されたら実行

  // [現在の値, 値を更新する関数] をタプルとして返す
  return [value, setValue];
}
