'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { TrendingDown, BarChart2 } from 'lucide-react';
import { sprintsApi } from '@/services/api-contract';
import { toast } from '@/components/ui';
import BurndownChart, { type BurndownPoint } from './components/BurndownChart';
import SprintSelector, { type BurndownSprint } from './components/SprintSelector';
import BurndownStatsGrid from './components/BurndownStatsGrid';
import DateSetterPrompt from './components/DateSetterPrompt';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BurndownResponse {
  sprintId: number;
  sprintName: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
  dataPoints: BurndownPoint[];
}

// ─── Component ────────────────────────────────────────────────────────────────

function BurndownContent() {
  const searchParams = useSearchParams();
  const projectId    = searchParams.get('projectId');

  // Sprints
  const [sprints, setSprints]           = useState<BurndownSprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [sprintDropOpen, setSprintDropOpen]     = useState(false);

  // Date filter
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo,   setFilterTo]   = useState('');

  // Burndown data
  const [burndown, setBurndown]           = useState<BurndownResponse | null>(null);
  const [loadingSprints, setLoadingSprints] = useState(true);
  const [loadingChart,  setLoadingChart]   = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSprintDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── 1. Fetch sprints on mount ──────────────────────────────────────────────

  useEffect(() => {
    if (!projectId) {
      setError('No project selected.');
      setLoadingSprints(false);
      return;
    }
    const fetchSprints = async () => {
      try {
        const list = await sprintsApi.listByProject(projectId);
        setSprints(list);
        if (list.length > 0) {
          // default to the first ACTIVE sprint, or the first one
          const active = list.find((s) => s.status === 'ACTIVE') ?? list[0];
          setSelectedSprintId(active.id);
          setFilterFrom(active.startDate || '');
          setFilterTo(active.endDate || '');
        }
      } catch {
        setError('Failed to load sprints.');
      } finally {
        setLoadingSprints(false);
      }
    };
    void fetchSprints();
  }, [projectId]);

  // ── 2. Fetch burndown data whenever sprint or filter changes ───────────────

  const fetchBurndown = useCallback(async () => {
    if (!selectedSprintId) return;
    const currentSprint = sprints.find((s) => s.id === selectedSprintId);
    if (!currentSprint?.startDate || !currentSprint?.endDate) {
      setBurndown(null);
      return;
    }
    setLoadingChart(true);
    setBurndown(null);
    try {
      const params = new URLSearchParams();
      if (filterFrom) params.set('from', filterFrom);
      if (filterTo)   params.set('to',   filterTo);
      const data = await sprintsApi.getBurndown(selectedSprintId, params);
      setBurndown(data);
      setError(null);
    } catch {
      setError('Failed to load burndown data.');
    } finally {
      setLoadingChart(false);
    }
  }, [selectedSprintId, filterFrom, filterTo, sprints]);

  useEffect(() => {
    void fetchBurndown();
  }, [fetchBurndown]);

  // ── Sprint selection ───────────────────────────────────────────────────────

  const handleSprintSelect = (sprint: BurndownSprint) => {
    setSelectedSprintId(sprint.id);
    setFilterFrom(sprint.startDate || '');
    setFilterTo(sprint.endDate || '');
    setSprintDropOpen(false);
  };

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId);

  const handleDateSaving = async (field: 'start' | 'end', val: string) => {
    if (!selectedSprint) return;
    const normalized = val ? String(val).slice(0, 10) : null;
    try {
      await sprintsApi.update(selectedSprint.id, {
        name: selectedSprint.name,
        startDate: field === 'start' ? normalized : (selectedSprint.startDate || null),
        endDate: field === 'end' ? normalized : (selectedSprint.endDate || null)
      });
      // updating local sprints cache
      setSprints((prev) => prev.map((s) => {
        if (s.id === selectedSprint.id) {
          return {
            ...s,
            startDate: field === 'start' ? normalized : s.startDate,
            endDate: field === 'end' ? normalized : s.endDate
          };
        }
        return s;
      }));
      // set filter matching the new dates
      if (field === 'start') setFilterFrom(normalized || '');
      if (field === 'end') setFilterTo(normalized || '');
    } catch {
      toast('Failed to save sprint date', 'error');
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────

  const donePoints = burndown
    ? burndown.totalStoryPoints -
      (burndown.dataPoints[burndown.dataPoints.length - 1]?.remainingPoints ?? 0)
    : 0;
  const progressPct = burndown && burndown.totalStoryPoints > 0
    ? Math.round((donePoints / burndown.totalStoryPoints) * 100)
    : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-cu-bg-secondary p-4 pb-6 font-[var(--font-inter)] sm:p-5">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cu-primary shadow-cu-sm">
          <TrendingDown size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-[20px] font-bold leading-tight text-cu-text-primary">Burndown Chart</h1>
          <p className="text-[13px] text-cu-text-secondary">Track story point progress across sprint days</p>
        </div>
      </div>

      {/* Loading sprints */}
      {loadingSprints && (
        <div className="flex h-48 items-center justify-center text-sm text-cu-text-secondary">
          Loading sprints...
        </div>
      )}

      {/* Error */}
      {!loadingSprints && error && !burndown && (
        <div className="flex h-48 items-center justify-center rounded-xl border border-red-500/25 bg-cu-bg text-sm font-medium text-red-500 shadow-cu-sm">
          {error}
        </div>
      )}

      {/* No sprints */}
      {!loadingSprints && !error && sprints.length === 0 && (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-cu-border bg-cu-bg text-cu-text-secondary shadow-cu-sm">
          <BarChart2 size={32} className="text-cu-text-muted" />
          <p className="text-sm">No sprints found for this project.</p>
        </div>
      )}

      {/* Main content */}
      {!loadingSprints && sprints.length > 0 && (
        <div className="flex flex-col gap-5">
          {/* Controls row */}
          <SprintSelector
            sprints={sprints}
            selectedSprint={selectedSprint}
            selectedSprintId={selectedSprintId}
            sprintDropOpen={sprintDropOpen}
            filterFrom={filterFrom}
            filterTo={filterTo}
            dropdownRef={dropdownRef}
            onToggleDropdown={() => setSprintDropOpen((p) => !p)}
            onSelectSprint={handleSprintSelect}
            onFilterFromChange={setFilterFrom}
            onFilterToChange={setFilterTo}
          />

          {/* Stats cards */}
          {burndown && (
            <>
              <BurndownStatsGrid
                totalStoryPoints={burndown.totalStoryPoints}
                donePoints={donePoints}
                remainingPoints={burndown.dataPoints[burndown.dataPoints.length - 1]?.remainingPoints ?? 0}
                progressPct={progressPct}
              />
              {filterTo && selectedSprint?.endDate && filterTo !== selectedSprint.endDate && (
                <p className="-mt-2 text-[12px] text-cu-text-muted">
                  Stats shown as of{' '}
                  <strong className="text-cu-text-secondary">
                    {new Date(filterTo + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </strong>
                  {' '} &middot; adjust the date range to see the full sprint
                </p>
              )}
            </>
          )}

          {/* Chart card */}
          <div className="rounded-xl border border-cu-border bg-cu-bg p-5 shadow-cu-sm">
            {loadingChart ? (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-cu-primary border-t-transparent" />
                  <p className="text-[13px] text-cu-text-secondary">Loading chart...</p>
                </div>
              </div>
            ) : burndown ? (
              <BurndownChart
                sprintName={burndown.sprintName}
                dataPoints={burndown.dataPoints}
                totalStoryPoints={burndown.totalStoryPoints}
              />
            ) : selectedSprint && (!selectedSprint.startDate || !selectedSprint.endDate) ? (
              <DateSetterPrompt
                startDate={selectedSprint.startDate}
                endDate={selectedSprint.endDate}
                onSaveDate={handleDateSaving}
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-cu-text-muted">
                Select a sprint to view the burndown chart.
              </div>
            )}
          </div>

          {/* Sprint date range note */}
          {selectedSprint && selectedSprint.startDate && selectedSprint.endDate && (
            <p className="text-center text-[12px] text-cu-text-muted transition-all duration-300">
              Sprint <strong className="text-cu-text-secondary">{selectedSprint.name}</strong> &middot;{' '}
              {new Date(selectedSprint.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' - '}
              {new Date(selectedSprint.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Next.js 14+ requires useSearchParams to be inside a Suspense boundary
export default function BurndownPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-sm text-cu-text-secondary">
          Loading...
        </div>
      }
    >
      <BurndownContent />
    </Suspense>
  );
}
