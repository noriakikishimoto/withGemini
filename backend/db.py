import json
from pathlib import Path
from typing import List, TypeVar, Type, Optional
from pydantic import BaseModel
from uuid import uuid4
from sentence_transformers import SentenceTransformer

from models import (
    AppSchema,
    FAQ,
)  # from .models を正しくインポート

# プロジェクトのルートディレクトリからのデータフォルダのパス
# 例: backend/data
# DATA_DIR = Path("backend") / "data"
CURRENT_DIR = Path(__file__).parent  # db.py があるディレクトリ (backend)
# PROJECT_ROOT = CURRENT_DIR.parent  # backend の親ディレクトリ (withGemini)
DATA_DIR = CURRENT_DIR / "data"  # db.py の横に data フォルダがある場合

# ★修正: TypeVar を BaseModel に制約する
T = TypeVar("T", bound=BaseModel)  # BaseModel のサブクラスであることをMypyに伝える


# ★追加: FAQのデータファイルパス
FAQS_FILE = DATA_DIR / "faqs.json"

try:
    embedding_model = SentenceTransformer(
        "cl-tohoku/bert-base-japanese-whole-word-masking"
    )
    print("SentenceTransformer model loaded successfully.")
except Exception as e:
    print(f"Error loading SentenceTransformer model: {e}")
    print(
        "Please ensure you have internet access, enough disk space, and all necessary dependencies like 'fugashi' and 'unidic-lite' installed."
    )
    embedding_model = None


async def get_embedding(text: str) -> Optional[List[float]]:
    if embedding_model is None:
        print("Embedding model not loaded. Cannot generate embedding.")
        return None
    try:
        embedding = embedding_model.encode(text, convert_to_numpy=True).tolist()
        return embedding
    except Exception as e:
        print(f"Error generating embedding for text '{text}': {e}")
        return None


T = TypeVar("T", bound=BaseModel)


async def _read_data(file_path: Path, model_cls: Type[T]) -> List[T]:
    if not file_path.exists():
        return []

    with open(file_path, "r", encoding="utf-8") as f:
        try:
            content = f.read()
            if not content:
                return []
            data = json.loads(content)

            if not isinstance(data, list):
                print(
                    f"Warning: Data in {file_path} is not a list. Returning empty list."
                )
                file_path.unlink(missing_ok=True)
                return []

            return [model_cls.model_validate(item) for item in data]
        except json.JSONDecodeError as e:
            print(f"JSONDecodeError reading {file_path}: {e}")
            file_path.unlink(missing_ok=True)
            raise
        except Exception as e:
            print(f"Error validating data from {file_path}: {e}")
            file_path.unlink(missing_ok=True)
            raise


async def _write_data(
    file_path: Path, data: List[BaseModel]
):  # data は BaseModel のリストを期待
    file_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(
                [item.model_dump(mode="json") for item in data],
                f,
                indent=4,
                ensure_ascii=False,
            )
    except Exception as e:
        print(f"Error writing to {file_path}: {e}")
        raise


# ----------------------------------------------------
# アプリスキーマのCRUD操作関数
# ----------------------------------------------------

# models.py から AppSchema をインポートするまでコメントアウト
# from .models import AppSchema, FieldDefinition, FormFieldType, CommonFormFieldComponent

# AppSchema に必要なすべてのフィールドをインポート


APP_SCHEMA_ENTITY_NAME = "app_schemas"


async def get_all_app_schemas() -> List[AppSchema]:
    """全てのアプリスキーマを取得する"""
    return await _read_data(APP_SCHEMA_ENTITY_NAME, AppSchema)


async def get_app_schema_by_id(app_id: str) -> Optional[AppSchema]:
    """指定されたIDのアプリスキーマを取得する"""
    schemas = await get_all_app_schemas()
    return next((s for s in schemas if s.id == app_id), None)


