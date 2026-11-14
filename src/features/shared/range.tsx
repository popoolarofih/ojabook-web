'use client';

import { useState } from 'react';
import { Field, Input } from '@/components/ui/form';
import { cn } from '@/lib/utils';

export type Preset = 'today' | 'yesterday' | 'last7' | 'last30' | 'custom';
export interface RangeValue { preset: Preset; from?: string; to?: string }

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 days' },
  { id: 'last30', label: 'Last 30 days' },
  { id: 'custom', label: 'Custom' },
];

export function useRange(initial: Preset = 'today') {
  return useState<RangeValue>({ preset: initial });
}

/** The query string for the reports endpoints. Day boundaries are applied by the server in the business timezone. */
export const rangeQuery = (r: RangeValue) => (r.preset === 'custom' && r.from && r.to ? { preset: 'custom' as const, from: r.from, to: r.to } : { preset: r.preset });

export function RangePicker({ value, onChange }: { value: RangeValue; onChange: (v: RangeValue) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Date range" className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={value.preset === p.id}
            onClick={() => onChange({ preset: p.id, from: value.from, to: value.to })}
            className={cn('button-sm min-h-10 rounded-full border px-3 py-2 transition-oja', value.preset === p.id ? 'border-royal bg-royal text-white' : 'border-line bg-white text-ink hover:bg-soft')}
          >
            {p.label}
          </button>
        ))}
      </div>
      {value.preset === 'custom' ? (
        <div className="grid max-w-md grid-cols-2 gap-3">
          <Field label="From">{(p) => <Input {...p} type="date" value={value.from ?? ''} onChange={(e) => onChange({ ...value, from: e.target.value })} />}</Field>
          <Field label="To">{(p) => <Input {...p} type="date" value={value.to ?? ''} onChange={(e) => onChange({ ...value, to: e.target.value })} />}</Field>
        </div>
      ) : null}
    </div>
  );
}

export const rangeReady = (r: RangeValue) => r.preset !== 'custom' || Boolean(r.from && r.to && r.from <= r.to);
