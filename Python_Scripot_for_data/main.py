"""
main.py
=============================================================================
Application Entry Point: Angel One SmartAPI Options Market Depth Pipeline.
Orchestrates authentication, instrument universe resolution, bounded buffer,
consumer worker daemon, and graceful shutdown on SIGINT / SIGTERM.
=============================================================================
"""

import logging
import os
import queue
import signal
import sys
import time
from typing import Any, Dict

from auth import get_angel_session
from config import cfg
from consumer import ConsoleSink, SQLiteSink, TickConsumerWorker
from instruments import AngelInstrumentResolver
from payload_parser import FullTickRecord
from streamer import AngelDataStreamer


def setup_logger(log_level: str = "INFO") -> None:
    """Configures structured console logging with ISO timestamps."""
    level = getattr(logging, log_level.upper(), logging.INFO)
    fmt = "%(asctime)s.%(msecs)03d [%(levelname)s] [%(name)s] %(message)s"
    datefmt = "%Y-%m-%d %H:%M:%S"
    logging.basicConfig(level=level, format=fmt, datefmt=datefmt, handlers=[logging.StreamHandler(sys.stdout)])


logger = logging.getLogger("main")


def print_banner() -> None:
    banner = f"""
=============================================================================
    ANGEL ONE SMARTAPI OPTIONS MARKET DEPTH PIPELINE (MODE 3)
=============================================================================
 Broker      : {cfg.broker} (SmartWebSocketV2 / SnapQuote 5-Level Depth)
 Target Index: {cfg.index_symbol} (ATM ± {cfg.strikes_around_atm} Strikes, Step: {cfg.strike_step})
 Client Code : {cfg.client_code if cfg.client_code else 'NOT_CONFIGURED'}
 Buffer Queue: {cfg.queue_maxsize:,} records | DB Sink: {cfg.sink_type.upper()} ({cfg.db_path})
=============================================================================
"""
    print(banner)


def print_universe_table(instrument_map: Dict[str, Any]) -> None:
    """Displays formatted terminal table of resolved option universe."""
    print("\n--- ACTIVE SUBSCRIBED OPTION CONTRACTS ---")
    print(f"{'Token':<10} | {'Symbol':<24} | {'Type':<6} | {'Strike':<10} | {'Expiry':<12} | {'Lot'}")
    print("-" * 75)
    for token, meta in sorted(instrument_map.items(), key=lambda x: (x[1].strike, x[1].instrument_type)):
        print(f"{token:<10} | {meta.symbol:<24} | {meta.instrument_type:<6} | {meta.strike:<10.1f} | {meta.expiry:<12} | {meta.lot_size}")
    print("-" * 75)
    print(f"Total Subscribed Contracts: {len(instrument_map)}\n")


