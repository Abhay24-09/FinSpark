"""
consumer.py
=============================================================================
High-Throughput Concurrent Consumer & SQLite WAL Database Sink.
Drains bounded ingestion queue in batches and executes high-speed WAL transactions.
=============================================================================
"""

import abc
import logging
import queue
import sqlite3
import threading
import time
from pathlib import Path
from typing import Any, List, Optional

from payload_parser import FullTickRecord

logger = logging.getLogger("consumer")


class BaseSink(abc.ABC):
    """Abstract interface for market depth tick persistence."""

    @abc.abstractmethod
    def write_batch(self, records: List[FullTickRecord]) -> None:
        raise NotImplementedError

    @abc.abstractmethod
    def close(self) -> None:
        raise NotImplementedError


class SQLiteSink(BaseSink):
    """
    Optimized SQLite persistence engine configured with Write-Ahead Logging (WAL)
    and synchronous=NORMAL for continuous stream ingestion.
    """

    TABLE_NAME = "ticks_mode_full"

    def __init__(self, db_path: str = "market_depth_ticks.db") -> None:
        self.db_path = Path(db_path).resolve()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(
            str(self.db_path),
            check_same_thread=False,
            timeout=30.0,
            isolation_level=None,  # Autocommit mode for explicit transaction control
        )
        self._setup_pragmas()
        self._init_schema()
        logger.info("SQLiteSink initialized at %s (WAL mode active)", self.db_path)

    def _setup_pragmas(self) -> None:
        cur = self.conn.cursor()
        cur.execute("PRAGMA journal_mode = WAL;")
        cur.execute("PRAGMA synchronous = NORMAL;")
        cur.execute("PRAGMA temp_store = MEMORY;")
        cur.execute("PRAGMA cache_size = -64000;")  # 64 MB page cache
        cur.close()

    def _init_schema(self) -> None:
        cols = FullTickRecord.get_column_names()
        col_defs = []
        for c in cols:
            if c in ("last_traded_quantity", "volume_traded", "total_buy_quantity",
                     "total_sell_quantity", "oi", "oi_day_high", "oi_day_low", "lot_size") or "_qty" in c or "_orders" in c:
                col_defs.append(f"{c} INTEGER")
            elif c in ("token", "tradingsymbol", "option_type", "expiry", "exchange_timestamp", "last_trade_time", "received_timestamp"):
                col_defs.append(f"{c} TEXT")
            else:
                col_defs.append(f"{c} REAL")

        create_sql = f"""
        CREATE TABLE IF NOT EXISTS {self.TABLE_NAME} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            {', '.join(col_defs)}
        );
        """
        cur = self.conn.cursor()
        cur.execute(create_sql)
        cur.execute(f"CREATE INDEX IF NOT EXISTS idx_{self.TABLE_NAME}_token_time ON {self.TABLE_NAME} (token, exchange_timestamp);")
        cur.execute(f"CREATE INDEX IF NOT EXISTS idx_{self.TABLE_NAME}_symbol_time ON {self.TABLE_NAME} (tradingsymbol, exchange_timestamp);")
        cur.close()

    def write_batch(self, records: List[FullTickRecord]) -> None:
        if not records:
            return

        cols = FullTickRecord.get_column_names()
        placeholders = ", ".join(["?"] * len(cols))
        sql = f"INSERT INTO {self.TABLE_NAME} ({', '.join(cols)}) VALUES ({placeholders})"
        rows = [r.to_flat_tuple() for r in records]

        cur = self.conn.cursor()
        try:
            cur.execute("BEGIN TRANSACTION;")
            cur.executemany(sql, rows)
            cur.execute("COMMIT;")
        except Exception as exc:
            cur.execute("ROLLBACK;")
            logger.error("Failed to commit batch of %d records: %s", len(records), exc)
            raise
        finally:
            cur.close()

    def close(self) -> None:
        try:
            self.conn.close()
            logger.info("Closed SQLite connection cleanly.")
        except Exception as e:
            logger.warning("Error closing SQLite connection: %s", e)


