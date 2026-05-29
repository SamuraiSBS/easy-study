from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    bot_token: str = ""
    admin_telegram_id: int | None = None
    mini_app_url: str = "http://localhost:5173"
    api_base_url: str = "http://localhost:8000"

    database_url: str = "sqlite:///./easy_study.db"
    admin_api_token: str = Field(default="change-me-admin-token")

    allow_dev_auth: bool = True
    dev_telegram_id: int = 100001
    dev_username: str = "demo_student"
    dev_first_name: str = "Demo"
    dev_last_name: str = "Student"


@lru_cache
def get_settings() -> Settings:
    return Settings()
