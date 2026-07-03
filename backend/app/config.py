from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # LLM: any pydantic-ai "provider:model" string. Gemini needs
    # GEMINI_API_KEY in the environment, Anthropic needs ANTHROPIC_API_KEY.
    # gemini-2.5-flash with thinking disabled: fast enough for a chat UI.
    # (gemini-3.5-flash is a thinking model — noticeably slower + overloaded.)
    llm_model: str = "google:gemini-2.5-flash"
    # Used automatically when the primary model errors (e.g. 503 overload).
    # Set empty to disable.
    llm_fallback_model: str = "google:gemini-2.5-flash-lite"

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

    cors_origins: str = (
        "https://vsezol.com,https://www.vsezol.com,"
        "https://vsezol.github.io,http://localhost:5173"
    )

    rate_limit_requests: int = 30
    rate_limit_window_seconds: int = 300
    max_history_messages: int = 120
    # Hard cap of visitor messages per conversation (token protection)
    max_user_messages: int = 20
    # Sessions idle longer than this are dropped
    session_ttl_days: int = 7

    # Admin API auth (HTTP Basic; the admin UI lives in the site SPA at /#admin)
    admin_user: str = "admin"
    admin_password: str = ""  # empty → admin API disabled

    # Public site URL ( /admin on the backend redirects to <site_url>/#admin )
    site_url: str = "https://vsezol.com"

    # Where the editable agent config lives. Defaults to /data (attach a
    # Railway volume there) or ./agent_config.json as a non-persistent
    # fallback.
    config_path: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