class ConsoleSink(BaseSink):
    """Real-time console sink displaying live tick dynamics and order book spread."""

    def __init__(self) -> None:
        self.last_log = 0.0

    def write_batch(self, records: List[FullTickRecord]) -> None:
        now = time.time()
        if now - self.last_log < 0.5 or not records:
            return
        self.last_log = now
        sample = records[-1]
        spread = round(sample.ask_1_price - sample.bid_1_price, 2) if (sample.ask_1_price and sample.bid_1_price) else 0.0
        logger.info(
            "TICK >> [%s] LTP: %8.2f | Chg: %+5.2f%% | Vol: %6d | OI: %7d | Bid1: %7.2f (x%d) | Ask1: %7.2f (x%d) | Spread: %.2f",
            sample.tradingsymbol,
            sample.last_price,
            sample.change,
            sample.volume_traded,
            sample.oi,
            sample.bid_1_price,
            sample.bid_1_qty,
            sample.ask_1_price,
            sample.ask_1_qty,
            spread,
        )

    def close(self) -> None:
        pass


class TickConsumerWorker(threading.Thread):
    """
    Dedicated background worker daemon thread draining the bounded queue
    and delegating batch writes to downstream persistence sinks.
    """

    def __init__(
        self,
        tick_queue: "queue.Queue[FullTickRecord]",
        sink: BaseSink,
        batch_size: int = 250,
        batch_timeout_ms: float = 50.0,
    ) -> None:
        super().__init__(name="AngelConsumerWorker", daemon=True)
        self.queue = tick_queue
        self.sink = sink
        self.batch_size = max(1, batch_size)
        self.timeout_sec = max(0.005, batch_timeout_ms / 1000.0)

        self._stop_event = threading.Event()
        self.total_consumed = 0
        self.total_batches = 0
        self.total_write_time = 0.0

    def run(self) -> None:
        logger.info(
            "TickConsumerWorker started (Batch size: %d, Timeout: %.1fms)",
            self.batch_size,
            self.timeout_sec * 1000.0,
        )
        batch: List[FullTickRecord] = []
        last_flush = time.time()

        while not self._stop_event.is_set():
            wait_time = max(0.001, self.timeout_sec - (time.time() - last_flush))
            try:
                rec = self.queue.get(timeout=wait_time)
                batch.append(rec)
                self.queue.task_done()
            except queue.Empty:
                pass

            now = time.time()
            if len(batch) >= self.batch_size or (batch and (now - last_flush) >= self.timeout_sec):
                self._flush(batch)
                batch = []
                last_flush = now

        # Drain remaining items on shutdown
        while not self.queue.empty():
            try:
                rec = self.queue.get_nowait()
                batch.append(rec)
                self.queue.task_done()
                if len(batch) >= self.batch_size:
                    self._flush(batch)
                    batch = []
            except queue.Empty:
                break

        if batch:
            self._flush(batch)

        self.sink.close()
        logger.info("TickConsumerWorker stopped. Total consumed: %d records.", self.total_consumed)

    def _flush(self, batch: List[FullTickRecord]) -> None:
        if not batch:
            return
        t0 = time.perf_counter()
        try:
            self.sink.write_batch(batch)
            self.total_write_time += (time.perf_counter() - t0)
            self.total_consumed += len(batch)
            self.total_batches += 1
        except Exception as e:
            logger.error("Error writing batch of %d records: %s", len(batch), e)

    def stop(self) -> None:
        self._stop_event.set()

    def get_stats(self) -> dict:
        avg_batch = (self.total_consumed / self.total_batches) if self.total_batches > 0 else 0
        avg_write_ms = (self.total_write_time / self.total_batches * 1000.0) if self.total_batches > 0 else 0
        return {
            "total_consumed": self.total_consumed,
            "total_batches": self.total_batches,
            "avg_batch_size": round(avg_batch, 1),
            "avg_write_time_ms": round(avg_write_ms, 2),
            "queue_pending": self.queue.qsize(),
        }
