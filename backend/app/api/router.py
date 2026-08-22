from fastapi import APIRouter

from app.api.routes import analyze, chat, health

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(analyze.router)
api_router.include_router(chat.router)
