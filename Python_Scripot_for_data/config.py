"""
config.py
=============================================================================
Central Configuration Module for Angel One SmartAPI Options Ingestion Pipeline.
Loads parameters from .env via python-dotenv with fallback defaults.
=============================================================================
"""

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

# Base directories and .env loading
_BASE_DIR = Path(__file__).resolve().parent
_ENV_PATH = _BASE_DIR / ".env"

try:
    from dotenv import load_dotenv
    if _ENV_PATH.is_file():
        load_dotenv(dotenv_path=_ENV_PATH, override=True)
    else:
        load_dotenv()
except ImportError:
    # Pure Python fallback parser if python-dotenv is not installed
    if _ENV_PATH.is_file():
        with open(_ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k and k not in os.environ:
                    os.environ[k] = v


@dataclass(frozen=True)
class Config:
    """Immutable application settings container for Angel One SmartAPI."""

    # Broker Identity
    broker: str = "ANGEL_ONE"

    # Angel One SmartAPI Credentials
    smart_api_key: str = field(
        default_factory=lambda: os.getenv("SMART_API_KEY", "").strip()
    )
    client_code: str = field(
        default_factory=lambda: os.getenv("CLIENT_CODE", "").strip()
    )
    pin: str = field(
        default_factory=lambda: os.getenv("PIN", "").strip()
    )
    totp_secret: str = field(
        default_factory=lambda: os.getenv("TOTP_SECRET", "").strip()
    )

    # Optional pre-existing tokens
    feed_token: str = field(
        default_factory=lambda: os.getenv("FEED_TOKEN", "").strip()
    )
    jwt_token: str = field(
        default_factory=lambda: os.getenv("JWT_TOKEN", "").strip()
    )

    # Session token cache path (preserves tokens across daily restarts)
    token_cache_path: str = field(
        default_factory=lambda: os.getenv("TOKEN_CACHE_PATH", ".angel_token.json").strip()
    )

    # Index & Options Strike Ladder Configuration
    index_symbol: str = field(
        default_factory=lambda: os.getenv("INDEX_SYMBOL", "NIFTY").upper().strip()
    )
    strike_step: float = field(
        default_factory=lambda: float(os.getenv("STRIKE_STEP", "50"))
    )
    strikes_around_atm: int = field(
        default_factory=lambda: int(os.getenv("STRIKES_AROUND_ATM", "10"))
    )
    fallback_spot_price: float = field(
        default_factory=lambda: float(os.getenv("FALLBACK_SPOT_PRICE", "24500.0"))
    )

    # Ingestion Buffer & Consumer Batching
    queue_maxsize: int = field(
        default_factory=lambda: int(os.getenv("QUEUE_MAXSIZE", "100000"))
    )
    batch_size: int = field(
        default_factory=lambda: int(os.getenv("BATCH_SIZE", "250"))
    )
    batch_timeout_ms: float = field(
        default_factory=lambda: float(os.getenv("BATCH_TIMEOUT_MS", "50.0"))
    )

    # WebSocket Resilience & Reconnection
    ws_reconnect_max_tries: int = field(
        default_factory=lambda: int(os.getenv("WS_RECONNECT_MAX_TRIES", "50"))
    )
    ws_reconnect_max_delay: int = field(
        default_factory=lambda: int(os.getenv("WS_RECONNECT_MAX_DELAY", "10"))
    )
    ws_reconnect_interval: int = field(
        default_factory=lambda: int(os.getenv("WS_RECONNECT_INTERVAL", "2"))
    )

    # Downstream Persistence & Logging
    sink_type: str = field(
        default_factory=lambda: os.getenv("SINK_TYPE", "sqlite").lower().strip()
    )
    db_path: str = field(
        default_factory=lambda: os.getenv("DB_PATH", "market_depth_ticks.db").strip()
    )
    log_level: str = field(
        default_factory=lambda: os.getenv("LOG_LEVEL", "INFO").upper().strip()
    )

    # Offline / Mock Simulation Mode
    mock_feed: bool = field(
        default_factory=lambda: os.getenv("MOCK_FEED", "false").lower() in ("1", "true", "yes")
    )

    def get_token_cache_file(self) -> Path:
        """Returns Path object for the session cache file."""
        return _BASE_DIR / self.token_cache_path


# Global configuration singleton
cfg = Config()
