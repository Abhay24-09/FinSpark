"""
streamer.py
=============================================================================
Angel One SmartWebSocketV2 Client Lifecycle Manager.
Implements non-blocking Mode 3 (SnapQuote / Full Depth) market data streaming,
non-blocking buffer ingestion, and resilience handlers.
=============================================================================
"""

import logging
import queue
import random
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from config import Config, cfg
from instruments import InstrumentMeta
from payload_parser import FullTickRecord, parse_angel_mode3_tick

logger = logging.getLogger("streamer")


class AngelDataStreamer:
    """
    Manages the lifecycle of Angel One SmartWebSocketV2:
    - Connects using JWT token, API key, Client Code, and Feed Token.
    - Subscribes in Mode 3 (SnapQuote: Full 5-level depth, OHLC, OI, Volume).
    - Ingests parsed ticks via non-blocking put_nowait() to prevent reactor latency.
    """

    def __init__(
        self,
        auth_token: str,
        api_key: str,
        client_code: str,
        feed_token: str,
        instrument_map: Dict[str, InstrumentMeta],
        subscription_list: List[Dict[str, Any]],
        tick_queue: "queue.Queue[FullTickRecord]",
        config: Config = cfg,
        mock_mode: bool = False,
    ) -> None:
        self.auth_token = auth_token
        self.api_key = api_key
        self.client_code = client_code
        self.feed_token = feed_token
        self.instrument_map = instrument_map
        self.subscription_list = subscription_list
        self.queue = tick_queue
        self.config = config
        self.mock_mode = mock_mode

        self.sws: Optional[Any] = None
        self._is_running = False
        self._mock_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

        # Telemetry
        self.total_ticks_received = 0
        self.dropped_ticks_count = 0
        self.last_drop_log = 0.0
        self.connection_time: Optional[float] = None
        self.reconnect_count = 0

    # -------------------------------------------------------------------------
    # WebSocket Event Callbacks
    # -------------------------------------------------------------------------
    def on_open(self, wsapp: Any) -> None:
        """Triggered upon successful connection to Angel One WebSocket server."""
        self.connection_time = time.time()
        self.reconnect_count = 0
        total_tokens = sum(len(item.get("tokens", [])) for item in self.subscription_list)

        logger.info(
            "SmartWebSocketV2 connected. Subscribing to %d contracts in Mode 3 (SnapQuote Full Depth)...",
            total_tokens,
        )

        try:
            # Angel One SmartWebSocketV2 subscription:
            # action: 1 (Subscribe), mode: 3 (SnapQuote), token_list: [{"exchangeType": 2, "tokens": [...]}]
            if hasattr(self.sws, "subscribe"):
                self.sws.subscribe(
                    correlation_id="stream_nfo_depth",
                    mode=3,
                    token_list=self.subscription_list,
                )
            logger.info("Successfully dispatched Mode 3 subscription payload to Angel One server.")
        except Exception as exc:
            logger.error("Failed to send subscription request to SmartWebSocketV2: %s", exc)

    def on_data(self, wsapp: Any, data: Any) -> None:
        """
        STRICT NON-BLOCKING Ingestion Callback.
        Parses Mode 3 tick frame and inserts into thread-safe buffer via put_nowait().
        """
        received_time = time.time()
        self.total_ticks_received += 1

        if not isinstance(data, dict):
            return

        token_str = str(data.get("token") or data.get("symbol_token") or "")
        meta = self.instrument_map.get(token_str)

        # Pure functional normalization
        record = parse_angel_mode3_tick(data, metadata=meta, received_time=received_time)

        try:
            self.queue.put_nowait(record)
        except queue.Full:
            self.dropped_ticks_count += 1
            now = time.time()
            if now - self.last_drop_log >= 5.0:
                self.last_drop_log = now
                logger.warning(
                    "BACKPRESSURE WARNING: Bounded queue is full (size=%d)! Dropped %d ticks so far.",
                    self.queue.maxsize,
                    self.dropped_ticks_count,
                )

    def on_close(self, wsapp: Any) -> None:
        """Triggered when connection terminates."""
        uptime = round(time.time() - self.connection_time, 1) if self.connection_time else 0.0
        logger.warning("SmartWebSocketV2 connection closed (Uptime: %.1fs)", uptime)

    def on_error(self, wsapp: Any, error: Any) -> None:
        """Triggered on socket error."""
        logger.error("SmartWebSocketV2 Error encountered: %s", error)

    # -------------------------------------------------------------------------
    # Connection Lifecycle
    # -------------------------------------------------------------------------
    def start(self, threaded: bool = True) -> None:
        """Initializes and opens the SmartWebSocketV2 stream."""
        self._is_running = True
        self._stop_event.clear()

        if self.mock_mode:
            logger.info("Starting AngelDataStreamer in MOCK / SIMULATION mode...")
            self._start_mock_feed()
            return

        try:
            from SmartApi.smartWebSocketV2 import SmartWebSocketV2
        except ImportError:
            logger.error("SmartWebSocketV2 not found. Run `pip install smartapi-python`.")
            raise

        logger.info(
            "Initializing SmartWebSocketV2 (Client: %s, API Key: %s)...",
            self.client_code,
            self.api_key[:4] + "****" if len(self.api_key) > 4 else "N/A",
        )

        self.sws = SmartWebSocketV2(
            auth_token=self.auth_token,
            api_key=self.api_key,
            client_code=self.client_code,
            feed_token=self.feed_token,
            max_retry_attempt=self.config.ws_reconnect_max_tries,
            retry_strategy=1,
            retry_delay=self.config.ws_reconnect_interval,
            retry_multiplier=2,
        )

        # Wire event handlers
        self.sws.on_open = self.on_open
        self.sws.on_data = self.on_data
        self.sws.on_close = self.on_close
        self.sws.on_error = self.on_error

        logger.info("Connecting to Angel One live WebSocket gateway...")
        if threaded:
            threading.Thread(target=self.sws.connect, name="AngelWebSocketWorker", daemon=True).start()
        else:
            self.sws.connect()

    def stop(self) -> None:
        """Gracefully disconnects SmartWebSocketV2."""
        logger.info("Stopping AngelDataStreamer...")
        self._is_running = False
        self._stop_event.set()

        if self.mock_mode and self._mock_thread:
            self._mock_thread.join(timeout=2.0)

        if self.sws:
            try:
                self.sws.close_connection()
            except Exception as e:
                logger.debug("Exception closing SmartWebSocketV2: %s", e)

        logger.info(
            "Streamer stopped. Final ticks ingested: %d, dropped: %d",
            self.total_ticks_received,
            self.dropped_ticks_count,
        )

    # -------------------------------------------------------------------------
    # Offline Mock Simulator
    # -------------------------------------------------------------------------
    def _start_mock_feed(self) -> None:
        self._mock_thread = threading.Thread(target=self._mock_worker, name="MockAngelStreamer", daemon=True)
        self._mock_thread.start()

    def _mock_worker(self) -> None:
        tokens = list(self.instrument_map.keys())
        logger.info("Mock Angel One tick simulator active for %d tokens.", len(tokens))

        sim_state: Dict[str, Dict[str, Any]] = {}
        for tok in tokens:
            meta = self.instrument_map[tok]
            base_p = 140.0 if meta.instrument_type in ("CE", "PE") else self.config.fallback_spot_price
            sim_state[tok] = {
                "ltp": base_p,
                "vol": 75000,
                "oi": 1200000,
                "open": base_p,
                "high": base_p * 1.05,
                "low": base_p * 0.95,
                "close": base_p,
            }

        class MockWSApp:
            def subscribe(self, **kwargs: Any) -> None: pass

        self.on_open(MockWSApp())

        while not self._stop_event.is_set():
            now_ms = int(time.time() * 1000)
            sample_toks = random.sample(tokens, min(len(tokens), random.randint(6, len(tokens))))

            for tok in sample_toks:
                st = sim_state[tok]
                delta = round(random.uniform(-0.5, 0.5), 2)
                ltp = max(0.5, round(st["ltp"] + delta, 2))
                st["ltp"] = ltp
                st["vol"] += random.randint(25, 200)
                st["oi"] += random.choice([-50, 0, 50, 100])
                st["high"] = max(st["high"], ltp)
                st["low"] = min(st["low"], ltp)

                spread = 0.10
                best_bid = round(ltp - (spread / 2.0), 2)
                best_ask = round(ltp + (spread / 2.0), 2)

                buy_depth = [
                    {"buy_price": round(best_bid - (i * spread), 2), "buy_quantity": random.randint(50, 1500), "buy_order": random.randint(1, 10)}
                    for i in range(5)
                ]
                sell_depth = [
                    {"sell_price": round(best_ask + (i * spread), 2), "sell_quantity": random.randint(50, 1500), "sell_order": random.randint(1, 10)}
                    for i in range(5)
                ]

                # Angel One Mode 3 packet format
                packet = {
                    "subscription_mode": 3,
                    "exchange_type": 2,
                    "token": tok,
                    "sequence_number": random.randint(1000, 999999),
                    "exchange_timestamp": now_ms,
                    "last_traded_price": ltp,
                    "last_traded_quantity": random.choice([25, 50, 75]),
                    "avg_traded_price": round((st["high"] + st["low"] + ltp) / 3.0, 2),
                    "volume_trade_for_the_day": st["vol"],
                    "total_buy_quantity": random.randint(50000, 200000),
                    "total_sell_quantity": random.randint(50000, 200000),
                    "open_price_of_the_day": st["open"],
                    "high_price_of_the_day": st["high"],
                    "low_price_of_the_day": st["low"],
                    "closed_price": st["close"],
                    "last_traded_timestamp": now_ms,
                    "open_interest": st["oi"],
                    "open_interest_day_high": int(st["oi"] * 1.1),
                    "open_interest_day_low": int(st["oi"] * 0.9),
                    "best_5_buy_data": buy_depth,
                    "best_5_sell_data": sell_depth,
                }

                self.on_data(MockWSApp(), packet)

            time.sleep(random.uniform(0.05, 0.15))

    def get_telemetry(self) -> Dict[str, Any]:
        """Returns snapshot of streamer performance metrics."""
        uptime = (time.time() - self.connection_time) if self.connection_time else 0.0
        return {
            "total_ticks": self.total_ticks_received,
            "dropped_ticks": self.dropped_ticks_count,
            "reconnect_count": self.reconnect_count,
            "queue_pending": self.queue.qsize(),
            "uptime_seconds": round(uptime, 1),
        }
