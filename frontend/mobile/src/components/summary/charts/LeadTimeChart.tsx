/**
 * LeadTimeChart — Light theme, area line chart for avg task completion time.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import type { Task } from '../../../hooks/useProjectSummary';

const { width: SW } = Dimensions.get('window');
const W = SW - 72, H = 130;
const P = { t: 10, b: 26, l: 32, r: 6 };

function bezier(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i-1].x + pts[i].x) / 2;
    d += ` C ${cp} ${pts[i-1].y}, ${cp} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

export function LeadTimeChart({ tasks }: { tasks: Task[] }) {
  const { pts, avg, best, count } = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const done = tasks.filter(t => t.status === 'DONE' && t.completedAt && new Date(t.completedAt) >= cutoff);
    const map: Record<string, { total: number; n: number }> = {};
    done.forEach(t => {
      if (!t.completedAt || !t.createdAt) return;
      const date = new Date(t.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const days = (new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()) / 86400000;
      if (!map[date]) map[date] = { total: 0, n: 0 };
      map[date].total += days; map[date].n++;
    });
    const entries = Object.entries(map)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, d]) => ({ date, v: Math.round((d.total / d.n) * 10) / 10 }));
    const avg = entries.length > 0 ? Math.round((entries.reduce((a, e) => a + e.v, 0) / entries.length) * 10) / 10 : 0;
    const best = entries.length > 0 ? Math.min(...entries.map(e => e.v)) : 0;
    return { pts: entries, avg, best, count: entries.length };
  }, [tasks]);

  if (pts.length < 2) return (
    <View style={st.empty}><Text style={st.emptyIcon}>⏱️</Text><Text style={st.emptyText}>Not enough data</Text></View>
  );

  const pw = W - P.l - P.r, ph = H - P.t - P.b;
  const max = Math.max(...pts.map(p => p.v), 1);
  const tx = (i: number) => P.l + (i / (pts.length - 1)) * pw;
  const ty = (v: number) => P.t + ph - (v / max) * ph;
  const coords = pts.map((p, i) => ({ x: tx(i), y: ty(p.v) }));
  const line = bezier(coords);
  const area = `${line} L ${coords[coords.length-1].x} ${P.t + ph} L ${coords[0].x} ${P.t + ph} Z`;
  const avgY = ty(avg);

  const ticks = Array.from(new Set([0, Math.round(max / 2), max]));
  const step = Math.max(1, Math.floor((pts.length - 1) / 3));
  const xlbls = pts.filter((_, i) => i === 0 || i === pts.length - 1 || i % step === 0);

  return (
    <View style={{ width: '100%' }}>
      <View style={{ width: W, height: H }}>
        <Svg width={W} height={H}>
          <Defs>
            <SvgGrad id="lt" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0.01" />
            </SvgGrad>
          </Defs>
          {ticks.map(v => <Path key={`grid-${v}`} d={`M ${P.l} ${ty(v)} L ${P.l + pw} ${ty(v)}`} stroke="#F1F5F9" strokeWidth={1} />)}
          <Path d={`M ${P.l} ${avgY} L ${P.l + pw} ${avgY}`} stroke="#F59E0B" strokeWidth={1} strokeDasharray="5 3" strokeOpacity={0.5} />
          <Path d={area} fill="url(#lt)" />
          <Path d={line} fill="none" stroke="#F59E0B" strokeWidth={2.5} strokeLinecap="round" />
          {coords.map((c, i) => <Circle key={`dot-${i}`} cx={c.x} cy={c.y} r={3} fill="#F59E0B" stroke="#fff" strokeWidth={1.5} />)}
          <Circle cx={coords[coords.length-1].x} cy={coords[coords.length-1].y} r={5} fill="#F59E0B" stroke="#fff" strokeWidth={2} />
        </Svg>
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          {ticks.map(v => (
            <Text key={`tick-${v}`} style={[st.axisY, { top: ty(v) - 7, left: 0, width: P.l - 3 }]}>{v}d</Text>
          ))}
          {xlbls.map((p, i) => {
            const xi = pts.indexOf(p);
            return <Text key={`xl-${i}`} style={[st.axisX, { top: H - P.b + 5, left: tx(xi) - 16, width: 32 }]}>{p.date}</Text>;
          })}
        </View>
      </View>

      {/* Summary pills */}
      <View style={st.pills}>
        <View style={st.pill}>
          <Text style={[st.pillVal, { color: '#F59E0B' }]}>{avg}d</Text>
          <Text style={st.pillLbl}>Avg Lead</Text>
        </View>
        <View style={st.pill}>
          <Text style={[st.pillVal, { color: '#00875A' }]}>{best}d</Text>
          <Text style={st.pillLbl}>Best Day</Text>
        </View>
        <View style={st.pill}>
          <Text style={[st.pillVal, { color: '#155DFC' }]}>{count}</Text>
          <Text style={st.pillLbl}>Days Tracked</Text>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  axisY: { position: 'absolute', fontSize: 9, fontWeight: '600', color: '#94A3B8', textAlign: 'right' },
  axisX: { position: 'absolute', fontSize: 9, fontWeight: '500', color: '#94A3B8', textAlign: 'center' },
  pills: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10, paddingVertical: 8, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  pillVal: { fontSize: 15, fontWeight: '900' },
  pillLbl: { fontSize: 9, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyIcon: { fontSize: 28 },
  emptyText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
});
