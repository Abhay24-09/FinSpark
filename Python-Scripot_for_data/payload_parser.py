"""
payload_parser.py
=============================================================================
High-Speed Pure Function Parser for Angel One SmartWebSocketV2 Mode 3 Packets.
Extracts and normalizes 100% of exchange fields (SnapQuote with 5-level depth).
=============================================================================
"""

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from instruments import InstrumentMeta


@dataclass
class FullTickRecord:
    """Normalized typed record capturing 100% of Angel One Mode 3 exchange data."""

    # Identification
    token: str
    tradingsymbol: str
    strike: float
    option_type: str
    expiry: str
    lot_size: int

    # Price Dynamics & Volume
    last_price: float
    last_traded_quantity: int
    average_traded_price: float
    volume_traded: int
    total_buy_quantity: int
    total_sell_quantity: int
    change: float

    # Open Interest (Derivatives)
    oi: int
    oi_day_high: int
    oi_day_low: int

    # OHLC (Day Range)
    open: float
    high: float
    low: float
    close: float

    # Timestamps & Telemetry
    exchange_timestamp: Optional[str]
    last_trade_time: Optional[str]
    received_timestamp: str
    feed_latency_ms: Optional[float]

    # Full 5-level Bid Depth (Buy Order Book)
    bid_1_price: float
    bid_1_qty: int
    bid_1_orders: int

    bid_2_price: float
    bid_2_qty: int
    bid_2_orders: int

    bid_3_price: float
    bid_3_qty: int
    bid_3_orders: int

    bid_4_price: float
    bid_4_qty: int
    bid_4_orders: int

    bid_5_price: float
    bid_5_qty: int
    bid_5_orders: int

    # Full 5-level Ask Depth (Sell Order Book)
    ask_1_price: float
    ask_1_qty: int
    ask_1_orders: int

    ask_2_price: float
    ask_2_qty: int
    ask_2_orders: int

    ask_3_price: float
    ask_3_qty: int
    ask_3_orders: int

    ask_4_price: float
    ask_4_qty: int
    ask_4_orders: int

    ask_5_price: float
    ask_5_qty: int
    ask_5_orders: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_flat_tuple(self) -> Tuple[Any, ...]:
        """Ordered tuple for high-throughput batch SQL executemany insertion."""
        return (
            self.token,
            self.tradingsymbol,
            self.strike,
            self.option_type,
            self.expiry,
            self.lot_size,
            self.last_price,
            self.last_traded_quantity,
            self.average_traded_price,
            self.volume_traded,
            self.total_buy_quantity,
            self.total_sell_quantity,
            self.change,
            self.oi,
            self.oi_day_high,
            self.oi_day_low,
            self.open,
            self.high,
            self.low,
            self.close,
            self.exchange_timestamp,
            self.last_trade_time,
            self.received_timestamp,
            self.feed_latency_ms,
            self.bid_1_price,
            self.bid_1_qty,
            self.bid_1_orders,
            self.bid_2_price,
            self.bid_2_qty,
            self.bid_2_orders,
            self.bid_3_price,
            self.bid_3_qty,
            self.bid_3_orders,
            self.bid_4_price,
            self.bid_4_qty,
            self.bid_4_orders,
            self.bid_5_price,
            self.bid_5_qty,
            self.bid_5_orders,
            self.ask_1_price,
            self.ask_1_qty,
            self.ask_1_orders,
            self.ask_2_price,
            self.ask_2_qty,
            self.ask_2_orders,
            self.ask_3_price,
            self.ask_3_qty,
            self.ask_3_orders,
            self.ask_4_price,
            self.ask_4_qty,
            self.ask_4_orders,
            self.ask_5_price,
            self.ask_5_qty,
            self.ask_5_orders,
        )

    @staticmethod
    def get_column_names() -> List[str]:
        return [
            "token",
            "tradingsymbol",
            "strike",
            "option_type",
            "expiry",
            "lot_size",
            "last_price",
            "last_traded_quantity",
            "average_traded_price",
            "volume_traded",
            "total_buy_quantity",
            "total_sell_quantity",
            "change",
            "oi",
            "oi_day_high",
            "oi_day_low",
            "open",
            "high",
            "low",
            "close",
            "exchange_timestamp",
            "last_trade_time",
            "received_timestamp",
            "feed_latency_ms",
            "bid_1_price",
            "bid_1_qty",
            "bid_1_orders",
            "bid_2_price",
            "bid_2_qty",
            "bid_2_orders",
            "bid_3_price",
            "bid_3_qty",
            "bid_3_orders",
            "bid_4_price",
            "bid_4_qty",
            "bid_4_orders",
            "bid_5_price",
            "bid_5_qty",
            "bid_5_orders",
            "ask_1_price",
            "ask_1_qty",
            "ask_1_orders",
            "ask_2_price",
            "ask_2_qty",
            "ask_2_orders",
            "ask_3_price",
            "ask_3_qty",
            "ask_3_orders",
            "ask_4_price",
            "ask_4_qty",
            "ask_4_orders",
            "ask_5_price",
            "ask_5_qty",
            "ask_5_orders",
        ]


