'use client';

import React, { useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTrades } from '@/contexts/TradesContext';
import type { PnlTrendPoint } from '@/lib/trades/types';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { LineChart, ZoomIn, ZoomOut, Info } from 'lucide-react';

export default function PnlTrendChart() {
  const { analytics, isLoading, isEmpty } = useTrades();
  const chartRef = useRef<ReactECharts>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const pnlData: PnlTrendPoint[] = analytics.pnlTrend || [];

  const handleZoomIn = () => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) return;
    const currentOption = chart.getOption() as any;
    const currentZoom = currentOption.dataZoom[0];
    
    // Zoom in by reducing the range by 20%
    let start = currentZoom.start;
    let end = currentZoom.end;
    const range = end - start;
    const newStart = Math.min(start + range * 0.1, 99);
    const newEnd = Math.max(end - range * 0.1, 1);

    chart.dispatchAction({
      type: 'dataZoom',
      start: newStart,
      end: newEnd,
    });
  };

  const handleZoomOut = () => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) return;
    const currentOption = chart.getOption() as any;
    const currentZoom = currentOption.dataZoom[0];
    
    // Zoom out by expanding the range by 20%
    let start = currentZoom.start;
    let end = currentZoom.end;
    const range = end - start;
    const newStart = Math.max(start - range * 0.1, 0);
    const newEnd = Math.min(end + range * 0.1, 100);

    chart.dispatchAction({
      type: 'dataZoom',
      start: newStart,
      end: newEnd,
    });
  };

  if (isLoading) {
    return <ChartSkeleton height={350} />;
  }

  if (isEmpty || pnlData.length === 0) {
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

  const option = {
    grid: {
      top: 20,
      right: 15,
      left: 15,
      bottom: 25,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'transparent',
      borderWidth: 0,
      padding: 0,
      formatter: function (params: any) {
        if (!params || !params.length) return '';
        const dataIndex = params[0].dataIndex;
        const point = pnlData[dataIndex];
        const isStart = point.tradeNumber === 0;

        const assetHtml = (!isStart && point.asset && point.asset !== '—') 
          ? `<div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px;">
              <span style="color: var(--muted-foreground);">Asset</span>
              <span style="font-weight: 500; color: var(--foreground);">${point.asset}</span>
             </div>`
          : '';

        const pnlHtml = !isStart
          ? `<div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px;">
              <span style="color: var(--muted-foreground);">Trade P&L</span>
              <span style="font-weight: 600; font-family: monospace; color: ${point.pnl >= 0 ? '#22c55e' : '#ef4444'};">
                ${point.pnl >= 0 ? '+' : '-'}$${Math.abs(point.pnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
             </div>`
          : '';

        const equityHtml = `<div style="display: flex; justify-content: space-between; gap: 16px; padding-top: 4px; margin-top: 4px; border-top: 1px solid rgba(128,128,128,0.2);">
            <span style="color: var(--muted-foreground); font-weight: 500;">Running Equity</span>
            <span style="font-weight: 700; font-family: monospace; color: ${point.cumulative >= 0 ? '#22c55e' : '#ef4444'};">
              ${point.cumulative >= 0 ? '+' : '-'}$${Math.abs(point.cumulative).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>`;

        return `
          <div style="background-color: var(--background); border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); padding: 12px; border-radius: 6px; font-size: 12px; min-width: 180px;">
            <p style="color: var(--muted-foreground); font-weight: 500; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(128,128,128,0.2);">
              ${isStart ? 'Starting Point' : `Trade #${point.tradeNumber} — ${point.date}`}
            </p>
            ${assetHtml}
            ${pnlHtml}
            ${equityHtml}
          </div>
        `;
      },
    },
    xAxis: {
      type: 'category',
      data: pnlData.map((d) => (d.tradeNumber === 0 ? 'Start' : d.date)),
      boundaryGap: false,
      axisLabel: {
        color: 'var(--muted-foreground)',
        fontSize: 10,
        formatter: function (value: string, index: number) {
          const point = pnlData[index];
          if (!point) return value;
          return point.tradeNumber === 0 ? '' : point.date;
        }
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: 'var(--muted-foreground)',
        fontSize: 10,
        formatter: (value: number) => {
          return `$${Math.abs(value) >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`;
        },
      },
      splitLine: {
        lineStyle: {
          color: 'var(--border)',
          type: 'dashed',
          opacity: 0.5,
        },
      },
    },
    visualMap: {
      show: false,
      dimension: 1, // y-axis
      pieces: [
        { gt: 0, color: '#22c55e' }, // Green for > 0
        { lte: 0, color: '#ef4444' }, // Red for <= 0
      ],
      outOfRange: {
        color: '#999',
      },
    },
    dataZoom: [
      {
        type: 'inside', // Mouse scroll & drag to pan
        start: 0,
        end: 100,
      }
    ],
    series: [
      {
        name: 'Equity',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: 'var(--background)',
          borderColor: 'inherit',
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'inherit' },
              { offset: 1, color: 'transparent' }
            ],
          },
          opacity: 0.15,
        },
        data: pnlData.map((d) => d.cumulative),
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{ yAxis: 0 }],
          lineStyle: {
            color: 'var(--muted-foreground)',
            type: 'dashed',
            opacity: 0.5,
          },
        },
      },
    ],
  };

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
                <li>• Mouse Wheel = Zoom in/out</li>
                <li>• Drag chart = Pan left/right</li>
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
      <div className="w-full h-[350px]">
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '100%', width: '100%' }}
          notMerge={true}
          lazyUpdate={true}
          // The empty object configures ReactEcharts correctly without warnings
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  );
}
