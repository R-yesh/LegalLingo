"""Application configuration, loaded from environment variables / .env."""
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the LegalLingo API.

    Values are read from environment variables (or a local .env file, which
    is git-ignored). See .env.example for the full list of supported keys.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "LegalLingo API"
    environment: str = "development"

    # Comma-separated list of allowed origins for CORS. Covers both the
    # Vite dev server (default port 5173) and a Next.js dev server (3000),
    # since the frontend may run under either during this migration.
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"

    max_upload_size_mb: int = Field(default=20, gt=0)

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
