from urllib.parse import urlsplit

from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_origin(origin: str) -> str:
    origin = origin.strip().rstrip("/")
    parsed = urlsplit(origin)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return origin


class Settings(BaseSettings):
    app_name: str = "Easy Study API"
    database_url: str = "postgresql+asyncpg://easy_study:easy_study@localhost:5432/easy_study"
    telegram_bot_token: str = ""
    telegram_mini_app_url: str = ""
    dev_telegram_user_id: str = ""
    frontend_origin: str = "http://localhost:5173"
    frontend_origins: str = ""
    auto_create_db: bool = False
    max_request_body_bytes: int = 1024 * 1024
    upload_dir: str = "uploads"
    log_level: str = "INFO"
    telegram_polling_timeout_seconds: int = 25

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        origins = [self.frontend_origin]
        if self.telegram_mini_app_url:
            origins.append(self.telegram_mini_app_url)
        if self.frontend_origins:
            origins.extend(origin.strip() for origin in self.frontend_origins.split(","))
        return list(dict.fromkeys(normalize_origin(origin) for origin in origins if origin.strip()))


settings = Settings()