def _format_timestamp(ts: Any) -> Optional[str]:
    """Formats unix epoch (ms or sec) or datetime to ISO 8601 string."""
    if ts is None:
        return None
    if isinstance(ts, datetime):
        return ts.isoformat()
    if isinstance(ts, (int, float)):
        # If timestamp is in milliseconds (> 1e11), convert to seconds
        val_sec = ts / 1000.0 if ts > 1e11 else float(ts)
        try:
            return datetime.fromtimestamp(val_sec, tz=timezone.utc).isoformat()
        except (ValueError, OSError):
            return str(ts)
    return str(ts)


def _normalize_price(price_val: Any, is_option: bool = True) -> float:
    """
    Normalizes Angel One binary/parsed price.
    In Angel One SmartWebSocketV2 Mode 3, prices may be raw integers in paise (e.g. 14550 -> 145.50).
    """
    if price_val is None:
        return 0.0
    val = float(price_val)
    if is_option and val > 1000.0 and val % 1.0 == 0.0:
        # High probability integer paise for an option contract
        return round(val / 100.0, 2)
    return round(val, 2)


def parse_angel_mode3_tick(
    data: Dict[str, Any],
    metadata: Optional[InstrumentMeta] = None,
    received_time: Optional[float] = None,
) -> FullTickRecord:
    """
    Pure function parser converting Angel One Mode 3 (SnapQuote) packet
    into a completely flattened FullTickRecord.
    """
    now = datetime.now(timezone.utc)
    rec_iso = now.isoformat()
    rec_unix = now.timestamp() if received_time is None else received_time

    raw_token = str(data.get("token") or data.get("symbol_token") or "")
    is_option = metadata.instrument_type in ("CE", "PE") if metadata else True

    # Identity metadata
    if metadata:
        symbol = metadata.symbol
        strike = metadata.strike
        opt_type = metadata.instrument_type
        expiry = metadata.expiry or "SPOT"
        lot_size = metadata.lot_size
    else:
        symbol = str(data.get("symbol", f"TOKEN_{raw_token}"))
        strike = 0.0
        opt_type = "INDEX" if "index" in symbol.lower() else "OPT"
        expiry = "UNKNOWN"
        lot_size = 25

    # Price dynamics
    raw_ltp = data.get("last_traded_price") or data.get("ltp") or 0.0
    ltp = _normalize_price(raw_ltp, is_option=is_option)

    raw_atp = data.get("avg_traded_price") or data.get("atp") or 0.0
    atp = _normalize_price(raw_atp, is_option=is_option)

    ltq = int(data.get("last_traded_quantity") or data.get("ltq") or 0)
    vol = int(data.get("volume_trade_for_the_day") or data.get("volume") or 0)
    tbq = int(float(data.get("total_buy_quantity") or 0))
    tsq = int(float(data.get("total_sell_quantity") or 0))

    # OHLC
    open_p = _normalize_price(data.get("open_price_of_the_day") or data.get("open") or 0.0, is_option)
    high_p = _normalize_price(data.get("high_price_of_the_day") or data.get("high") or 0.0, is_option)
    low_p = _normalize_price(data.get("low_price_of_the_day") or data.get("low") or 0.0, is_option)
    close_p = _normalize_price(data.get("closed_price") or data.get("close") or 0.0, is_option)

    # Change %
    change_pct = float(data.get("change_percent") or 0.0)
    if change_pct == 0.0 and close_p > 0:
        change_pct = round(((ltp - close_p) / close_p) * 100.0, 2)

    # Open Interest
    oi = int(data.get("open_interest") or data.get("oi") or 0)
    oi_h = int(data.get("open_interest_day_high") or data.get("oi_day_high") or oi)
    oi_l = int(data.get("open_interest_day_low") or data.get("oi_day_low") or oi)

    # Timestamps & Telemetry
    exch_raw = data.get("exchange_timestamp") or data.get("timestamp")
    ltt_raw = data.get("last_traded_timestamp") or data.get("last_trade_time")

    exch_iso = _format_timestamp(exch_raw)
    ltt_iso = _format_timestamp(ltt_raw)

    feed_latency_ms: Optional[float] = None
    if isinstance(exch_raw, (int, float)):
        exch_sec = exch_raw / 1000.0 if exch_raw > 1e11 else float(exch_raw)
        feed_latency_ms = max(0.0, (rec_unix - exch_sec) * 1000.0)

    # Full 5-Level Depth Extraction
    # In Angel One SmartWebSocketV2, depth is under 'best_5_buy_data' and 'best_5_sell_data'
    buy_levels = data.get("best_5_buy_data") or data.get("depth", {}).get("buy", [])
    sell_levels = data.get("best_5_sell_data") or data.get("depth", {}).get("sell", [])

    def extract_level(levels: List[Any], idx: int, is_buy: bool) -> Tuple[float, int, int]:
        if idx < len(levels) and isinstance(levels[idx], dict):
            lvl = levels[idx]
            price_key = "buy_price" if is_buy and "buy_price" in lvl else ("price" if "price" in lvl else "sell_price")
            qty_key = "buy_quantity" if is_buy and "buy_quantity" in lvl else ("quantity" if "quantity" in lvl else "sell_quantity")
            ord_key = "buy_order" if is_buy and "buy_order" in lvl else ("orders" if "orders" in lvl else "sell_order")

            p = _normalize_price(lvl.get(price_key) or 0.0, is_option)
            q = int(lvl.get(qty_key) or 0)
            o = int(lvl.get(ord_key) or 0)
            return p, q, o
        return 0.0, 0, 0

    b1_p, b1_q, b1_o = extract_level(buy_levels, 0, True)
    b2_p, b2_q, b2_o = extract_level(buy_levels, 1, True)
    b3_p, b3_q, b3_o = extract_level(buy_levels, 2, True)
    b4_p, b4_q, b4_o = extract_level(buy_levels, 3, True)
    b5_p, b5_q, b5_o = extract_level(buy_levels, 4, True)

    a1_p, a1_q, a1_o = extract_level(sell_levels, 0, False)
    a2_p, a2_q, a2_o = extract_level(sell_levels, 1, False)
    a3_p, a3_q, a3_o = extract_level(sell_levels, 2, False)
    a4_p, a4_q, a4_o = extract_level(sell_levels, 3, False)
    a5_p, a5_q, a5_o = extract_level(sell_levels, 4, False)

    return FullTickRecord(
        token=raw_token,
        tradingsymbol=symbol,
        strike=strike,
        option_type=opt_type,
        expiry=expiry,
        lot_size=lot_size,
        last_price=ltp,
        last_traded_quantity=ltq,
        average_traded_price=atp,
        volume_traded=vol,
        total_buy_quantity=tbq,
        total_sell_quantity=tsq,
        change=change_pct,
        oi=oi,
        oi_day_high=oi_h,
        oi_day_low=oi_l,
        open=open_p,
        high=high_p,
        low=low_p,
        close=close_p,
        exchange_timestamp=exch_iso,
        last_trade_time=ltt_iso,
        received_timestamp=rec_iso,
        feed_latency_ms=feed_latency_ms,
        bid_1_price=b1_p,
        bid_1_qty=b1_q,
        bid_1_orders=b1_o,
        bid_2_price=b2_p,
        bid_2_qty=b2_q,
        bid_2_orders=b2_o,
        bid_3_price=b3_p,
        bid_3_qty=b3_q,
        bid_3_orders=b3_o,
        bid_4_price=b4_p,
        bid_4_qty=b4_q,
        bid_4_orders=b4_o,
        bid_5_price=b5_p,
        bid_5_qty=b5_q,
        bid_5_orders=b5_o,
        ask_1_price=a1_p,
        ask_1_qty=a1_q,
        ask_1_orders=a1_o,
        ask_2_price=a2_p,
        ask_2_qty=a2_q,
        ask_2_orders=a2_o,
        ask_3_price=a3_p,
        ask_3_qty=a3_q,
        ask_3_orders=a3_o,
        ask_4_price=a4_p,
        ask_4_qty=a4_q,
        ask_4_orders=a4_o,
        ask_5_price=a5_p,
        ask_5_qty=a5_q,
        ask_5_orders=a5_o,
    )
