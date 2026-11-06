"""
test_pipeline.py
=============================================================================
Automated test suite for the Angel One SmartAPI Options Data Pipeline.
Validates Mode 3 SnapQuote parser, SQLite WAL persistence, and queue worker.
=============================================================================
"""

import os
import queue
import sqlite3
import tempfile
import time
from datetime import date, datetime, timezone

from config import Config
from consumer import SQLiteSink, TickConsumerWorker
from instruments import AngelInstrumentResolver, InstrumentMeta
from payload_parser import FullTickRecord, parse_angel_mode3_tick


def test_payload_parser() -> None:
    print("Testing payload_parser.py with Angel One Mode 3 SnapQuote...")
    meta = InstrumentMeta(
        token="45120",
        symbol="NIFTY07NOV2424500CE",
        name="NIFTY",
        strike=24500.0,
        instrument_type="CE",
        expiry="2026-11-05",
        lot_size=25,
    )

    # Sample Angel One SmartWebSocketV2 Mode 3 packet
    packet = {
        "subscription_mode": 3,
        "exchange_type": 2,
        "token": "45120",
        "sequence_number": 881234,
        "exchange_timestamp": 1730527200000,
        "last_traded_price": 14550,  # 145.50 in paise
        "last_traded_quantity": 50,
        "avg_traded_price": 14320,   # 143.20 in paise
        "volume_trade_for_the_day": 850000,
        "total_buy_quantity": 45000,
        "total_sell_quantity": 38000,
        "open_price_of_the_day": 13000,
        "high_price_of_the_day": 15500,
        "low_price_of_the_day": 12800,
        "closed_price": 13250,
        "last_traded_timestamp": 1730527198000,
        "open_interest": 1200000,
        "open_interest_day_high": 1250000,
        "open_interest_day_low": 1100000,
        "best_5_buy_data": [
            {"buy_price": 14545, "buy_quantity": 100, "buy_order": 2},
            {"buy_price": 14540, "buy_quantity": 250, "buy_order": 4},
            {"buy_price": 14535, "buy_quantity": 500, "buy_order": 7},
            {"buy_price": 14530, "buy_quantity": 350, "buy_order": 3},
            {"buy_price": 14525, "buy_quantity": 800, "buy_order": 12},
        ],
        "best_5_sell_data": [
            {"sell_price": 14555, "sell_quantity": 150, "sell_order": 3},
            {"sell_price": 14560, "sell_quantity": 300, "sell_order": 5},
            {"sell_price": 14565, "sell_quantity": 400, "sell_order": 6},
            {"sell_price": 14570, "sell_quantity": 600, "sell_order": 9},
            {"sell_price": 14575, "sell_quantity": 1000, "sell_order": 15},
        ],
    }

    rec = parse_angel_mode3_tick(packet, metadata=meta, received_time=time.time())

    assert rec.token == "45120"
    assert rec.tradingsymbol == "NIFTY07NOV2424500CE"
    assert rec.strike == 24500.0
    assert rec.last_price == 145.50
    assert rec.average_traded_price == 143.20
    assert rec.open == 130.00
    assert rec.high == 155.00
    assert rec.low == 128.00
    assert rec.close == 132.50
    assert rec.oi == 1200000
    assert rec.bid_1_price == 145.45
    assert rec.bid_1_qty == 100
    assert rec.ask_1_price == 145.55
    assert rec.ask_5_orders == 15
    assert rec.feed_latency_ms is not None

    cols = FullTickRecord.get_column_names()
    flat = rec.to_flat_tuple()
    assert len(cols) == len(flat), f"Column mismatch: {len(cols)} cols vs {len(flat)} values"
    print(f" -> payload_parser: PASS ({len(cols)} fields normalized)")


def test_sqlite_sink() -> None:
    print("Testing SQLiteSink...")
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tf:
        db_path = tf.name

    try:
        sink = SQLiteSink(db_path=db_path)
        meta = InstrumentMeta(
            token="99901",
            symbol="NIFTY_TEST_CE",
            name="NIFTY",
            strike=24500.0,
            instrument_type="CE",
            expiry="2026-11-05",
            lot_size=25,
        )
        packet = {
            "token": "99901",
            "last_traded_price": 200.0,
            "best_5_buy_data": [{"buy_price": 199.5, "buy_quantity": 50, "buy_order": 1}],
            "best_5_sell_data": [],
        }
        recs = [parse_angel_mode3_tick(packet, metadata=meta) for _ in range(10)]
        sink.write_batch(recs)
        sink.close()

        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*), token, tradingsymbol, bid_1_price FROM ticks_mode_full")
        row = cur.fetchone()
        assert row[0] == 10
        assert row[1] == "99901"
        assert row[2] == "NIFTY_TEST_CE"
        assert row[3] == 199.5
        conn.close()
        print(" -> SQLiteSink: PASS (10 records persisted and verified)")
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)


def test_producer_consumer_queue() -> None:
    print("Testing Producer-Consumer Buffer...")
    q: "queue.Queue[FullTickRecord]" = queue.Queue(maxsize=1000)
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tf:
        db_path = tf.name

    try:
        sink = SQLiteSink(db_path=db_path)
        worker = TickConsumerWorker(tick_queue=q, sink=sink, batch_size=20, batch_timeout_ms=20.0)
        worker.start()

        meta = InstrumentMeta(
            token="88801",
            symbol="NIFTY_STREAM_PE",
            name="NIFTY",
            strike=24000.0,
            instrument_type="PE",
            expiry="2026-11-05",
            lot_size=25,
        )

        for i in range(50):
            packet = {"token": "88801", "last_traded_price": 100.0 + i}
            q.put_nowait(parse_angel_mode3_tick(packet, metadata=meta))

        time.sleep(0.3)
        worker.stop()
        worker.join(timeout=2.0)

        stats = worker.get_stats()
        assert stats["total_consumed"] == 50
        print(f" -> Queue Producer-Consumer: PASS (50 ticks drained in {stats['total_batches']} batches)")
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)


def test_resolver() -> None:
    print("Testing AngelInstrumentResolver...")
    resolver = AngelInstrumentResolver()
    token_map, sub_list = resolver.build_universe()
    assert len(token_map) > 0
    assert len(sub_list) == 1
    assert sub_list[0]["exchangeType"] == 2
    assert len(sub_list[0]["tokens"]) == len(token_map)
    print(f" -> AngelInstrumentResolver: PASS ({len(token_map)} contracts resolved in ATM ± 10 ladder)")


if __name__ == "__main__":
    test_payload_parser()
    test_sqlite_sink()
    test_producer_consumer_queue()
    test_resolver()
    print("\nALL ANGEL ONE SMARTAPI TESTS PASSED SUCCESSFULLY!")
