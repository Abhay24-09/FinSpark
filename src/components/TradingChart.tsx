import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  IChartApi,
  ISeriesApi,
  Time,
  CrosshairMode,
} from 'lightweight-charts';
import {
  fetchCandles,
  FormattedCandle,
  CandleInterval,
} from '../services/marketApi';
import { createSimulatedTick } from '../services/marketData';
import ApiStatusBadge from './common/ApiStatusBadge';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  Play,
  Square,
  BarChart2,
  Crosshair,
  TrendingUp,
  Pencil,
  Type,
  Ruler,
  ZoomIn,
  Magnet,
  Lock,
  Eye,
  Trash2,
  Camera,
  Settings,
  Calendar,
  Save,
  ChevronDown,
  SlidersHorizontal,
  Shapes,
} from 'lucide-react';

export interface TradingChartProps {
  instrumentKey?: string;
  interval?: CandleInterval | string;
  authToken?: string;
  height?: number | string;
  className?: string;
  showToolbar?: boolean;
  theme?: 'light' | 'dark';
  isExpanded?: boolean;
  exchange?: 'NSE' | 'BSE' | string;
  stock?: any;
  basePrice?: number;
  onToggleExpand?: () => void;
  onRealtimeTick?: (candle: FormattedCandle) => void;
}

export interface TradingChartRef {
  updateCandle: (candle: FormattedCandle) => void;
  fitContent: () => void;
  getChart: () => IChartApi | null;
  getSeries: () => ISeriesApi<'Candlestick', Time> | null;
}

const INTERVAL_OPTIONS: { id: CandleInterval; label: string; tvLabel: string }[] = [
  { id: '1minute', label: '1m', tvLabel: '1' },
  { id: '30minute', label: '30m', tvLabel: '30' },
  { id: 'day', label: '1D', tvLabel: 'D' },
  { id: 'week', label: '1W', tvLabel: 'W' },
  { id: 'month', label: '1M', tvLabel: 'M' },
];

const TIMEFRAME_RANGES = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'];

