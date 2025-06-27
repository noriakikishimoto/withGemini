// src/repositories/genericDataRepository.ts

import { GenericRecord, BaseRepository } from "../types/interfaces"; // GenericRecord と BaseRepository をインポート
import { httpClient } from "../lib/httpClient"; // httpClient をインポート

// ----------------------------------------------------
// 実装 1: ローカルストレージ版の汎用データリポジトリ
// 各アプリのデータを個別のキーで保存する
// ----------------------------------------------------
const localStorageGenericDataRepository: BaseRepository<
  GenericRecord,
  Omit<GenericRecord, "id">,
  Partial<Omit<GenericRecord, "id">>,
  string
> = {
  // app_id を引数に追加して、どのアプリのデータを扱うかを識別する
  async getAll(appId: string): Promise<GenericRecord[]> {
    // ★appId を追加
    console.log(`Repository (LocalStorage GenericData): アプリID "${appId}" のデータを読み込み中...`);
    const storedData = localStorage.getItem(`appData_${appId}`); // キーをアプリIDと組み合わせる
    if (storedData) {
      try {
        return JSON.parse(storedData) as GenericRecord[];
      } catch (error) {
        console.error(`LocalStorage GenericData 解析エラー (AppID: ${appId}):`, error);
        return [];
      }
    }
    return [];
  },

  async getById(recordId: string, appId: string): Promise<GenericRecord | null> {
    // ★appId, recordId を追加
    const records = await this.getAll(appId);
    return records.find((record) => record.id === recordId) || null;
  },

  async create(
    data: Omit<GenericRecord, "id">,
    appId: string,
    currentUserId?: string
  ): Promise<GenericRecord> {
    // ★appId を追加
    const records = await this.getAll(appId);
    const now = new Date().toISOString(); // 現在日時
    const userId = currentUserId || "guest"; // ユーザーID (ゲストの場合は 'guest')

    const newRecord: GenericRecord = {
      ...data,
      id: String(Date.now()),
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      updatedBy: userId,
    };
    const updatedRecords = [...records, newRecord];
    localStorage.setItem(`appData_${appId}`, JSON.stringify(updatedRecords));
    return newRecord;
  },

  async update(
    recordId: string,
    data: Partial<Omit<GenericRecord, "id">>,
    appId: string,
    currentUserId?: string
  ): Promise<GenericRecord> {
    // ★appId, recordId を追加
    const records = await this.getAll(appId);
    const now = new Date().toISOString(); // 現在日時
    const userId = currentUserId || "guest"; // ユーザーID (ゲストの場合は 'guest')

    let updatedRecord: GenericRecord | undefined;
    const updatedRecords = records
      .map((record) => {
        if (record.id === recordId) {
          updatedRecord = { ...record, ...data, updatedAt: now, updatedBy: userId };
          return updatedRecord;
        }
        return record;
      })
      .filter((record): record is GenericRecord => record !== undefined);

    if (!updatedRecord) throw new Error("Generic record not found for update");
    localStorage.setItem(`appData_${appId}`, JSON.stringify(updatedRecords));
    return updatedRecord;
  },

  async delete(recordId: string, appId: string): Promise<void> {
    // ★appId, recordId を追加
    const records = await this.getAll(appId);
    const updatedRecords = records.filter((record) => record.id !== recordId);
    localStorage.setItem(`appData_${appId}`, JSON.stringify(updatedRecords));
  },
};

// ----------------------------------------------------
// 実装 2: API（FastAPI）版の汎用データリポジトリ (まだ仮実装)
// ----------------------------------------------------
// 各メソッドに appId を含めてエンドポイントを構築する
const apiGenericDataRepository: BaseRepository<
  GenericRecord,
  Omit<GenericRecord, "id">,
  Partial<Omit<GenericRecord, "id">>,
  string
> = {
  // これらのメソッドも appId を引数に取るように修正する
  // 例: httpClient.get<GenericRecord[]>(`/app-data/${appId}/records`);
  async getAll(appId: string): Promise<GenericRecord[]> {
    return localStorageGenericDataRepository.getAll(appId);
  },
  async getById(recordId: string, appId: string): Promise<GenericRecord | null> {
    return localStorageGenericDataRepository.getById(recordId, appId);
  },
  async create(data: Omit<GenericRecord, "id">, appId: string): Promise<GenericRecord> {
    return localStorageGenericDataRepository.create(data, appId);
  },
  async update(
    recordId: string,
    data: Partial<Omit<GenericRecord, "id">>,
    appId: string
  ): Promise<GenericRecord> {
    return localStorageGenericDataRepository.update(recordId, data, appId);
  },
  async delete(recordId: string, appId: string): Promise<void> {
    return localStorageGenericDataRepository.delete(recordId, appId);
  },
};

// ----------------------------------------------------
// 使用する汎用データリポジトリの選択
// ----------------------------------------------------
export const genericDataRepository: BaseRepository<
  GenericRecord,
  Omit<GenericRecord, "id">,
  Partial<Omit<GenericRecord, "id">>,
  string
> = localStorageGenericDataRepository;
// export const genericDataRepository = apiGenericDataRepository; // バックエンド連携時に切り替える

// BaseRepository のメソッドシグネチャと実際の引数が異なるため、
// より厳密には getAll: (appId: string) => Promise<GenericRecord[]> のように、
// appId を含む BaseRepository のサブインターフェースを定義することも可能
