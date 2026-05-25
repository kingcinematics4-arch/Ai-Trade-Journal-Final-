'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { TradeFormData } from './AddTradeForm';
import { Upload, X, Camera, TrendingUp, TrendingDown } from 'lucide-react';

interface MediaMetaSectionProps {
  form: UseFormReturn<TradeFormData>;
  entryImages: File[];
  setEntryImages: React.Dispatch<React.SetStateAction<File[]>>;
  exitImages: File[];
  setExitImages: React.Dispatch<React.SetStateAction<File[]>>;
  chartImages: File[];
  setChartImages: React.Dispatch<React.SetStateAction<File[]>>;
}

interface ImageUploadZoneProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  zoneId: string;
}

function FilePreview({ file }: { file: File }) {
  const [preview, setPreview] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted">
      {preview && <img src={preview} alt="Preview" className="w-full h-full object-cover" />}
    </div>
  );
}

function ImageUploadZone({
  label,
  description,
  icon,
  files,
  onAdd,
  onRemove,
  zoneId,
}: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    onAdd(newFiles);
  };

  return (
    <div>
      <label className="form-label">{label}</label>
      <p className="form-helper mb-2">{description}</p>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-150 ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-zinc-600 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        }`}
      >
        <input
          ref={inputRef}
          id={zoneId}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">
              Drop images here or click to upload
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 10MB each</p>
          </div>
        </div>
      </div>

      {/* Previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {files.map((file, i) => (
            <div key={`${zoneId}-preview-${i}`} className="relative group">
              <FilePreview file={file} />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label={`Remove image ${i + 1}`}
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StarRating({
  value,
  onChange,
  label,
  description,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  description: string;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div>
      <label className="form-label">{label}</label>
      <p className="form-helper mb-2">{description}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={`star-btn-${star}`}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="text-2xl transition-all duration-100 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <span
              className={`${
                star <= (hovered || value)
                  ? 'text-amber-400 star-rating-glow'
                  : 'text-muted-foreground'
              } transition-colors duration-100`}
            >
              ★
            </span>
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground font-medium">
          {['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][hovered || value] || ''}
        </span>
      </div>
    </div>
  );
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !tags.includes(tag) && tags.length < 10) {
      onChange([...tags, tag]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const suggestions = [
    'breakout',
    'trend',
    'reversal',
    'news-trade',
    'high-rr',
    'fomo',
    'revenge',
    'planned',
    'impulsive',
    'morning-session',
    'london',
    'ny-session',
  ];

  return (
    <div>
      <label className="form-label">Tags</label>
      <p className="form-helper mb-2">Add up to 10 tags for filtering and pattern recognition</p>

      {/* Tag chips */}
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {tags.map((tag) => (
          <span
            key={`tag-chip-${tag}`}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded-full"
              aria-label={`Remove tag ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(input);
            }
            if (e.key === ',' || e.key === ' ') {
              e.preventDefault();
              addTag(input);
            }
          }}
          className="form-input flex-1 text-sm focus-visible:ring-2 focus-visible:ring-primary"
          placeholder="Type tag and press Enter or comma"
          maxLength={30}
        />
        <button
          type="button"
          onClick={() => addTag(input)}
          disabled={!input.trim()}
          className="btn-secondary text-sm px-3 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary"
        >
          Add
        </button>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className="text-xs text-muted-foreground">Suggestions:</span>
        {suggestions
          .filter((s) => !tags.includes(s))
          .slice(0, 6)
          .map((s) => (
            <button
              key={`tag-sug-${s}`}
              type="button"
              onClick={() => onChange([...tags, s])}
              className="text-xs text-muted-foreground hover:text-foreground border border-border hover:border-zinc-600 px-2 py-0.5 rounded-full transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              + {s}
            </button>
          ))}
      </div>
    </div>
  );
}

export default function MediaMetaSection({
  form,
  entryImages,
  setEntryImages,
  exitImages,
  setExitImages,
  chartImages,
  setChartImages,
}: MediaMetaSectionProps) {
  const { watch, setValue, control } = form;
  const tags = watch('tags');
  const confidenceLevel = watch('confidenceLevel');
  const tradeRating = watch('tradeRating');

  return (
    <div className="space-y-6">
      {/* Screenshots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ImageUploadZone
          zoneId="upload-entry"
          label="Entry Screenshot"
          description="Chart at trade entry point"
          icon={<TrendingUp size={16} />}
          files={entryImages}
          onAdd={(files) => setEntryImages((prev) => [...prev, ...files])}
          onRemove={(i) => setEntryImages((prev) => prev.filter((_, idx) => idx !== i))}
        />
        <ImageUploadZone
          zoneId="upload-exit"
          label="Exit Screenshot"
          description="Chart at trade exit point"
          icon={<TrendingDown size={16} />}
          files={exitImages}
          onAdd={(files) => setExitImages((prev) => [...prev, ...files])}
          onRemove={(i) => setExitImages((prev) => prev.filter((_, idx) => idx !== i))}
        />
        <ImageUploadZone
          zoneId="upload-chart"
          label="Full Chart Image"
          description="Broader context / analysis chart"
          icon={<Camera size={16} />}
          files={chartImages}
          onAdd={(files) => setChartImages((prev) => [...prev, ...files])}
          onRemove={(i) => setChartImages((prev) => prev.filter((_, idx) => idx !== i))}
        />
      </div>

      {/* Tags */}
      <Controller
        name="tags"
        control={control}
        render={({ field }) => <TagInput tags={field.value} onChange={field.onChange} />}
      />

      {/* Confidence Level + Trade Rating */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Confidence Slider */}
        <div>
          <label className="form-label" htmlFor="confidence-level">
            Confidence Level
          </label>
          <p className="form-helper mb-3">
            How confident were you before entering? (1 = very uncertain, 10 = very confident)
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>1 — Uncertain</span>
              <span className="text-foreground font-semibold font-tabular text-base">
                {confidenceLevel}/10
              </span>
              <span>10 — Certain</span>
            </div>
            <input
              id="confidence-level"
              type="range"
              min={1}
              max={10}
              step={1}
              className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer accent-primary focus-visible:ring-2 focus-visible:ring-primary outline-none"
              {...form.register('confidenceLevel', { valueAsNumber: true })}
            />
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <div
                  key={`conf-tick-${n}`}
                  className={`w-1.5 h-1.5 rounded-full ${
                    n <= confidenceLevel ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Trade Rating */}
        <StarRating
          value={tradeRating}
          onChange={(v) => setValue('tradeRating', v)}
          label="Trade Quality Rating"
          description="Rate the overall quality of your trade execution"
        />
      </div>
    </div>
  );
}
