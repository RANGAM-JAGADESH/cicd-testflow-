"""CI/CD TestFlow - a deliberately small FastAPI app built to demonstrate testing and CI/CD."""
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

app = FastAPI(title="CI/CD TestFlow", version="1.0.0")


class ItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)


class Item(ItemCreate):
    id: int


# In-memory store (intentionally simple: no database needed for this project).
items_db: dict[int, Item] = {}
_next_id = 1


def reset_db() -> None:
    """Restore the seed data. Used at startup and by tests for isolation."""
    global _next_id
    items_db.clear()
    items_db[1] = Item(id=1, name="Unit tests", description="Fast, isolated Pytest checks")
    items_db[2] = Item(id=2, name="Docker build", description="Reproducible container image")
    _next_id = 3


reset_db()


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/items", response_model=list[Item])
def list_items():
    return list(items_db.values())


@app.post("/items", response_model=Item, status_code=201)
def create_item(payload: ItemCreate):
    global _next_id
    item = Item(id=_next_id, **payload.model_dump())
    items_db[item.id] = item
    _next_id += 1
    return item


@app.get("/items/{item_id}", response_model=Item)
def get_item(item_id: int):
    item = items_db.get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.get("/pipeline/status")
def pipeline_status():
    return {
        "status": "passing",
        "environment": os.getenv("APP_ENV", "production"),
        "last_build": "success",
    }


# Serve the built React app (if present). Registered last so API routes win.
STATIC_DIR = Path(os.getenv("STATIC_DIR", Path(__file__).resolve().parents[2] / "frontend" / "dist"))
if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="frontend")
