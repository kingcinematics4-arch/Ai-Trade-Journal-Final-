'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { useTrades } from '@/contexts/TradesContext';
import type { PnlTrendPoint } from '@/lib/trades/types';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { LineChart, Info, Search, RefreshCw } from 'lucide-react';

/* ── Tooltip ────────────────────────────────────────────── */
type TooltipPayloadItem = {
  value?: ValueType;
  name?: NameType;
  color?: string;
  fill?: string;
  stroke?: string;
  payload?: Record<string, unknown>;
};

type CustomTooltipProps = TooltipProps<ValueType, NameType> & {
  payload?: TooltipPayloadItem[];
  label?: string | number;
};

function CustomTooltip(props: CustomTooltipProps) {
  const { active, payload, label } = props;

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0];
  const point = item.payload as unknown as PnlTrendPoint;
  const isStart = point.tradeNumber === 0;

  // Consistency: use label if available, fallback to point tradeNumber
  const tradeNum =
    label !== undefined && label !== null && label !== '' ? label : point.tradeNumber;

  // Resolve color dynamically. Handle gradient URLs by falling back to semantic profit/loss colors.
  const color =
    item.stroke && typeof item.stroke === 'string' && !item.stroke.includes('url')
      ? item.stroke
      : point.cumulative >= 0
        ? '#22c55e'
        : '#ef4444';

  return (
    <div className="card-elevated shadow-xl p-3 text-xs min-w-[180px] border border-border/50 rounded-md bg-background/95 backdrop-blur z-50">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-muted-foreground font-semibold truncate font-tabular">
          {isStart ? 'Starting Point' : `Trade #${tradeNum} — ${point.date}`}
        </p>
      </div>

      {!isStart && point.asset && point.asset !== '—' && (
        <div className="flex justify-between gap-4 mb-1">
          <span className="text-muted-foreground">Asset</span>
          <span className="font-medium">{point.asset}</span>
        </div>
      )}

      {!isStart && (
        <div className="flex justify-between gap-4 mb-1">
          <span className="text-muted-foreground">Trade P&L</span>
          <span
            className={`font-bold font-tabular ${point.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {point.pnl >= 0 ? '+' : '-'}$
            {Math.abs(point.pnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <div
        className={`flex justify-between gap-4 ${!isStart ? 'pt-1 mt-1 border-t border-border/50' : ''}`}
      >
        <span className="text-muted-foreground font-medium">Running Equity</span>
        <span
          className={`font-bold font-tabular ${point.cumulative >= 0 ? 'text-green-400' : 'text-red-400'}`}
        >
          {point.cumulative >= 0 ? '+' : '-'}$
          {Math.abs(point.cumulative).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

const MIN_VISIBLE_POINTS = 2;

/* ── Chart ──────────────────────────────────────────────── */
export default function PnlTrendChart() {
  const { analytics, isLoading, isEmpty } = useTrades();
  const [showTooltip, setShowTooltip] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const pnlData: PnlTrendPoint[] = analytics.pnlTrend || [];
  const dataLength = pnlData.length;

  // Viewport & Interaction states
  const [zoomMode, setZoomMode] = useState(false);
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [isAPressed, setIsAPressed] = useState(false);
  const [isChartHovered, setIsChartHovered] = useState(false);

  // Initialize viewport to full data range
  useEffect(() => {
    if (dataLength > 0 && zoomRange.end === 100 && zoomRange.start === 0) {
      setZoomRange({ start: 0, end: dataLength });
    }
  }, [dataLength]);

  const visibleData = useMemo(() => {
    if (!dataLength) return [];
    const start = Math.max(0, Math.min(zoomRange.start, dataLength - MIN_VISIBLE_POINTS));
    const end = Math.max(start + MIN_VISIBLE_POINTS, Math.min(dataLength, zoomRange.end));
    return pnlData.slice(start, end);
  }, [pnlData, dataLength, zoomRange]);

  /* ── Keyboard Listeners (A key) ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'a') setIsAPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'a') setIsAPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  /* ── Chart Zoom (A + Scroll) ── */
  const handleWheel = React.useCallback(
    (e: WheelEvent) => {
      if (!isAPressed || !isChartHovered) return;

      // Prevent page scroll when zooming
      e.preventDefault();

      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Recharts margin compensation
      const leftMargin = -20;
      const rightMargin = 5;
      const chartWidth = rect.width - leftMargin - rightMargin;

      const mouseX = e.clientX - rect.left - leftMargin;
      const mouseRatio = Math.min(Math.max(mouseX / chartWidth, 0), 1);
      const currentRange = zoomRange.end - zoomRange.start;

      let newRange;

      if (e.deltaY < 0) {
        // ZOOM IN
        newRange = Math.max(MIN_VISIBLE_POINTS, Math.floor(currentRange * 0.8));

        // force shrink
        if (newRange === currentRange && currentRange > MIN_VISIBLE_POINTS) {
          newRange = currentRange - 1;
        }
      } else {
        // ZOOM OUT
        newRange = Math.min(dataLength, Math.ceil(currentRange * 1.25));

        // force growth
        if (newRange === currentRange && currentRange < dataLength) {
          newRange = currentRange + 1;
        }
      }

      const focusIndex = Math.round(zoomRange.start + (currentRange - 1) * mouseRatio);

      // CENTER selected point in viewport
      let newStart = Math.round(focusIndex - newRange / 2);

      let newEnd = Math.round(newStart + newRange);

      // left clamp
      if (newStart < 0) {
        newStart = 0;
        newEnd = newRange;
      }

      // right clamp
      if (newEnd > dataLength) {
        newEnd = dataLength;
        newStart = dataLength - newRange;
      }

      // final protection
      newStart = Math.max(0, newStart);
      newEnd = Math.min(dataLength, newEnd);

      setZoomRange({
        start: newStart,
        end: newEnd,
      });
    },
    [isAPressed, isChartHovered, dataLength, zoomRange]
  );

  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  /* ── Pan & Drag Controls ── */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!zoomMode) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!zoomMode || !isDragging) return;
    const deltaX = e.clientX - dragStartX;

    // Sensitivity: how many pixels mouse moves to shift by 1 trade point
    const windowSize = zoomRange.end - zoomRange.start;
    const sensitivity = Math.max(5, 500 / windowSize);

    if (Math.abs(deltaX) > sensitivity) {
      const shift = Math.round(-deltaX / sensitivity); // negative because moving mouse right means panning left

      setZoomRange((prev) => {
        let newStart = prev.start + shift;
        let newEnd = prev.end + shift;

        // Clamp boundaries safely
        if (newStart < 0) {
          newStart = 0;
          newEnd = windowSize;
        }
        if (newEnd > dataLength) {
          newEnd = dataLength;
          newStart = Math.max(0, newEnd - windowSize);
        }

        return { start: newStart, end: newEnd };
      });

      setDragStartX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    if (!zoomMode) return;
    setIsDragging(false);
  };

  const handleResetZoom = () => {
    setZoomRange({ start: 0, end: dataLength });
  };

  /* ── Chart Layout/Aesthetics ── */
  const { domainMin, domainMax } = useMemo(() => {
    if (!visibleData || visibleData.length === 0) return { domainMin: 0, domainMax: 0 };
    const equities = visibleData.map((d) => d.cumulative);
    const min = Math.min(...equities);
    const max = Math.max(...equities);
    const padding = (max - min) * 0.1;

    if (padding === 0) {
      return { domainMin: min - 100, domainMax: max + 100 };
    }
    return { domainMin: min - padding, domainMax: max + padding };
  }, [visibleData]);

  if (isLoading) {
    return <ChartSkeleton height={350} />;
  }

  if (isEmpty || visibleData.length === 0) {
    return (
      <EmptyState
        icon={<LineChart size={24} />}
        title="No P&L trend yet"
        description="Your cumulative equity curve will appear here after you log trades."
        actionLabel="Add a trade"
        actionHref="/add-trade"
        className="py-8"
      />
    );
  }

  const isZoomActive = zoomMode && isAPressed;

  return (
    <div className="relative w-full">
      {/* Zoom Active Indicator Overlay */}
      {isZoomActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-blue-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
            <Search size={14} />
            Zoom Active (A + Scroll)
          </div>
        </div>
      )}

      {/* Interactive Header */}
      <div className="flex flex-wrap items-center justify-end gap-2 mb-4 px-1">
        <div className="relative">
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info size={16} />
          </button>

          {showTooltip && (
            <div className="absolute top-8 right-0 bg-popover text-popover-foreground text-xs p-3 rounded-md shadow-xl border border-border w-56 whitespace-nowrap z-50">
              <p className="font-semibold mb-2">Zoom Controls:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Hold A + Scroll = Zoom</li>
                <li>• Drag = Move chart</li>
                <li>• Double click = Reset view</li>
              </ul>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleResetZoom}
          className="p-1.5 rounded-md bg-background/50 backdrop-blur border border-border shadow-sm hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
          title="Reset View"
        >
          <RefreshCw size={14} />
        </button>

        <button
          type="button"
          onClick={() => setZoomMode(!zoomMode)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors border flex items-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            zoomMode
              ? 'text-blue-500 border-blue-500/20'
              : 'bg-background/50 backdrop-blur text-muted-foreground border-border hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Search size={14} />
          Zoom Mode: {zoomMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Chart */}
      <div
        ref={wrapperRef}
        tabIndex={-1} // Make it programmatically focusable but not via tab key
        className={`w-full h-[180px] md:h-[300px] lg:h-[350px] transition-colors select-none overflow-hidden focus-visible:outline-none focus-visible:ring-0 ${
          !zoomMode
            ? 'cursor-default'
            : isZoomActive
              ? 'cursor-zoom-in'
              : isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
        }`}
        onMouseEnter={() => setIsChartHovered(true)}
        onMouseLeave={(e) => {
          setIsChartHovered(false);
          handleMouseUp();
        }}
        onDoubleClick={handleResetZoom}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                {visibleData.map((entry, index) => {
                  if (index === 0) return null;
                  const isUp = entry.pnl >= 0;
                  const color = isUp ? '#22c55e' : '#ef4444';
                  const prevOffset = ((index - 1) / (visibleData.length - 1)) * 100;
                  const offset = (index / (visibleData.length - 1)) * 100;
                  return (
                    <React.Fragment key={index}>
                      <stop offset={`${prevOffset}%`} stopColor={color} />
                      <stop offset={`${offset}%`} stopColor={color} />
                    </React.Fragment>
                  );
                })}
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
              opacity={0.5}
            />
            <XAxis
              dataKey="tradeNumber"
              type="category"
              tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              interval="preserveEnd"
              minTickGap={50} // Professional density for phone screens
              dy={6}
              tickFormatter={(val) => {
                const point = visibleData.find((p) => p.tradeNumber === val);
                return point && point.tradeNumber !== 0 ? point.date : '';
              }}
            />
            <YAxis
              domain={[domainMin, domainMax]}
              tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                `$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
              }
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <ReferenceLine
              y={0}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 3"
              opacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              fill="none"
              isAnimationActive={!isDragging && !zoomMode} // Disable animation when interacting for snappy responsiveness
              animationDuration={500}
              animationEasing="ease-in-out"
              dot={{
                r: 3,
                fill: 'var(--background)',
                stroke: 'var(--muted-foreground)',
                strokeWidth: 1.5,
              }}
              activeDot={{
                r: 6,
                fill: 'var(--background)',
                stroke: 'var(--foreground)',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