export const TradingChart = forwardRef<TradingChartRef, TradingChartProps>(
  (
    {
      instrumentKey: defaultKey = 'NSE_INDEX|Nifty 50',
      interval: defaultInterval = 'day',
      authToken,
      height = 440,
      className = '',
      showToolbar = true,
      theme = 'light',
      isExpanded = false,
      exchange = 'NSE',
      stock,
      basePrice,
      onToggleExpand,
      onRealtimeTick,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick', Time> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram', Time> | null>(null);
    const lastCandleRef = useRef<FormattedCandle | null>(null);

    const [selectedInstrument, setSelectedInstrument] = useState<string>(defaultKey);
    const [selectedInterval, setSelectedInterval] = useState<CandleInterval | string>(defaultInterval);
    const [activeRange, setActiveRange] = useState<string>('1Y');
    const [activeDrawTool, setActiveDrawTool] = useState<string>('crosshair');
    const [isIntervalDropdownOpen, setIsIntervalDropdownOpen] = useState(false);
    const [isAutoScale, setIsAutoScale] = useState(true);

    // Sync selected instrument if defaultKey changes externally
    useEffect(() => {
      if (defaultKey) {
        setSelectedInstrument(defaultKey);
      }
    }, [defaultKey]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLive, setIsLive] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    // Clock state for the TradingView footer (UTC+5:30)
    const [currentTime, setCurrentTime] = useState<string>('');

    useEffect(() => {
      const updateClock = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
          hour12: false,
          timeZone: 'Asia/Kolkata',
        });
        setCurrentTime(`${timeStr} (UTC+5:30)`);
      };
      updateClock();
      const intervalTimer = setInterval(updateClock, 1000);
      return () => clearInterval(intervalTimer);
    }, []);

    // Active hovered or latest candle values for the OHLC legend
    const [legendData, setLegendData] = useState<{
      open: number;
      high: number;
      low: number;
      close: number;
      change: number;
      changePercent: string;
      isPositive: boolean;
      volume?: number;
    } | null>(null);

    const updateLegend = useCallback((candle: FormattedCandle) => {
      const diff = candle.close - candle.open;
      const pct = candle.open > 0 ? (diff / candle.open) * 100 : 0;
      setLegendData({
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        change: Math.round(diff * 100) / 100,
        changePercent: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
        isPositive: diff >= 0,
        volume: candle.volume || 2740000,
      });
    }, []);

    // Expose imperative API for external components
    useImperativeHandle(
      ref,
      () => ({
        updateCandle: (candle: FormattedCandle) => {
          if (seriesRef.current) {
            seriesRef.current.update(candle);
            lastCandleRef.current = candle;
            updateLegend(candle);
            if (volumeSeriesRef.current) {
              volumeSeriesRef.current.update({
                time: candle.time,
                value: candle.volume || 180000,
                color: candle.close >= candle.open ? 'rgba(8, 153, 129, 0.35)' : 'rgba(242, 54, 69, 0.35)',
              });
            }
            if (onRealtimeTick) onRealtimeTick(candle);
          }
        },
        fitContent: () => {
          chartRef.current?.timeScale().fitContent();
        },
        getChart: () => chartRef.current,
        getSeries: () => seriesRef.current,
      }),
      [onRealtimeTick, updateLegend]
    );

    const isLight = theme === 'light';

    // 1. Initialize Chart
    useEffect(() => {
      if (!containerRef.current) return;

      let chart: IChartApi | null = null;
      let resizeObserver: ResizeObserver | null = null;

      try {
        chart = createChart(containerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: isLight ? '#ffffff' : '#090d16' },
            textColor: isLight ? '#475467' : '#94a3b8',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontSize: 11,
          },
          grid: {
            vertLines: { color: isLight ? '#f2f4f7' : 'rgba(255, 255, 255, 0.04)' },
            horzLines: { color: isLight ? '#f2f4f7' : 'rgba(255, 255, 255, 0.04)' },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
            vertLine: {
              color: isLight ? '#98a2b3' : '#6366f1',
              width: 1,
              style: 2,
              labelBackgroundColor: isLight ? '#344054' : '#4f46e5',
            },
            horzLine: {
              color: isLight ? '#98a2b3' : '#6366f1',
              width: 1,
              style: 2,
              labelBackgroundColor: isLight ? '#344054' : '#4f46e5',
            },
          },
          rightPriceScale: {
            borderColor: isLight ? '#eaecf0' : 'rgba(255, 255, 255, 0.08)',
            scaleMargins: {
              top: 0.08,
              bottom: 0.18,
            },
          },
          timeScale: {
            borderColor: isLight ? '#eaecf0' : 'rgba(255, 255, 255, 0.08)',
            timeVisible: selectedInterval === '1minute' || selectedInterval === '30minute',
            secondsVisible: false,
          },
        });

        // Add Candlestick Series (TradingView Standard Colors)
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#089981',
          downColor: '#f23645',
          borderVisible: false,
          wickUpColor: '#089981',
          wickDownColor: '#f23645',
        });

        // Add Volume Histogram Series at the bottom of the chart
        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: '#089981',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '', // Set as overlay
        });

        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;
        volumeSeriesRef.current = volumeSeries;

        // Subscribe to crosshair move to update the OHLC legend
        chart.subscribeCrosshairMove((param) => {
          if (!param || !param.time || !param.seriesData) {
            if (lastCandleRef.current) {
              updateLegend(lastCandleRef.current);
            }
            return;
          }

          const data = param.seriesData.get(candlestickSeries) as FormattedCandle | undefined;
          if (data && data.open !== undefined) {
            updateLegend(data);
          }
        });

        // ResizeObserver to fit container width dynamically
        resizeObserver = new ResizeObserver((entries) => {
          if (!entries || entries.length === 0 || !entries[0].contentRect) return;
          const { width, height: containerHeight } = entries[0].contentRect;
          if (width > 0 && containerHeight > 0 && chart) {
            chart.resize(width, containerHeight);
          }
        });

        resizeObserver.observe(containerRef.current);
      } catch (e) {
        console.warn('TradingChart initialization issue:', e);
      }

      return () => {
        if (resizeObserver) resizeObserver.disconnect();
        if (chart) {
          try {
            chart.remove();
          } catch {
            // ignore cleanup errors
          }
        }
        chartRef.current = null;
        seriesRef.current = null;
        volumeSeriesRef.current = null;
      };
    }, [selectedInterval, updateLegend, isLight]);

    // 1b. Synchronize chart dimensions when height or isExpanded toggles
    useEffect(() => {
      if (chartRef.current && containerRef.current) {
        const h = typeof height === 'number' ? height : parseInt(String(height), 10) || 440;
        const w = containerRef.current.clientWidth;
        if (w > 0 && h > 0) {
          chartRef.current.resize(w, h);
          chartRef.current.timeScale().fitContent();
        }
      }
    }, [height, isExpanded]);

    // 2. Fetch and render candles on mount or whenever instrument/interval changes
    const loadCandles = useCallback(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const resolvedBasePrice =
          basePrice ||
          (typeof stock?.lastTradedPrice === 'number' ? stock.lastTradedPrice : undefined);

        const result = await fetchCandles(
          selectedInstrument,
          selectedInterval,
          undefined,
          undefined,
          resolvedBasePrice
        );

        setIsLive(result.isLive);

        if (result.candles.length > 0) {
          // If stock has specific OHLC metrics for this exchange, align latest candle
          if (stock && typeof stock.lastTradedPrice === 'number') {
            const lastIdx = result.candles.length - 1;
            result.candles[lastIdx] = {
              ...result.candles[lastIdx],
              open: typeof stock.open === 'number' ? stock.open : result.candles[lastIdx].open,
              high: typeof stock.high === 'number' ? stock.high : result.candles[lastIdx].high,
              low: typeof stock.low === 'number' ? stock.low : result.candles[lastIdx].low,
              close: stock.lastTradedPrice,
              volume: stock.volumeTradedToday || result.candles[lastIdx].volume,
            };
          }

          if (seriesRef.current) {
            seriesRef.current.setData(result.candles);
          }

          if (volumeSeriesRef.current) {
            const volumeData = result.candles.map((c) => ({
              time: c.time,
              value: c.volume || Math.floor(Math.random() * 800000 + 200000),
              color: c.close >= c.open ? 'rgba(8, 153, 129, 0.4)' : 'rgba(242, 54, 69, 0.4)',
            }));
            volumeSeriesRef.current.setData(volumeData);
          }

          const latest = result.candles[result.candles.length - 1];
          lastCandleRef.current = latest;
          updateLegend(latest);
          chartRef.current?.timeScale().fitContent();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch candle data';
        setError(msg);
        setIsLive(false);
      } finally {
        setIsLoading(false);
      }
    }, [selectedInstrument, selectedInterval, updateLegend, basePrice, stock]);

    useEffect(() => {
      loadCandles();
    }, [loadCandles]);

    // 3. Real-time tick streaming simulation
    useEffect(() => {
      if (!isLiveStreaming) return;

      const timer = setInterval(() => {
        if (!seriesRef.current || !lastCandleRef.current) return;

        const updated = createSimulatedTick(lastCandleRef.current);
        seriesRef.current.update(updated);
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: updated.time,
            value: updated.volume || 250000,
            color: updated.close >= updated.open ? 'rgba(8, 153, 129, 0.4)' : 'rgba(242, 54, 69, 0.4)',
          });
        }
        lastCandleRef.current = updated;
        updateLegend(updated);
        if (onRealtimeTick) {
          onRealtimeTick(updated);
        }
      }, 1000);

      return () => clearInterval(timer);
    }, [isLiveStreaming, updateLegend, onRealtimeTick]);

    // Clean display symbol
    const cleanSymbol = selectedInstrument
      .replace('NSE_INDEX|', '')
      .replace('BSE_INDEX|', '')
      .replace('NSE_EQ|', '')
      .replace('BSE_EQ|', '')
      .replace('-EQ', '')
      .toUpperCase();

    const activeTvInterval =
      INTERVAL_OPTIONS.find((i) => i.id === selectedInterval)?.tvLabel || 'D';

    return (
      <div
        className={`bg-white border border-gray-200/90 rounded-xl overflow-hidden flex flex-col shadow-xs transition-all ${
          isFullscreen ? 'fixed inset-0 sm:inset-4 z-[100] shadow-2xl bg-white' : ''
        } ${className}`}
      >
        {/* 1. TradingView Top Header & Toolbar */}
        {showToolbar && (
          <div className="bg-white border-b border-gray-200 px-3 py-1.5 flex items-center justify-between gap-3 text-xs select-none">
            {/* Left Controls: Interval Dropdown, Candle Style, Indicators, Trade with TradingView */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Interval Dropdown (e.g. 'D') */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsIntervalDropdownOpen((prev) => !prev)}
                  className="px-2 py-1 rounded hover:bg-gray-100 text-gray-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Select Timeframe Interval"
                >
                  <span>{activeTvInterval}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {isIntervalDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[90px] animate-in fade-in duration-100">
                    {INTERVAL_OPTIONS.map((intv) => (
                      <button
                        key={intv.id}
                        type="button"
                        onClick={() => {
                          setSelectedInterval(intv.id);
                          setIsIntervalDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedInterval === intv.id ? 'font-bold text-primary' : 'text-gray-700'
                        }`}
                      >
                        <span>{intv.label}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{intv.tvLabel}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Candlestick Style Icon Button */}
              <button
                type="button"
                className="p-1 rounded hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                title="Candlestick Chart"
              >
                <BarChart2 className="w-4 h-4 text-gray-600 rotate-90" />
              </button>

              {/* Indicators Button */}
              <button
                type="button"
                className="px-2 py-1 rounded hover:bg-gray-100 text-gray-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Indicators & Metrics"
              >
                <span className="font-serif italic font-bold text-primary">fx</span>
                <span className="text-xs text-gray-700 font-semibold">Indicators</span>
              </button>

              {/* Trade with TradingView Branding Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-[11px] text-gray-600">
                <span className="text-gray-400 font-medium">Trade with</span>
                <span className="font-bold text-gray-900 tracking-tight flex items-center gap-1">
                  <span className="w-3.5 h-2.5 bg-black text-white text-[8px] font-black rounded-xs flex items-center justify-center">
                    TV
                  </span>
                  TradingView
                </span>
              </div>
            </div>

            {/* Right Controls: Save, Camera, Settings, Fullscreen, Stream Toggle */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              {/* Live Streaming Toggle */}
              <button
                type="button"
                onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                  isLiveStreaming
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title={isLiveStreaming ? 'Pause Real-time Ticks' : 'Start Real-time Ticks'}
              >
                {isLiveStreaming ? (
                  <>
                    <Square className="w-3 h-3 text-rose-600 fill-current" />
                    <span>Live</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-emerald-600 fill-current" />
                    <span>Simulate</span>
                  </>
                )}
              </button>

              {/* Save Layout Button */}
              <button
                type="button"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                title="Save Chart Layout"
              >
                <Save className="w-3.5 h-3.5 text-gray-500" />
                <span>Save</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {/* Camera / Snapshot */}
              <button
                type="button"
                className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Take Chart Snapshot"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Chart Settings Gear */}
              <button
                type="button"
                className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Chart Properties"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Fullscreen Expand Button */}
              <button
                type="button"
                onClick={onToggleExpand ? onToggleExpand : () => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                title={
                  onToggleExpand
                    ? (isExpanded ? 'Restore Layout (Show Analytics)' : 'Expand Chart (Hide Analytics)')
                    : (isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen')
                }
              >
                {(onToggleExpand ? isExpanded : isFullscreen) ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* 2. Main Middle Workspace: Left Vertical Drawing Toolbar + Canvas Area */}
        <div className="flex-1 flex relative w-full" style={{ minHeight: height }}>
          {/* Left Vertical TradingView Drawing Toolbar */}
          <div className="w-10 bg-white border-r border-gray-200 flex flex-col items-center py-2 gap-1.5 shrink-0 select-none z-10 text-gray-500">
            {[
              { id: 'crosshair', icon: Crosshair, title: 'Crosshair / Cursor' },
              { id: 'trendline', icon: TrendingUp, title: 'Trend Line Tools' },
              { id: 'fibonacci', icon: SlidersHorizontal, title: 'Gann and Fibonacci Tools' },
              { id: 'brush', icon: Pencil, title: 'Brush and Geometric Shapes' },
              { id: 'text', icon: Type, title: 'Annotation / Text' },
              { id: 'patterns', icon: Shapes, title: 'Patterns' },
              { id: 'ruler', icon: Ruler, title: 'Measure / Price Range' },
              { id: 'zoom', icon: ZoomIn, title: 'Zoom In' },
              { id: 'magnet', icon: Magnet, title: 'Magnet Mode' },
              { id: 'lock', icon: Lock, title: 'Lock All Drawings' },
              { id: 'eye', icon: Eye, title: 'Hide Drawing Tools' },
              { id: 'trash', icon: Trash2, title: 'Remove Objects' },
            ].map((tool) => {
              const Icon = tool.icon;
              const isActive = activeDrawTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveDrawTool(tool.id)}
                  className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={tool.title}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Chart Canvas & Top-Left OHLC Overlay */}
          <div className="flex-1 relative min-w-0 bg-white">
            {/* Top-Left In-Canvas OHLC Legend Overlay matching Figma */}
            <div className="absolute top-2 left-3 z-10 pointer-events-none select-none text-[11px] leading-tight space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <span>{cleanSymbol}</span>
                  <span className="text-gray-400">•</span>
                  <span>{activeTvInterval}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 font-bold">{exchange || (selectedInstrument.startsWith('BSE') ? 'BSE' : 'NSE')}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400 inline" />
                </span>

                {legendData ? (
                  <div className="flex items-center gap-2 text-gray-600 font-mono text-[11px]">
                    <span>
                      O <strong className="text-gray-800 font-bold">{legendData.open.toFixed(2)}</strong>
                    </span>
                    <span>
                      H <strong className="text-gray-800 font-bold">{legendData.high.toFixed(2)}</strong>
                    </span>
                    <span>
                      L <strong className="text-gray-800 font-bold">{legendData.low.toFixed(2)}</strong>
                    </span>
                    <span>
                      C <strong className="text-gray-800 font-bold">{legendData.close.toFixed(2)}</strong>
                    </span>
                    <span
                      className={`font-bold ${
                        legendData.isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {legendData.change >= 0 ? '+' : ''}
                      {legendData.change.toFixed(2)} ({legendData.changePercent})
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-[11px]">Loading candles...</span>
                )}
              </div>

              {/* Volume Line */}
              <div className="text-[10px] text-gray-500 font-mono">
                Volume <strong className="text-gray-700">2.74M</strong>
              </div>
            </div>

            {/* Container for Lightweight Charts */}
            <div
              ref={containerRef}
              className="w-full h-full"
              style={{ minHeight: height }}
            />

            {/* Bottom-Right In-Canvas Expand / Restore Button matching Figma */}
            <button
              type="button"
              onClick={onToggleExpand ? onToggleExpand : () => setIsFullscreen(!isFullscreen)}
              className="absolute bottom-2.5 right-14 z-20 p-1 rounded-md bg-white/95 hover:bg-white border border-gray-200/90 shadow-xs flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all cursor-pointer backdrop-blur-xs"
              title={
                onToggleExpand
                  ? (isExpanded ? 'Restore View (Show Analytics)' : 'Expand Chart (Hide Analytics)')
                  : (isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen')
              }
            >
              {(onToggleExpand ? isExpanded : isFullscreen) ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* 3. TradingView Bottom Toolbar: Timeframes, Calendar, Clock, Scales */}
        <div className="bg-white border-t border-gray-200 px-3 py-1 flex items-center justify-between text-[11px] text-gray-500 select-none">
          {/* Left: Timeframe range buttons (1D 5D 1M 3M 6M YTD 1Y 5Y All) */}
          <div className="flex items-center gap-1">
            {TIMEFRAME_RANGES.map((rng) => {
              const isActive = activeRange === rng;
              return (
                <button
                  key={rng}
                  type="button"
                  onClick={() => {
                    setActiveRange(rng);
                    chartRef.current?.timeScale().fitContent();
                  }}
                  className={`px-1.5 py-0.5 rounded font-semibold text-[11px] transition-colors cursor-pointer ${
                    isActive
                      ? 'text-primary font-bold bg-primary/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {rng}
                </button>
              );
            })}

            <button
              type="button"
              className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors ml-1 cursor-pointer"
              title="Go to Date"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Real-time timezone clock + scale options (% log auto) */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
              {currentTime}
            </span>

            <div className="flex items-center gap-1 font-semibold text-[11px]">
              <button
                type="button"
                className="px-1 py-0.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                title="Percentage scale"
              >
                %
              </button>
              <button
                type="button"
                className="px-1 py-0.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                title="Logarithmic scale"
              >
                log
              </button>
              <button
                type="button"
                onClick={() => setIsAutoScale(!isAutoScale)}
                className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                  isAutoScale
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Auto scale"
              >
                auto
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TradingChart.displayName = 'TradingChart';

export default TradingChart;