def main() -> None:
    setup_logger(cfg.log_level)
    print_banner()

    # 1. Authenticate with Angel One SmartAPI
    session = get_angel_session(cfg)
    is_mock = cfg.mock_feed

    if not session:
        logger.warning("No live Angel One session established. Running in SIMULATION FEED mode.")
        is_mock = True

    smart_client = session.smart_connect if session else None
    jwt_token = session.jwt_token if session else ""
    feed_token = session.feed_token if session else ""
    client_code = session.client_code if session else cfg.client_code

    # 2. Instrument & Expiry Discovery
    resolver = AngelInstrumentResolver(smart_connect=smart_client, config=cfg)
    instrument_map, subscription_list = resolver.build_universe()

    if not instrument_map:
        logger.critical("No option contracts resolved. Exiting.")
        sys.exit(1)

    print_universe_table(instrument_map)

    # 3. High-Throughput Ingestion Queue (Thread-safe FIFO buffer)
    tick_queue: "queue.Queue[FullTickRecord]" = queue.Queue(maxsize=cfg.queue_maxsize)

    # 4. Downstream Persistence Sink & Consumer Worker Daemon Thread
    if cfg.sink_type.lower() == "console":
        sink = ConsoleSink()
    else:
        sink = SQLiteSink(db_path=cfg.db_path)

    consumer = TickConsumerWorker(
        tick_queue=tick_queue,
        sink=sink,
        batch_size=cfg.batch_size,
        batch_timeout_ms=cfg.batch_timeout_ms,
    )
    consumer.start()

    # 5. Market Data WebSocket Streamer (Producer)
    streamer = AngelDataStreamer(
        auth_token=jwt_token,
        api_key=cfg.smart_api_key,
        client_code=client_code,
        feed_token=feed_token,
        instrument_map=instrument_map,
        subscription_list=subscription_list,
        tick_queue=tick_queue,
        config=cfg,
        mock_mode=is_mock,
    )

    # 6. Signal Handlers for Graceful Termination
    shutdown_flag = [False]

    def handle_signal(signum: int, frame: Any) -> None:
        if shutdown_flag[0]:
            return
        shutdown_flag[0] = True
        sig_name = signal.Signals(signum).name
        logger.info("\nReceived %s signal. Executing graceful shutdown sequence...", sig_name)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    # 7. Connect and Launch Streamer Loop
    streamer.start(threaded=True)

    # 8. Main Monitoring & Telemetry Loop
    start_time = time.time()
    last_time = start_time
    last_ticks = 0
    last_consumed = 0

    logger.info("Market data pipeline active. Press Ctrl+C to terminate.")

    try:
        while not shutdown_flag[0]:
            time.sleep(2.0)
            now = time.time()
            elapsed = max(0.001, now - last_time)

            curr_ticks = streamer.total_ticks_received
            curr_consumed = consumer.total_consumed

            tps_ingest = (curr_ticks - last_ticks) / elapsed
            tps_drain = (curr_consumed - last_consumed) / elapsed

            last_time = now
            last_ticks = curr_ticks
            last_consumed = curr_consumed

            streamer_meta = streamer.get_telemetry()
            consumer_meta = consumer.get_stats()

            logger.info(
                "MONITOR | Ingest: %6.1f tps | Drain: %6.1f tps | Queue: %5d/%d (%4.1f%%) | Batches: %5d | AvgBatch: %4.1f | Dropped: %d",
                tps_ingest,
                tps_drain,
                streamer_meta["queue_pending"],
                cfg.queue_maxsize,
                (streamer_meta["queue_pending"] / cfg.queue_maxsize * 100.0) if cfg.queue_maxsize > 0 else 0.0,
                consumer_meta["total_batches"],
                consumer_meta["avg_batch_size"],
                streamer_meta["dropped_ticks"],
            )

    except KeyboardInterrupt:
        logger.info("Keyboard interrupt captured.")
    finally:
        logger.info("Terminating streamer...")
        streamer.stop()

        logger.info("Draining remaining items in consumer queue...")
        consumer.stop()
        consumer.join(timeout=10.0)

        total_runtime = max(0.1, time.time() - start_time)
        print("\n" + "=" * 65)
        print("          FINAL SESSION EXECUTION SUMMARY")
        print("=" * 65)
        print(f"Total Runtime          : {total_runtime:.2f} seconds")
        print(f"Total Ticks Ingested   : {streamer.total_ticks_received:,}")
        print(f"Total Ticks Persisted  : {consumer.total_consumed:,}")
        print(f"Total Batches Written  : {consumer.total_batches:,}")
        print(f"Dropped Frames         : {streamer.dropped_ticks_count:,}")
        if os.path.isfile(cfg.db_path):
            size_mb = os.path.getsize(cfg.db_path) / (1024 * 1024)
            print(f"Database File Size     : {size_mb:.2f} MB ({cfg.db_path})")
        print("=" * 65 + "\n")
        logger.info("Shutdown completed cleanly.")


if __name__ == "__main__":
    main()
