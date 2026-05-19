'use client';

import React, { useMemo, useState } from 'react';
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
import { LineChart, ZoomIn, ZoomOut, Info } from 'lucide-react';

/* ── Tooltip ────────────────────────────────────────────── */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PnlTrendPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

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
  
  // Data slicing range for zoom
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 100 });

  // Initialize/clamp zoom bounds safely
  const visibleData = useMemo(() => {
    if (!pnlData.length) return [];
    
    // Ensure bounds are valid
    let start = Math.max(0, zoomRange.start);
    let end = Math.min(pnlData.length - 1, zoomRange.end);
    
    if (end === 100 && pnlData.length > 0 && zoomRange.end === 100) {
      end = pnlData.length - 1; 
    }
    
    if (start >= end) {
      start = Math.max(0, end - 1);
    }
    
    return pnlData.slice(start, end + 1);
  }, [pnlData, zoomRange]);

  const handleZoomIn = () => {
    setZoomRange((prev) => {
      const currentEnd = prev.end === 100 ? pnlData.length - 1 : prev.end;
      const currentStart = prev.start;
      const range = currentEnd - currentStart;
      if (range <= 2) return prev; // Max zoom reached
      
      const newStart = currentStart + Math.max(1, Math.floor(range * 0.15));
      const newEnd = currentEnd - Math.max(1, Math.floor(range * 0.15));
      return { start: newStart, end: Math.max(newStart + 1, newEnd) };
    });
  };

  const handleZoomOut = () => {
    setZoomRange((prev) => {
      const currentEnd = prev.end === 100 ? pnlData.length - 1 : prev.end;
      const currentStart = prev.start;
      const range = currentEnd - currentStart;
      
      const newStart = Math.max(0, currentStart - Math.max(1, Math.floor(range * 0.15)));
      const newEnd = Math.min(pnlData.length - 1, currentEnd + Math.max(1, Math.floor(range * 0.15)));
      return { start: newStart, end: newEnd };
    });
  };

  const handleResetZoom = () => {
    setZoomRange({ start: 0, end: Math.max(0, pnlData.length - 1) });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    
    // If holding Ctrl, use scroll to zoom
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Split percentage gradient
  const gradientOffset = useMemo(() => {
    if (!visibleData || visibleData.length === 0) return 0;
    
    const dataMax = Math.max(...visibleData.map((i) => i.cumulative));
    const dataMin = Math.min(...visibleData.map((i) => i.cumulative));

    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;

    return dataMax / (dataMax - dataMin);
  }, [visibleData]);

  // Dynamic YAxis Padding
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
            <div className="absolute top-8 right-0 bg-popover text-popover-foreground text-xs p-3 rounded-md shadow-xl border border-border w-56 whitespace-nowrap z-50">
              <p className="font-semibold mb-2">Zoom Controls:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Ctrl + Wheel = Zoom in/out</li>
                <li>• Double click = Reset zoom</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex items-center bg-background/50 backdrop-blur border border-border rounded-md shadow-sm">
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
        className="w-full h-[350px]" 
        onWheel={handleWheel} 
        onDoubleClick={handleResetZoom}
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
              content={<CustomTooltip />}
              cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="3 3" opacity={0.5} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="url(#splitColor)"
              strokeWidth={3}
              fill="url(#splitFill)"
              dot={{
                r: 3,
                fill: 'var(--background)',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: 'var(--background)',
                stroke: 'var(--foreground)',
                strokeWidth: 2,
              }}
              animationDuration={500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
