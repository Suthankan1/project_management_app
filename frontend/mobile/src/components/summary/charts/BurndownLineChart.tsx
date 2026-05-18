/**
 * BurndownLineChart — Light theme, SVG line chart for sprint burndown.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import type { Task, Sprint } from '../../../hooks/useProjectSummary';

const { width: SW } = Dimensions.get('window');
const W = SW - 72, H = 140;
const P = { t: 10, b: 26, l: 28, r: 6 };

function bezier(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cp} ${pts[i-1].y}, ${cp} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

export function BurndownLineChart({ tasks, sprints }: { tasks: Task[]; sprints: Sprint[] }) {
  const { data, hasData } = useMemo(() => {
    const active = sprints.find(s => s.status === 'ACTIVE');
    if (!active?.startDate || !active?.endDate) return { data: [], hasData: false };
    const start = new Date(active.startDate), end = new Date(active.endDate);
    const st = tasks.filter(t => t.sprintId === active.id);
    const total = st.reduce((a, t) => a + (t.storyPoint || 0), 0);
    if (total === 0) return { data: [], hasData: false };
    const days = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
    const drop = total / (days - 1 || 1);
    
    // Fix: Deduct any tasks that were somehow completed *before* the sprint started
    const doneBeforeStart = st
      .filter(t => t.status === 'DONE' && (t.completedAt || t.updatedAt))
      .filter(t => new Date(t.completedAt || t.updatedAt!).getTime() < start.setHours(0,0,0,0))
      .reduce((a, t) => a + (t.storyPoint || 0), 0);
      
    let rem = total - doneBeforeStart;
    const pts = [];
    
    for (let i = 0; i < days; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const lbl = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const ideal = Math.max(0, Math.round(total - drop * i));
      
      const doneToday = st
        .filter(t => t.status === 'DONE' && (t.completedAt || t.updatedAt))
        .filter(t => new Date(t.completedAt || t.updatedAt!).toDateString() === d.toDateString())
        .reduce((a, t) => a + (t.storyPoint || 0), 0);
        
      if (d <= new Date()) { 
        rem -= doneToday; 
        pts.push({ lbl, ideal, rem: Math.max(0, rem) }); 
      } else {
        pts.push({ lbl, ideal, rem: null });
      }
    }
    return { data: pts, hasData: true };
  }, [tasks, sprints]);

  if (!hasData) return (
    <View style={st.empty}>
      <Text style={st.emptyIcon}>🏃</Text>
      <Text style={st.emptyText}>No active sprint</Text>
    </View>
  );

  const all = data.flatMap(d => [d.ideal, d.rem ?? 0]);
  const max = Math.max(...all, 1);
  const pw = W - P.l - P.r, ph = H - P.t - P.b;
  const tx = (i: number) => P.l + (i / (data.length - 1)) * pw;
  const ty = (v: number) => P.t + ph - (v / max) * ph;

  const idealPts = data.map((d, i) => ({ x: tx(i), y: ty(d.ideal) }));
  const actPts = data.filter(d => d.rem !== null).map((d, i) => ({ x: tx(data.indexOf(d)), y: ty(d.rem!) }));
  const idealPath = bezier(idealPts);
  const actPath = bezier(actPts);
  const areaPath = actPts.length > 1 ? `${actPath} L ${actPts[actPts.length-1].x} ${P.t + ph} L ${actPts[0].x} ${P.t + ph} Z` : '';

  const ticks = Array.from(new Set([0, Math.round(max / 2), max]));
  const step = Math.max(1, Math.floor((data.length - 1) / 3));
  const xlbls = data.filter((_, i) => i === 0 || i === data.length - 1 || i % step === 0);

  return (
    <View style={{ width: '100%' }}>
      <View style={{ width: W, height: H }}>
        <Svg width={W} height={H}>
          <Defs>
            <SvgGrad id="bg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#155DFC" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#155DFC" stopOpacity="0.01" />
            </SvgGrad>
          </Defs>
          {ticks.map(v => <Path key={`grid-${v}`} d={`M ${P.l} ${ty(v)} L ${P.l + pw} ${ty(v)}`} stroke="#F1F5F9" strokeWidth={1} />)}
          {areaPath ? <Path d={areaPath} fill="url(#bg)" /> : null}
          <Path d={idealPath} fill="none" stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="5 4" />
          <Path d={actPath} fill="none" stroke="#155DFC" strokeWidth={2.5} strokeLinecap="round" />
          {actPts.length > 0 && <Circle cx={actPts[actPts.length-1].x} cy={actPts[actPts.length-1].y} r={4.5} fill="#155DFC" stroke="#fff" strokeWidth={2} />}
        </Svg>

        {/* Axis labels — positioned absolutely */}
        <View style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}>
          {ticks.map(v => (
            <Text key={`tick-${v}`} style={[st.axisY, { top: ty(v) - 7, left: 0, width: P.l - 3 }]}>{v}</Text>
          ))}
          {xlbls.map((d, i) => {
            const xi = data.indexOf(d);
            return <Text key={`xl-${i}`} style={[st.axisX, { top: H - P.b + 5, left: tx(xi) - 16, width: 32 }]}>{d.lbl}</Text>;
          })}
        </View>
      </View>

      <View style={st.legend}>
        <View style={st.legendItem}><View style={[st.legendLine, { backgroundColor: '#CBD5E1' }]} /><Text style={st.legendLbl}>Ideal</Text></View>
        <View style={st.legendItem}><View style={[st.legendLine, { backgroundColor: '#155DFC' }]} /><Text style={st.legendLbl}>Actual</Text></View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  axisY: { position: 'absolute', fontSize: 9, fontWeight: '600', color: '#94A3B8', textAlign: 'right' },
  axisX: { position: 'absolute', fontSize: 9, fontWeight: '500', color: '#94A3B8', textAlign: 'center' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 18, height: 2, borderRadius: 1 },
  legendLbl: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyIcon: { fontSize: 28 },
  emptyText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
});
