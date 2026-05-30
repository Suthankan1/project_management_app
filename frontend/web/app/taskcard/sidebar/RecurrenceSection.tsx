'use client';

import React, { useState } from 'react';
import { RefreshCw, X, Calendar, Hash } from 'lucide-react';
import SidebarField from './SidebarField';

interface RecurrenceSectionProps {
  recurrenceRule?: string | null;
  recurrenceEnd?: string | null;
  customInterval?: number | null;
  recurrenceLimit?: number | null;
  onUpdate: (
    rule: string | null,
    end: string | null,
    customInterval: number | null,
    recurrenceLimit: number | null
  ) => void;
}

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'CUSTOM', label: 'Custom Interval...' },
];

const CUSTOM_UNIT_OPTIONS = [
  { value: 'CUSTOM_DAYS', label: 'Days' },
  { value: 'CUSTOM_WEEKS', label: 'Weeks' },
  { value: 'CUSTOM_MONTHS', label: 'Months' },
  { value: 'CUSTOM_YEARS', label: 'Years' },
];

export default function RecurrenceSection({
  recurrenceRule,
  recurrenceEnd,
  customInterval,
  recurrenceLimit,
  onUpdate,
}: RecurrenceSectionProps) {
  // Determine starting local states based on props
  const isCustomRule = recurrenceRule?.startsWith('CUSTOM_') ?? false;
  const initialFrequency = recurrenceRule
    ? (isCustomRule ? 'CUSTOM' : recurrenceRule)
    : '';

  const [frequency, setFrequency] = useState<string>(initialFrequency);
  const [customUnit, setCustomUnit] = useState<string>(isCustomRule ? recurrenceRule! : 'CUSTOM_DAYS');
  const [intervalVal, setIntervalVal] = useState<number>(customInterval && customInterval > 0 ? customInterval : 1);

  // End Condition states
  // 'NEVER', 'DATE', 'LIMIT'
  const initialEndCondition = recurrenceEnd
    ? 'DATE'
    : (recurrenceLimit && recurrenceLimit > 0 ? 'LIMIT' : 'NEVER');
  const [endCondition, setEndCondition] = useState<string>(initialEndCondition);
  const [endDate, setEndDate] = useState<string>(recurrenceEnd ?? '');
  const [occurrencesLimit, setOccurrencesLimit] = useState<number>(recurrenceLimit ?? 10);

  // Track prev props to adjust state during render when props change (React 18 standard pattern)
  const [prevProps, setPrevProps] = useState({
    recurrenceRule,
    recurrenceEnd,
    customInterval,
    recurrenceLimit
  });

  if (
    recurrenceRule !== prevProps.recurrenceRule ||
    recurrenceEnd !== prevProps.recurrenceEnd ||
    customInterval !== prevProps.customInterval ||
    recurrenceLimit !== prevProps.recurrenceLimit
  ) {
    setPrevProps({
      recurrenceRule,
      recurrenceEnd,
      customInterval,
      recurrenceLimit
    });

    const isCustom = recurrenceRule?.startsWith('CUSTOM_') ?? false;
    setFrequency(recurrenceRule ? (isCustom ? 'CUSTOM' : recurrenceRule) : '');
    if (isCustom) {
      setCustomUnit(recurrenceRule!);
    }
    setIntervalVal(customInterval && customInterval > 0 ? customInterval : 1);
    setEndDate(recurrenceEnd ?? '');
    setOccurrencesLimit(recurrenceLimit ?? 10);
    setEndCondition(recurrenceEnd ? 'DATE' : (recurrenceLimit && recurrenceLimit > 0 ? 'LIMIT' : 'NEVER'));
  }

  const handleApplyChanges = (
    newFreq: string,
    newUnit: string,
    newInterval: number,
    newEndCond: string,
    newEndDate: string,
    newLimit: number
  ) => {
    if (!newFreq) {
      onUpdate(null, null, null, null);
      return;
    }

    const rule = newFreq === 'CUSTOM' ? newUnit : newFreq;
    const finalInterval = newFreq === 'CUSTOM' ? newInterval : null;
    const finalEnd = newEndCond === 'DATE' && newEndDate ? newEndDate : null;
    const finalLimit = newEndCond === 'LIMIT' && newLimit > 0 ? newLimit : null;

    onUpdate(rule, finalEnd, finalInterval, finalLimit);
  };

  const handleFrequencyChange = (val: string) => {
    setFrequency(val);
    handleApplyChanges(
      val,
      customUnit,
      intervalVal,
      endCondition,
      endDate,
      occurrencesLimit
    );
  };

  const handleCustomUnitChange = (val: string) => {
    setCustomUnit(val);
    handleApplyChanges(
      frequency,
      val,
      intervalVal,
      endCondition,
      endDate,
      occurrencesLimit
    );
  };

  const handleIntervalChange = (val: number) => {
    const safeVal = val > 0 ? val : 1;
    setIntervalVal(safeVal);
    handleApplyChanges(
      frequency,
      customUnit,
      safeVal,
      endCondition,
      endDate,
      occurrencesLimit
    );
  };

  const handleEndConditionChange = (val: string) => {
    setEndCondition(val);
    handleApplyChanges(
      frequency,
      customUnit,
      intervalVal,
      val,
      endDate,
      occurrencesLimit
    );
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    handleApplyChanges(
      frequency,
      customUnit,
      intervalVal,
      endCondition,
      val,
      occurrencesLimit
    );
  };

  const handleLimitChange = (val: number) => {
    const safeVal = val > 0 ? val : 1;
    setOccurrencesLimit(safeVal);
    handleApplyChanges(
      frequency,
      customUnit,
      intervalVal,
      endCondition,
      endDate,
      safeVal
    );
  };

  const handleClear = () => {
    setFrequency('');
    setEndCondition('NEVER');
    setEndDate('');
    setOccurrencesLimit(10);
    onUpdate(null, null, null, null);
  };

  const getSummaryText = () => {
    if (!frequency) return 'No recurrence';
    let scheduleStr = '';
    if (frequency === 'CUSTOM') {
      const unitLabel = CUSTOM_UNIT_OPTIONS.find(u => u.value === customUnit)?.label.toLowerCase() ?? 'days';
      scheduleStr = `Every ${intervalVal} ${intervalVal === 1 ? unitLabel.slice(0, -1) : unitLabel}`;
    } else {
      scheduleStr = FREQUENCY_OPTIONS.find(f => f.value === frequency)?.label ?? frequency;
    }

    let endStr = '';
    if (endCondition === 'DATE' && endDate) {
      endStr = ` until ${new Date(endDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (endCondition === 'LIMIT' && occurrencesLimit) {
      endStr = `, up to ${occurrencesLimit} occurrences`;
    }

    return `Repeats ${scheduleStr.toLowerCase()}${endStr}`;
  };

  return (
    <SidebarField label="Recurrence">
      <div className="space-y-3 bg-cu-bg p-3.5 border border-cu-border rounded-xl shadow-cu-sm hover:border-cu-primary/30 transition-all duration-200">
        {/* Frequency Select */}
        <div className="flex items-center gap-2">
          <select
            value={frequency}
            onChange={(e) => handleFrequencyChange(e.target.value)}
            className="flex-1 text-xs font-semibold border border-cu-border rounded-lg px-2.5 py-1.5 h-9 bg-cu-bg text-cu-text-primary focus:border-cu-primary focus:ring-1 focus:ring-cu-primary/30 transition-colors"
          >
            <option value="">No recurrence</option>
            {FREQUENCY_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          {frequency && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg hover:bg-cu-danger/10 text-cu-text-muted hover:text-cu-danger transition-all duration-150 active:scale-95"
              title="Clear recurrence"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Custom Interval Options */}
        {frequency === 'CUSTOM' && (
          <div className="space-y-2 p-2.5 rounded-lg bg-cu-bg-secondary/40 border border-cu-border/50 animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="text-[10px] font-bold text-cu-text-secondary uppercase tracking-wider">Custom Frequency</span>
            <div className="flex items-center gap-2">
              <div className="w-20 shrink-0">
                <input
                  type="number"
                  min="1"
                  value={intervalVal}
                  onChange={(e) => handleIntervalChange(Number(e.target.value))}
                  className="w-full text-xs font-semibold text-center border border-cu-border rounded-lg px-2 py-1.5 h-9 bg-cu-bg text-cu-text-primary focus:border-cu-primary focus:ring-1 focus:ring-cu-primary/30"
                />
              </div>
              <select
                value={customUnit}
                onChange={(e) => handleCustomUnitChange(e.target.value)}
                className="flex-1 text-xs font-semibold border border-cu-border rounded-lg px-2 py-1.5 h-9 bg-cu-bg text-cu-text-primary focus:border-cu-primary focus:ring-1 focus:ring-cu-primary/30"
              >
                {CUSTOM_UNIT_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {intervalVal === 1 ? u.label.slice(0, -1) : u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* End Condition */}
        {frequency && (
          <div className="space-y-2 p-2.5 rounded-lg bg-cu-bg-secondary/40 border border-cu-border/50 animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="text-[10px] font-bold text-cu-text-secondary uppercase tracking-wider">End Condition</span>
            <select
              value={endCondition}
              onChange={(e) => handleEndConditionChange(e.target.value)}
              className="w-full text-xs font-semibold border border-cu-border rounded-lg px-2 py-1.5 h-9 bg-cu-bg text-cu-text-primary focus:border-cu-primary focus:ring-1 focus:ring-cu-primary/30"
            >
              <option value="NEVER">Never ends</option>
              <option value="DATE">On specific date</option>
              <option value="LIMIT">After N occurrences</option>
            </select>

            {endCondition === 'DATE' && (
              <div className="relative mt-1">
                <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cu-text-muted" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full text-xs font-semibold pl-8 pr-2.5 py-1.5 h-9 border border-cu-border rounded-lg bg-cu-bg text-cu-text-primary focus:border-cu-primary focus:ring-1 focus:ring-cu-primary/30"
                />
              </div>
            )}

            {endCondition === 'LIMIT' && (
              <div className="relative mt-1">
                <Hash size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cu-text-muted" />
                <input
                  type="number"
                  min="1"
                  value={occurrencesLimit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="w-full text-xs font-semibold pl-8 pr-2.5 py-1.5 h-9 border border-cu-border rounded-lg bg-cu-bg text-cu-text-primary focus:border-cu-primary focus:ring-1 focus:ring-cu-primary/30"
                  placeholder="e.g. 10 occurrences"
                />
              </div>
            )}
          </div>
        )}

        {/* Summary text */}
        {frequency && (
          <div className="flex items-start gap-2 text-xs font-semibold text-cu-primary/95 mt-1.5 animate-in fade-in duration-200">
            <RefreshCw size={13} className="mt-0.5 shrink-0 animate-spin-slow" />
            <span className="leading-snug">{getSummaryText()}</span>
          </div>
        )}
      </div>
    </SidebarField>
  );
}