async def create_app_schema(schema_data: AppSchema) -> AppSchema:
    """新しいアプリスキーマを作成する"""
    schemas = await get_all_app_schemas()
    if any(s.id == schema_data.id for s in schemas):
        raise ValueError(f"AppSchema with ID {schema_data.id} already exists.")
    if any(s.name == schema_data.name for s in schemas):
        raise ValueError(f"AppSchema with name '{schema_data.name}' already exists.")

    schemas.append(schema_data)
    await _write_data(APP_SCHEMA_ENTITY_NAME, schemas)
    return schema_data


async def update_app_schema(app_id: str, schema_data: AppSchema) -> AppSchema:
    """既存のアプリスキーマを更新する"""
    schemas = await get_all_app_schemas()
    updated = False
    for i, s in enumerate(schemas):
        if s.id == app_id:
            # 名前変更時の重複チェック (自分自身は除く)
            if any(
                other_s.id != app_id and other_s.name == schema_data.name
                for other_s in schemas
            ):
                raise ValueError(
                    f"AppSchema with name '{schema_data.name}' already exists."
                )
            schemas[i] = schema_data  # IDは変更しない
            updated = True
            break
    if not updated:
        raise ValueError(f"AppSchema with ID {app_id} not found for update.")

    await _write_data(APP_SCHEMA_ENTITY_NAME, schemas)
    return schema_data


async def delete_app_schema(app_id: str):
    """アプリスキーマを削除する"""
    schemas = await get_all_app_schemas()
    original_count = len(schemas)
    schemas = [s for s in schemas if s.id != app_id]
    if len(schemas) == original_count:
        raise ValueError(f"AppSchema with ID {app_id} not found for deletion.")

    await _write_data(APP_SCHEMA_ENTITY_NAME, schemas)


# ----------------------------------------------------
# ★追加: FAQ CRUD 操作
# ----------------------------------------------------
async def get_all_faqs() -> List[FAQ]:
    data = await _read_data(FAQS_FILE, FAQ)
    return data


async def get_faq_by_id(faq_id: str) -> FAQ:
    faqs = await get_all_faqs()
    for faq in faqs:
        if faq.id == faq_id:
            return faq
    raise ValueError(f"FAQ with ID {faq_id} not found")


async def create_faq(faq: FAQ) -> FAQ:
    faqs = await get_all_faqs()
    if not faq.id:
        faq.id = str(uuid4())

    if faq.id in [f.id for f in faqs]:
        raise ValueError(f"FAQ with ID {faq.id} already exists")

    if faq.question and faq.question_embedding is None:
        faq.question_embedding = await get_embedding(faq.question)
        if faq.question_embedding is None:
            print(
                f"Warning: Failed to generate embedding for FAQ ID {faq.id}. Embedding will be None."
            )

    faqs.append(faq)
    await _write_data(FAQS_FILE, faqs)  # ★修正: faqs をそのまま渡す
    return faq


async def update_faq(faq_id: str, faq: FAQ) -> FAQ:
    faqs = await get_all_faqs()
    found = False
    updated_faqs = []
    for f in faqs:
        if f.id == faq_id:
            if f.question != faq.question:
                faq.question_embedding = await get_embedding(faq.question)
            elif faq.question_embedding is None and faq.question is not None:
                faq.question_embedding = await get_embedding(faq.question)

            updated_faqs.append(faq)
            found = True
        else:
            updated_faqs.append(f)
    if not found:
        raise ValueError(f"FAQ with ID {faq_id} not found")
    await _write_data(FAQS_FILE, updated_faqs)  # ★修正: updated_faqs をそのまま渡す
    return faq


async def delete_faq(faq_id: str):
    faqs = await get_all_faqs()
    initial_len = len(faqs)
    updated_faqs = [f for f in faqs if f.id != faq_id]
    if len(updated_faqs) == initial_len:
        raise ValueError(f"FAQ with ID {faq_id} not found")
    await _write_data(FAQS_FILE, updated_faqs)  # ★修正: updated_faqs をそのまま渡す
