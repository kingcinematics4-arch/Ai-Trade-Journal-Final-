'use client';
import React from 'react';
import Modal from '@/components/ui/Modal';
import { DbTrade } from '@/lib/trades/types';
import StatusBadge from '@/components/ui/StatusBadge';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Target, 
  AlertCircle, 
  BookOpen, 
  Brain, 
  Camera, 
  Tag as TagIcon,
  Star
} from 'lucide-react';
import AppImage from '@/components/ui/AppImage';

interface TradeDetailsModalProps {
  trade: DbTrade | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TradeDetailsModal({ trade, isOpen, onClose }: TradeDetailsModalProps) {
  if (!trade) return null;

  const renderSection = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <div className="text-primary">{icon}</div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );

  const renderField = (label: string, value: any, prefix?: string, suffix?: string) => (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {prefix}{value ?? '—'}{suffix}
      </p>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={trade.trade_title || 'Trade Details'} size="lg">
      <div className="space-y-8 py-4 overflow-y-auto max-h-[70vh] scrollbar-thin pr-2">
        {/* Header Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl border border-border">
          <div className="text-center">
            <p className="text-[10px] uppercase text-muted-foreground font-bold">P&L</p>
            <p className={`text-lg font-bold ${Number(trade.pnl_amount) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {Number(trade.pnl_amount) >= 0 ? '+' : ''}${Math.abs(Number(trade.pnl_amount)).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-muted-foreground font-bold">RR Ratio</p>
            <p className="text-lg font-bold text-foreground">{Number(trade.rr_ratio).toFixed(2)}R</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-muted-foreground font-bold">Direction</p>
            <div className="flex justify-center mt-1">
              <StatusBadge 
                variant={trade.trade_direction as any} 
                label={trade.trade_direction === 'buy' ? 'Long' : 'Short'} 
              />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-muted-foreground font-bold">Status</p>
            <div className="flex justify-center mt-1">
              <StatusBadge variant={trade.trade_status as any} />
            </div>
          </div>
        </div>

        {/* Trade Info */}
        {renderSection('Trade Information', <Calendar size={16} />, (
          <>
            {renderField('Asset', trade.asset_name)}
            {renderField('Market', trade.market_type)}
            {renderField('Date', trade.trade_date)}
            {renderField('Duration', trade.trade_duration)}
          </>
        ))}

        {/* Execution Details */}
        {renderSection('Execution Details', <Target size={16} />, (
          <>
            {renderField('Entry Price', trade.entry_price, '$')}
            {renderField('Exit Price', trade.exit_price, '$')}
            {renderField('Stop Loss', trade.stop_loss, '$')}
            {renderField('Take Profit', trade.take_profit, '$')}
            {renderField('Lot Size', trade.lot_size)}
            {renderField('Risk Amount', trade.risk_amount, '$')}
          </>
        ))}

        {/* Strategy & Psychology */}
        {renderSection('Strategy & Psychology', <Brain size={16} />, (
          <>
            {renderField('Strategy Used', trade.strategy_used)}
            {renderField('Confidence Level', trade.confidence_level, '', '/10')}
            {renderField('Emotion Before', trade.emotion_before)}
            {renderField('Emotion After', trade.emotion_after)}
            {renderField('Mistake Category', trade.mistake_category)}
            <div className="md:col-span-2">
              {renderField('Lessons Learned', trade.lessons_learned)}
            </div>
          </>
        ))}

        {/* Notes */}
        {renderSection('Journal Notes', <BookOpen size={16} />, (
          <div className="md:col-span-2">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/20 p-3 rounded-lg border border-border">
              {trade.notes || 'No notes for this trade.'}
            </p>
          </div>
        ))}

        {/* Screenshots */}
        {((trade.entry_images?.length ?? 0) > 0 || (trade.exit_images?.length ?? 0) > 0 || (trade.chart_images?.length ?? 0) > 0) && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <div className="text-primary"><Camera size={16} /></div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Trade Screenshots</h3>
            </div>
            
            <div className="space-y-6">
              {trade.entry_images && trade.entry_images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Entry Context</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {trade.entry_images.map((url, i) => (
                      <div key={`entry-img-${i}`} className="aspect-video relative rounded-lg overflow-hidden border border-border bg-muted">
                        <AppImage src={url} alt={`Entry screenshot ${i+1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {trade.exit_images && trade.exit_images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Exit Context</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {trade.exit_images.map((url, i) => (
                      <div key={`exit-img-${i}`} className="aspect-video relative rounded-lg overflow-hidden border border-border bg-muted">
                        <AppImage src={url} alt={`Exit screenshot ${i+1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {trade.chart_images && trade.chart_images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Analysis Charts</p>
                  <div className="grid grid-cols-1 gap-3">
                    {trade.chart_images.map((url, i) => (
                      <div key={`chart-img-${i}`} className="aspect-video relative rounded-lg overflow-hidden border border-border bg-muted">
                        <AppImage src={url} alt={`Chart screenshot ${i+1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Meta */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <TagIcon size={14} className="text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {(trade.tags || []).map(tag => (
                <span key={tag} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                  #{tag}
                </span>
              ))}
              {(trade.tags || []).length === 0 && <span className="text-[10px] text-muted-foreground italic">No tags</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star size={14} className="text-amber-400" />
            <span className="text-xs font-bold text-foreground">Rating: {trade.trade_rating}/5</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
