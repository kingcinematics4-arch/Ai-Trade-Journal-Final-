'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
import { useTrades } from '@/contexts/TradesContext';
import type { PnlTrendPoint } from '@/lib/trades/types';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { LineChart, ZoomIn, ZoomOut, Info, RefreshCw } from 'lucide-react';

/* ── Tooltip ────────────────────────────────────────────── */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PnlTrendPoint }>;
  label?: string;
  isDragging?: boolean;
}

function CustomTooltip({ active, payload, isDragging }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || isDragging) return null;

  const point = payload[0].payload;
  const isStart = point.tradeNumber === 0;

  return (
    <div className="card-elevated shadow-xl p-3 text-xs min-w-[180px] border border-border/50 rounded-md bg-background/95 backdrop-blur">
      <p className="text-muted-foreground font-medium mb-2 pb-2 border-b border-border/50">
        {isStart ? 'Starting Point' : `Trade #${point.tradeNumber} — ${point.date}`}
      </p>
      
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
            className={`font-semibold font-tabular ${point.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}
          >
            {point.pnl >= 0 ? '+' : '-'}$
            {Math.abs(point.pnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <div className={`flex justify-between gap-4 ${!isStart ? 'pt-1 mt-1 border-t border-border/50' : ''}`}>
        <span className="text-muted-foreground font-medium">Running Equity</span>
        <span
          className={`font-bold font-tabular ${point.cumulative >= 0 ? 'text-green-500' : 'text-red-500'}`}
        >
          {point.cumulative >= 0 ? '+' : '-'}$
          {Math.abs(point.cumulative).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

/* ── Chart ──────────────────────────────────────────────── */
export default function PnlTrendChart() {
  const { analytics, isLoading, isEmpty } = useTrades();
  const [showTooltip, setShowTooltip] = useState(false);
  
  const pnlData: PnlTrendPoint[] = analytics.pnlTrend || [];
  const dataLength = pnlData.length;
  
  // Viewport state
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  // Safely initialize to max data length when loaded
  useEffect(() => {
    if (dataLength > 0 && zoomRange.end === 100 && zoomRange.start === 0) {
      setZoomRange({ start: 0, end: dataLength - 1 });
    }
  }, [dataLength, zoomRange.start, zoomRange.end]);

  const visibleData = useMemo(() => {
    if (!dataLength) return [];
    const start = Math.max(0, Math.min(zoomRange.start, dataLength - 1));
    const end = Math.min(dataLength - 1, Math.max(zoomRange.end, start + 1));
    return pnlData.slice(start, end + 1);
  }, [pnlData, dataLength, zoomRange]);

  /* ── Zoom Controls ── */
  const handleZoomIn = () => {
    setZoomRange((prev) => {
      const windowSize = prev.end - prev.start;
      if (windowSize <= 2) return prev; // max zoom reached
      const shift = Math.max(1, Math.floor(windowSize * 0.15));
      return { 
        start: prev.start + shift, 
        end: prev.end - shift 
      };
    });
  };

  const handleZoomOut = () => {
    setZoomRange((prev) => {
      const windowSize = prev.end - prev.start;
      const shift = Math.max(1, Math.floor(windowSize * 0.15));
      return { 
        start: Math.max(0, prev.start - shift), 
        end: Math.min(dataLength - 1, prev.end + shift) 
      };
    });
  };

  const handleResetZoom = () => {
    setZoomRange({ start: 0, end: Math.max(0, dataLength - 1) });
  };

  /* ── Pan & Drag Controls ── */
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    
    // Sensitivity: how many pixels mouse moves to shift by 1 trade point
    // We adjust sensitivity based on how zoomed in we are (more zoomed in = slower pan needed)
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
        if (newEnd >= dataLength) {
          newEnd = dataLength - 1;
          newStart = Math.max(0, newEnd - windowSize);
        }
        
        return { start: newStart, end: newEnd };
      });
      
      setDragStartX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      if (e.deltaY < 0) handleZoomIn();
      else handleZoomOut();
    } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // Pan
      const shift = e.deltaX > 0 || e.deltaY > 0 ? 1 : -1;
      setZoomRange((prev) => {
        const windowSize = prev.end - prev.start;
        let newStart = prev.start + shift;
        let newEnd = prev.end + shift;
        
        if (newStart < 0) { newStart = 0; newEnd = windowSize; }
        if (newEnd >= dataLength) { newEnd = dataLength - 1; newStart = Math.max(0, newEnd - windowSize); }
        
        return { start: newStart, end: newEnd };
      });
    }
  };

  /* ── Chart Layout/Aesthetics ── */
  const gradientOffset = useMemo(() => {
    if (!visibleData || visibleData.length === 0) return 0;
    const dataMax = Math.max(...visibleData.map((i) => i.cumulative));
    const dataMin = Math.min(...visibleData.map((i) => i.cumulative));
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  }, [visibleData]);

  const { domainMin, domainMax } = useMemo(() => {
    if (!visibleData || visibleData.length === 0) return { domainMin: 0, domainMax: 0 };
    const equities = visibleData.map((d) => d.cumulative);
    const min = Math.min(...equities);
    const max = Math.max(...equities);
    const padding = (max - min) * 0.15;
    
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

  const off = gradientOffset;

  return (
    <div className="relative w-full">
      {/* Interactive Header */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <div className="relative">
          <button 
            type="button" 
            className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info size={16} />
          </button>
          
          {showTooltip && (
            <div className="absolute top-8 right-0 bg-popover text-popover-foreground text-xs p-3 rounded-md shadow-xl border border-border w-64 whitespace-nowrap z-50">
              <p className="font-semibold mb-2">Zoom & Pan Controls:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Drag chart = Pan left/right</li>
                <li>• Ctrl + Wheel = Zoom in/out</li>
                <li>• Shift + Wheel = Pan left/right</li>
                <li>• Double click = Reset zoom</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex items-center bg-background/50 backdrop-blur border border-border rounded-md shadow-sm">
          <button 
            type="button" 
            onClick={handleResetZoom}
            className="p-1.5 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors border-r border-border"
            title="Reset View"
          >
            <RefreshCw size={14} />
          </button>
          <button 
            type="button" 
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors border-r border-border"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button 
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div 
        className={`w-full h-[350px] transition-colors select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel} 
        onDoubleClick={handleResetZoom}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor="#22c55e" stopOpacity={1} />
                <stop offset={off} stopColor="#ef4444" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="splitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset={off} stopColor="#ef4444" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
            <XAxis
              dataKey="tradeNumber"
              type="category"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              dy={10}
              tickFormatter={(val) => {
                const point = visibleData.find((p) => p.tradeNumber === val);
                return point && point.tradeNumber !== 0 ? point.date : '';
              }}
            />
            <YAxis
              domain={[domainMin, domainMax]}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                `$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
              }
              dx={-10}
            />
            <Tooltip
              content={<CustomTooltip isDragging={isDragging} />}
              cursor={!isDragging ? { stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' } : false}
            />
            <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="3 3" opacity={0.5} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="url(#splitColor)"
              strokeWidth={3}
              fill="url(#splitFill)"
              isAnimationActive={!isDragging} // Disable animation during drag for immediate responsiveness
              animationDuration={500}
              animationEasing="ease-in-out"
              dot={{
                r: 3,
                fill: 'var(--background)',
                strokeWidth: 2,
              }}
              activeDot={!isDragging ? {
                r: 6,
                fill: 'var(--background)',
                stroke: 'var(--foreground)',
                strokeWidth: 2,
              } : false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
