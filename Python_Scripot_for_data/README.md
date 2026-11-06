# Angel One SmartAPI Options Market Depth Data Pipeline (NSE/NFO)

Production-grade, non-blocking market data ingestion pipeline for the Indian Options Market (NIFTY/BANKNIFTY) powered by **Angel One SmartAPI (`smartapi-python`)** and **`SmartWebSocketV2`**.

Captures **100% of available exchange data fields** in **Mode 3 (SnapQuote / Full Depth)** (including 5-level order book depth, OHLC, Open Interest, VWAP, Volume, and microsecond telemetry) with **zero frame loss** via a decoupled producer-consumer architecture and **SQLite WAL mode**.

---

## 1. System Architecture

```
                                    [Angel One Gateway]
                                             │
                                             ▼ Mode 3 (SnapQuote Binary / Packets)
                          ┌─────────────────────────────────────┐
                          │         AngelDataStreamer           │
                          │        (SmartWebSocketV2)           │
                          │ ─────────────────────────────────── │
                          │ • on_data() [STRICT NON-BLOCK]      │
                          │ • Pure function Mode 3 parsing      │
                          │ • Feed latency measurement          │
                          │ • Automatic reconnect handler       │
                          └──────────────────┬──────────────────┘
                                             │ put_nowait()
                                             ▼
                          ┌─────────────────────────────────────┐
                          │    Bounded In-Memory FIFO Queue     │
                          │    (queue.Queue[FullTickRecord])    │
                          │ ─────────────────────────────────── │
                          │ • Capacity: 100,000 records         │
                          │ • Non-blocking backpressure         │
                          │ • Dropped frame telemetry alerts    │
                          └──────────────────┬──────────────────┘
                                             │ get() batch drain
                                             ▼
                          ┌─────────────────────────────────────┐
                          │     TickConsumerWorker (Thread)     │
                          │ ─────────────────────────────────── │
                          │ • Batch drain (250 ticks / 50ms)    │
                          │ • SQLite WAL Mode transactions      │
                          │ • Multi-row parameterized inserts   │
                          └──────────────────┬──────────────────┘
                                             │
                                             ▼
                             [SQLite Database (WAL Mode)]
                                 market_depth_ticks.db
```

---

## 2. Deliverables & Module Breakdown

| Module | Purpose |
| :--- | :--- |
| [`config.py`](file:///home/findoc/Downloads/FinSpark/Finspark/Python-Scripot_for_data/config.py) | Central configuration loaded via `python-dotenv`: `SMART_API_KEY`, `CLIENT_CODE`, `PIN`, `TOTP_SECRET`, strike ladder limits, queue buffer size. |
| [`auth.py`](file:///home/findoc/Downloads/FinSpark/Finspark/Python-Scripot_for_data/auth.py) | `SmartConnect` session generator with automatic 6-digit TOTP calculation using `pyotp.TOTP(totp_secret).now()`. Caches session tokens (`jwtToken`, `feedToken`, `refreshToken`) locally in `.angel_token.json`. |
| [`instruments.py`](file:///home/findoc/Downloads/FinSpark/Finspark/Python-Scripot_for_data/instruments.py) | Downloads and caches Angel One's OpenAPI Scrip Master JSON (`OpenAPIScripMaster.json`), filters for `OPTIDX` `NIFTY`, identifies the nearest active weekly expiry, calculates ATM strike, and generates the ATM $\pm$ 10 ladder (`CE` and `PE`). |
| [`payload_parser.py`](file:///home/findoc/Downloads/FinSpark/Finspark/Python-Scripot_for_data/payload_parser.py) | Pure function parser converting Angel One Mode 3 SnapQuote packets into `FullTickRecord` (54 database attributes: identity, OHLC, volume, open interest, and full 5-level bid/ask depth). |
| [`streamer.py`](file:///home/findoc/Downloads/FinSpark/Finspark/Python-Scripot_for_data/streamer.py) | `SmartWebSocketV2` client subscribing via `mode=3`, `exchangeType=2` (NFO), pushing records into bounded buffer with `put_nowait()`. Features built-in simulation mode for offline/weekend testing. |
| [`consumer.py`](file:///home/findoc/Downloads/FinSpark/Finspark/Python-Scripot_for_data/consumer.py) | Dedicated background consumer thread draining the queue in batches and persisting to SQLite in Write-Ahead Logging (`WAL`) mode. |
| [`main.py`](file:///home/findoc/Downloads/FinSpark/Finspark/Python-Scripot_for_data/main.py) | Entry point orchestrating authentication, universe resolution, consumer worker, streamer loop, live throughput monitor, and graceful shutdown on `SIGINT` / `SIGTERM`. |
| [`test_pipeline.py`](file:///home/findoc/Downloads/FinSpark/Finspark/Python-Scripot_for_data/test_pipeline.py) | Automated test suite verifying 54-field normalization, SQLite WAL inserts, and queue worker dynamics. |
| [`.env`](file:///home/findoc/Downloads/FinSpark/Finspark/Python-Scripot_for_data/.env) & [`.env.example`](file:///home/findoc/Downloads/FinSpark/Finspark/Python-Scripot_for_data/.env.example) | Environment variable templates with Angel One configuration. |

---

## 3. Quickstart & Configuration

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```
*(Dependencies: `smartapi-python`, `pyotp`, `python-dotenv`, `websocket-client`)*

### 2. Configure Credentials in `.env`
Fill in your Angel One SmartAPI credentials:
```env
BROKER=ANGEL_ONE
SMART_API_KEY=your_smart_api_key
CLIENT_CODE=your_client_code
PIN=your_4_digit_pin
TOTP_SECRET=your_totp_secret

INDEX_SYMBOL=NIFTY
STRIKE_STEP=50
STRIKES_AROUND_ATM=10
SINK_TYPE=sqlite
DB_PATH=market_depth_ticks.db
MOCK_FEED=false
```

### 3. Run the Test Suite
```bash
python3 test_pipeline.py
```

### 4. Launch the Pipeline
```bash
python3 main.py
```
*(Note: If testing outside market hours or without credentials, set `MOCK_FEED=true` to run the high-speed synthetic tick generator).*
