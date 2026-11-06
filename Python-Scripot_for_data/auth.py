"""
auth.py
=============================================================================
Angel One SmartAPI Authentication & Session Manager.
Implements automated TOTP generation via pyotp, session generation with
`smart_connect.generateSession(CLIENT_CODE, PIN, totp)`, and token caching.
=============================================================================
"""

import json
import logging
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from config import Config, cfg

logger = logging.getLogger("auth")


@dataclass
class AngelSession:
    """Container holding authenticated Angel One tokens."""

    jwt_token: str        # auth_token used for WebSocket handshake & REST APIs
    feed_token: str       # feed_token used for SmartWebSocketV2
    refresh_token: str    # refresh_token for renewing expired JWT tokens
    client_code: str
    smart_connect: Optional[Any] = None


class AngelAuthManager:
    """
    Manages session lifecycle for Angel One SmartAPI:
    1. Computes current 6-digit TOTP dynamically with pyotp.
    2. Generates session via `smart_connect.generateSession(CLIENT_CODE, PIN, totp)`.
    3. Extracts and persists `jwtToken`, `feedToken`, and `refreshToken`.
    4. Caches tokens locally to avoid redundant daily logins.
    """

    def __init__(self, config: Config = cfg) -> None:
        self.config = config
        self.cache_file = config.get_token_cache_file()

    def generate_totp(self) -> str:
        """Generates active 6-digit Time-based One-Time Password (TOTP)."""
        if not self.config.totp_secret:
            raise ValueError("TOTP_SECRET is not configured in .env")

        try:
            import pyotp
        except ImportError:
            raise RuntimeError("pyotp is not installed. Run `pip install pyotp`.")

        clean_secret = self.config.totp_secret.replace(" ", "").strip()
        totp = pyotp.TOTP(clean_secret).now()
        logger.debug("Computed active 6-digit TOTP.")
        return totp

    def get_session(self) -> Optional[AngelSession]:
        """
        Retrieves or generates an authenticated AngelSession:
        1. Checks for valid cached session from today.
        2. Computes fresh TOTP and calls smart_connect.generateSession().
        3. Persists tokens locally.
        """
        if self.config.mock_feed:
            logger.info("MOCK_FEED is enabled. Skipping live Angel One login.")
            return None

        if not self.config.smart_api_key or not self.config.client_code or not self.config.pin:
            logger.warning(
                "Angel One credentials (SMART_API_KEY, CLIENT_CODE, PIN) incomplete in .env. "
                "Running in offline / simulation mode."
            )
            return None

        # 1. Attempt loading valid cached session from today
        cached = self._load_cached_session()
        if cached:
            logger.info("Found cached Angel One session from today. Reusing tokens.")
            return cached

        # 2. Initialize SmartConnect and generate fresh session
        try:
            from SmartApi import SmartConnect
        except ImportError:
            logger.error("The 'smartapi-python' library is not installed. Run `pip install smartapi-python`.")
            return None

        smart_connect = SmartConnect(api_key=self.config.smart_api_key)

        try:
            totp = self.generate_totp()
            logger.info("Authenticating with Angel One SmartAPI (Client: %s)...", self.config.client_code)

            login_data = smart_connect.generateSession(
                clientCode=self.config.client_code,
                password=self.config.pin,
                totp=totp,
            )

            if not login_data or not login_data.get("status"):
                err_msg = login_data.get("message") if isinstance(login_data, dict) else str(login_data)
                logger.error("Angel One login failed: %s", err_msg)
                return None

            data_block = login_data.get("data", {})
            jwt_token = data_block.get("jwtToken", "")
            feed_token = data_block.get("feedToken", "")
            refresh_token = data_block.get("refreshToken", "")

            if not jwt_token or not feed_token:
                logger.error("Login response missing jwtToken or feedToken: %s", data_block)
                return None

            session = AngelSession(
                jwt_token=jwt_token,
                feed_token=feed_token,
                refresh_token=refresh_token,
                client_code=self.config.client_code,
                smart_connect=smart_connect,
            )

            # Save to disk cache
            self._save_cached_session(session)
            logger.info("Angel One session created successfully (feed_token & jwt_token acquired).")
            return session

        except Exception as exc:
            logger.error("Exception occurred during Angel One authentication: %s", exc)
            return None

    def _load_cached_session(self) -> Optional[AngelSession]:
        """Loads session if cache file exists and matches today's date."""
        if not self.cache_file.is_file():
            return None
        try:
            with open(self.cache_file, "r", encoding="utf-8") as f:
                data: Dict[str, Any] = json.load(f)

            if data.get("date") != date.today().isoformat():
                return None

            jwt = data.get("jwt_token")
            feed = data.get("feed_token")
            ref = data.get("refresh_token")
            client = data.get("client_code", self.config.client_code)

            if jwt and feed:
                return AngelSession(
                    jwt_token=jwt,
                    feed_token=feed,
                    refresh_token=ref or "",
                    client_code=client,
                )
        except Exception as e:
            logger.debug("Failed to read token cache: %s", e)
        return None

    def _save_cached_session(self, session: AngelSession) -> None:
        """Persists tokens to JSON cache for today's session."""
        try:
            payload = {
                "date": date.today().isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "client_code": session.client_code,
                "jwt_token": session.jwt_token,
                "feed_token": session.feed_token,
                "refresh_token": session.refresh_token,
            }
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
            logger.info("Persisted Angel One session tokens to %s", self.cache_file)
        except Exception as e:
            logger.warning("Could not persist session cache: %s", e)


def get_angel_session(config: Config = cfg) -> Optional[AngelSession]:
    """Helper shortcut to obtain active AngelSession."""
    manager = AngelAuthManager(config)
    return manager.get_session()
