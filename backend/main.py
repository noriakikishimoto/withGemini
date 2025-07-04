from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

# models.py から AppSchema をインポート
from models import AppSchema, FAQ

# db.py からアプリスキーマのCRUD操作関数をインポート
from db import (
    get_all_app_schemas,
    get_app_schema_by_id,
    create_app_schema,
    update_app_schema,
    delete_app_schema,
    get_all_faqs,
    get_faq_by_id,
    create_faq,
    update_faq,
    delete_faq,
)

# FastAPI アプリケーションのインスタンスを作成
app = FastAPI()

# ★ここからCORS設定を追加★
origins = [
    "http://localhost",
    "http://localhost:5173",
    # 必要に応じて、ここにデプロイ後のフロントエンドのURLを追加
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # 全てのHTTPメソッドを許可 (GET, POST, PUT, DELETEなど)
    allow_headers=["*"],  # 全てのHTTPヘッダーを許可
)


# ルートエンドポイントの定義 (既存)
@app.get("/")
async def read_root():
    """
    アプリケーションのルートにアクセスしたときに 'Hello: World!' を返すエンドポイント
    """
    return {"Hello": "World!"}


# ----------------------------------------------------
# アプリスキーマ API エンドポイント
# ----------------------------------------------------


@app.get("/app-schemas", response_model=List[AppSchema])
async def get_all_schemas_api():
    """
    全てのアプリスキーマを取得する
    """
    # print(await get_all_app_schemas())
    return await get_all_app_schemas()


@app.get("/app-schemas/{app_id}", response_model=AppSchema)
async def get_schema_by_id_api(app_id: str):
    """
    指定されたIDのアプリスキーマを取得する
    """
    schema = await get_app_schema_by_id(app_id)
    if schema is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="AppSchema not found"
        )
    return schema


@app.post("/app-schemas", response_model=AppSchema, status_code=status.HTTP_201_CREATED)
async def create_schema_api(schema: AppSchema):
    """
    新しいアプリスキーマを作成する
    """
    try:
        # DB層で重複チェックを処理しているので、ここでは直接呼び出し
        new_schema = await create_app_schema(schema)
        return new_schema
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(e)
        )  # 重複エラーは 409 Conflict


@app.put("/app-schemas/{app_id}", response_model=AppSchema)
async def update_schema_api(app_id: str, schema: AppSchema):
    """
    既存のアプリスキーマを更新する
    """
    if app_id != schema.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="App ID in path and body do not match",
        )
    try:
        updated_schema = await update_app_schema(app_id, schema)
        return updated_schema
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )  # 更新対象が見つからない場合など


@app.delete("/app-schemas/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schema_api(app_id: str):
    """
    アプリスキーマを削除する
    """
    try:
        await delete_app_schema(app_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )  # 削除対象が見つからない場合


# ----------------------------------------------------
# ★追加: FAQ API エンドポイント
# ----------------------------------------------------


@app.get("/faqs", response_model=List[FAQ])
async def get_all_faqs_api():
    """
    全てのFAQを取得する
    """
    return await get_all_faqs()


@app.get("/faqs/{faq_id}", response_model=FAQ)
async def get_faq_by_id_api(faq_id: str):
    """
    指定されたIDのFAQを取得する
    """
    try:
        faq = await get_faq_by_id(faq_id)
        return faq
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@app.post("/faqs", response_model=FAQ, status_code=status.HTTP_201_CREATED)
async def create_faq_api(faq: FAQ):
    """
    新しいFAQを作成する (質問文から埋め込みベクトルを自動生成)
    """
    try:
        new_faq = await create_faq(faq)
        return new_faq
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@app.put("/faqs/{faq_id}", response_model=FAQ)
async def update_faq_api(faq_id: str, faq: FAQ):
    """
    既存のFAQを更新する (質問文が変更された場合、埋め込みベクトルを再生成)
    """
    if faq_id != faq.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="FAQ ID in path and body do not match",
        )
    try:
        updated_faq = await update_faq(faq_id, faq)
        return updated_faq
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@app.delete("/faqs/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq_api(faq_id: str):
    """
    指定されたIDのFAQを削除する
    """
    try:
        await delete_faq(faq_id)
        return {"message": "FAQ deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
