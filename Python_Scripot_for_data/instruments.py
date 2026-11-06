"""
instruments.py
=============================================================================
Angel One SmartAPI Scrip Master Downloader & Options Strike Ladder Resolver.
Downloads OpenAPI scrip master JSON, filters OPTIDX for active index, resolves
nearest weekly expiry, calculates ATM ± 10 ladder, and returns token maps.
=============================================================================
"""

import json
import logging
import urllib.request
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from config import Config, cfg

logger = logging.getLogger("instruments")


@dataclass(frozen=True)
class InstrumentMeta:
    """Metadata descriptor for an Angel One instrument."""

    token: str
    symbol: str
    name: str
    strike: float
    instrument_type: str  # 'CE', 'PE', 'INDEX'
    expiry: Optional[str]  # 'YYYY-MM-DD'
    lot_size: int
    tick_size: float = 0.05
    exch_seg: str = "NFO"
    exchange_type: int = 2  # 1 for NSE, 2 for NFO

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class AngelInstrumentResolver:
    """
    Downloads and caches Angel One OpenAPI Scrip Master JSON dump,
    resolves nearest active expiry, calculates ATM strike, and generates subscription tokens.
    """

    SCRIP_MASTER_URL = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
    CACHE_DIR = Path(__file__).resolve().parent / "cache"

    def __init__(self, smart_connect: Optional[Any] = None, config: Config = cfg) -> None:
        self.smart_connect = smart_connect
        self.config = config
        self.CACHE_DIR.mkdir(parents=True, exist_ok=True)

        self.spot_price: float = config.fallback_spot_price
        self.atm_strike: float = 0.0
        self.active_expiry: Optional[date] = None

    def fetch_scrip_master(self) -> List[Dict[str, Any]]:
        """
        Retrieves the Angel One Scrip Master JSON:
        1. From local cache if downloaded today.
        2. Via HTTP from Angel One's official margincalculator endpoint.
        3. Synthetic fallback if offline.
        """
        today_str = date.today().strftime("%Y%m%d")
        cache_path = self.CACHE_DIR / f"instruments_ANGEL_{today_str}.json"

        # 1. Local disk cache
        if cache_path.is_file() and cache_path.stat().st_size > 1024:
            logger.info("Loading cached Angel One Scrip Master: %s", cache_path)
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning("Error reading cache file %s: %s", cache_path, e)

        # 2. Direct HTTP download
        logger.info("Downloading Angel One Scrip Master from %s...", self.SCRIP_MASTER_URL)
        try:
            req = urllib.request.Request(
                self.SCRIP_MASTER_URL,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SmartAPI-Streamer/2.0"},
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                content = resp.read().decode("utf-8")
                records = json.loads(content)

            with open(cache_path, "w", encoding="utf-8") as f:
                f.write(content)
            logger.info("Downloaded and cached Angel One Scrip Master (%d records).", len(records))
            return records
        except Exception as exc:
            logger.warning("Could not download live Angel One scrip master: %s", exc)

            # Check older cache files
            prev_caches = sorted(self.CACHE_DIR.glob("instruments_ANGEL_*.json"), reverse=True)
            if prev_caches:
                logger.info("Falling back to previous scrip cache: %s", prev_caches[0])
                try:
                    with open(prev_caches[0], "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception:
                    pass

            # 3. Synthetic universe fallback
            logger.warning("Generating synthetic Angel One options universe for offline execution...")
            records = self._generate_synthetic_dump()
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(records, f)
            return records

    def parse_strike(self, raw_strike: Any) -> float:
        """
        Angel One strikes in JSON master are often multiplied by 100 (e.g. 2450000.000000 for 24500).
        Normalizes strike to actual rupee value.
        """
        try:
            val = float(raw_strike)
            # Standard index strikes are typically < 100,000; Angel's 100x format is >= 100,000
            if val >= 500000:
                return round(val / 100.0, 2)
            return round(val, 2)
        except (ValueError, TypeError):
            return 0.0

    def parse_expiry_date(self, raw_exp: Any) -> Optional[date]:
        """
        Parses Angel One expiry string (formats: '07NOV2024', '07-NOV-2024', or '2024-11-07').
        """
        if not raw_exp:
            return None
        s = str(raw_exp).strip().upper()
        for fmt in ("%d%b%Y", "%d-%b-%Y", "%Y-%m-%d", "%d%B%Y"):
            try:
                return datetime.strptime(s, fmt).date()
            except ValueError:
                continue
        return None

    def resolve_nearest_expiry(self, records: List[Dict[str, Any]]) -> date:
        """
        Scans all OPTIDX contracts for target index, filters expiry >= today,
        and identifies the nearest active weekly or monthly expiry.
        """
        today = date.today()
        expiries: Set[date] = set()

        for rec in records:
            if rec.get("name") != self.config.index_symbol:
                continue
            if rec.get("instrumenttype") != "OPTIDX" or rec.get("exch_seg") != "NFO":
                continue

            exp_date = self.parse_expiry_date(rec.get("expiry"))
            if exp_date and exp_date >= today:
                expiries.add(exp_date)

        if not expiries:
            # Fallback to next Thursday
            days_ahead = (3 - today.weekday() + 7) % 7
            if days_ahead == 0:
                days_ahead = 7
            fallback_exp = today + timedelta(days=days_ahead)
            logger.warning("No active future expiry found in dump. Defaulting to next Thursday: %s", fallback_exp)
            self.active_expiry = fallback_exp
            return fallback_exp

        sorted_expiries = sorted(expiries)
        self.active_expiry = sorted_expiries[0]
        logger.info(
            "Discovered %d active expiries for %s. Selected nearest: %s (Upcoming: %s)",
            len(sorted_expiries),
            self.config.index_symbol,
            self.active_expiry,
            [d.strftime("%Y-%m-%d") for d in sorted_expiries[:4]],
        )
        return self.active_expiry

    def resolve_spot_price(self) -> float:
        """
        Retrieves spot price for target index via live REST quote or configured fallback.
        """
        if self.smart_connect is not None:
            try:
                # Angel One ltpData for NIFTY: exchange='NSE', tradingsymbol='Nifty 50', symboltoken='99926000'
                quote = self.smart_connect.ltpData(
                    exchange="NSE",
                    tradingsymbol="Nifty 50" if self.config.index_symbol == "NIFTY" else self.config.index_symbol,
                    symboltoken="99926000" if self.config.index_symbol == "NIFTY" else "99926009",
                )
                if quote and quote.get("status") and quote.get("data"):
                    ltp = float(quote["data"]["ltp"])
                    if ltp > 0:
                        logger.info("Resolved live spot price via SmartConnect: %.2f", ltp)
                        self.spot_price = ltp
                        return ltp
            except Exception as e:
                logger.warning("Could not fetch live spot from SmartAPI (%s); using fallback.", e)

        self.spot_price = self.config.fallback_spot_price
        logger.info("Using configured reference spot price for %s: %.2f", self.config.index_symbol, self.spot_price)
        return self.spot_price

    def build_universe(self) -> Tuple[Dict[str, InstrumentMeta], List[Dict[str, Any]]]:
        """
        Builds the active options strike ladder:
        - Resolves nearest weekly expiry.
        - Calculates ATM strike: round(spot / step) * step.
        - Filters ATM ± 10 strikes for both CE and PE.
        - Returns:
            token_map: Dict[token_str, InstrumentMeta]
            subscription_payload: list of token dicts for SmartWebSocketV2
        """
        records = self.fetch_scrip_master()
        self.resolve_nearest_expiry(records)
        spot = self.resolve_spot_price()

        step = self.config.strike_step
        self.atm_strike = round(spot / step) * step
        n_strikes = self.config.strikes_around_atm

        logger.info(
            "Index: %s | Spot: %.2f | Step: %.1f | ATM Strike: %.1f | Ladder: ATM ± %d strikes",
            self.config.index_symbol,
            spot,
            step,
            self.atm_strike,
            n_strikes,
        )

        target_strikes: Set[float] = set()
        for i in range(-n_strikes, n_strikes + 1):
            target_strikes.add(self.atm_strike + (i * step))

        exp_iso = self.active_expiry.strftime("%Y-%m-%d")
        token_map: Dict[str, InstrumentMeta] = {}
        nfo_tokens: List[str] = []

        for rec in records:
            if rec.get("name") != self.config.index_symbol:
                continue
            if rec.get("instrumenttype") != "OPTIDX" or rec.get("exch_seg") != "NFO":
                continue

            rec_exp = self.parse_expiry_date(rec.get("expiry"))
            if not rec_exp or rec_exp != self.active_expiry:
                continue

            strike = self.parse_strike(rec.get("strike"))
            if strike in target_strikes:
                symbol = rec.get("symbol", "")
                opt_type = "CE" if symbol.endswith("CE") else ("PE" if symbol.endswith("PE") else "OPT")
                token_str = str(rec.get("token", "")).strip()

                meta = InstrumentMeta(
                    token=token_str,
                    symbol=symbol,
                    name=rec.get("name", self.config.index_symbol),
                    strike=strike,
                    instrument_type=opt_type,
                    expiry=exp_iso,
                    lot_size=int(rec.get("lotsize", 25) or 25),
                    tick_size=float(rec.get("tick_size", 0.05) or 0.05) / 100.0 if float(rec.get("tick_size", 0.05) or 0.05) > 1 else float(rec.get("tick_size", 0.05) or 0.05),
                    exch_seg="NFO",
                    exchange_type=2,
                )

                token_map[token_str] = meta
                nfo_tokens.append(token_str)

        # SmartWebSocketV2 token list structure: [{"exchangeType": 2, "tokens": ["...", ...]}]
        subscription_list = [{"exchangeType": 2, "tokens": nfo_tokens}]

        ce_count = sum(1 for m in token_map.values() if m.instrument_type == "CE")
        pe_count = sum(1 for m in token_map.values() if m.instrument_type == "PE")

        logger.info(
            "Constructed universe: %d contracts (%d CE, %d PE) for expiry %s",
            len(token_map),
            ce_count,
            pe_count,
            exp_iso,
        )

        return token_map, subscription_list

    def _generate_synthetic_dump(self) -> List[Dict[str, Any]]:
        """Generates mock Angel One scrip dump for offline simulation."""
        today = date.today()
        days_ahead = (3 - today.weekday() + 7) % 7
        if days_ahead == 0:
            days_ahead = 7
        next_thu = today + timedelta(days=days_ahead)
        exp_str = next_thu.strftime("%d%b%Y").upper()

        base_spot = self.config.fallback_spot_price
        step = self.config.strike_step
        atm = round(base_spot / step) * step

        records: List[Dict[str, Any]] = []
        token_counter = 45000

        for i in range(-15, 16):
            strike = atm + (i * step)
            for opt_type in ("CE", "PE"):
                sym = f"{self.config.index_symbol}{next_thu.strftime('%d%b%y').upper()}{int(strike)}{opt_type}"
                records.append({
                    "token": str(token_counter),
                    "symbol": sym,
                    "name": self.config.index_symbol,
                    "expiry": exp_str,
                    "strike": f"{strike * 100.0:.6f}",
                    "lotsize": "25",
                    "instrumenttype": "OPTIDX",
                    "exch_seg": "NFO",
                    "tick_size": "5.000000",
                })
                token_counter += 1

        return records
