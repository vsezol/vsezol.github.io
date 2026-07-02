from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # LLM (ANTHROPIC_API_KEY is read from the environment by pydantic-ai)
    anthropic_model: str = "claude-opus-4-8"

    # Owner
    owner_name: str = "Vsevolod Zolotov"
    owner_email: str = "vsezold@gmail.com"
    owner_timezone: str = "Europe/Moscow"

    # Google Calendar OAuth (see scripts/get_google_refresh_token.py)
    google_client_id: str = ""
    google_client_secret: str = ""
    google_refresh_token: str = ""

    # Returns a fake Meet link instead of touching Google Calendar.
    # Local development only — never enable in production.
    demo_mode: bool = False

    cors_origins: str = "https://vsezol.github.io,http://localhost:5173"

    rate_limit_requests: int = 30
    rate_limit_window_seconds: int = 300
    max_history_messages: int = 120

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
