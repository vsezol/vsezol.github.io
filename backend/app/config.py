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

    # Coarse per-IP anti-flood over all /api/ paths.
    rate_limit_requests: int = 30
    rate_limit_window_seconds: int = 60
    max_history_messages: int = 120
    # Chat messages allowed per IP per hour (unlimited per conversation, but
    # capped hourly so a spammer can't burn tokens). On exceed the visitor is
    # told the limit resets within an hour — no LLM call is made.
    messages_per_hour: int = 20
    # Sessions idle longer than this are dropped
    session_ttl_days: int = 7

    # --- Abuse backstops (work even before Cloudflare is in front) ---
    # Global circuit breaker: max agent.run calls across all visitors per
    # hour. Over this the API replies "temporarily unavailable" WITHOUT
    # calling the LLM — a hard ceiling on token spend.
    global_llm_calls_per_hour: int = 500
    # Global cap on real bookings per day (calendar-flood protection).
    global_bookings_per_day: int = 20
    # Max upcoming meetings a single visitor email may hold.
    bookings_per_email: int = 2

    # Instant kill switches (flip in Railway env, no redeploy needed).
    chat_enabled: bool = True
    booking_enabled: bool = True

    # Cloudflare Turnstile secret — proves the request came from a real
    # browser. Empty = verification disabled (no-op until CF is set up).
    turnstile_secret: str = ""
    # Shared secret Cloudflare injects as a header; when set, the backend
    # rejects any request without it (blocks direct hits to the raw Railway
    # domain that bypass Cloudflare). Empty = disabled.
    edge_secret: str = ""
    edge_secret_header: str = "x-edge-secret"

    # Optional Telegram alerting on abuse spikes (empty = disabled).
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

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
