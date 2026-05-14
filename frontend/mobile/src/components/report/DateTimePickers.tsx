/**
 * DateTimePickers.tsx
 * Custom calendar + clock picker modals — zero native deps.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../../constants/tokens';

// ── shared helpers ──────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ── Calendar Picker ─────────────────────────────────────────────────────────
interface CalProps {
  visible:  boolean;
  value:    string;          // 'YYYY-MM-DD'
  onSelect: (v: string) => void;
  onClose:  () => void;
  minDate?: string;
  title?:   string;
}

export function CalendarPicker({ visible, value, onSelect, onClose, minDate, title = 'Pick a Date' }: CalProps) {
  const today  = new Date();
  const initY  = value ? +value.slice(0,4) : today.getFullYear();
  const initM  = value ? +value.slice(5,7)-1 : today.getMonth();

  const [year, setYear]   = useState(initY);
  const [month, setMonth] = useState(initM);
  const [sel, setSel]     = useState(value);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInM  = new Date(year, month+1, 0).getDate();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1); };

  const fmt = (d: number) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const isDisabled = (d: number) => !!minDate && fmt(d) < minDate;
  const isToday    = (d: number) => fmt(d) === `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length:daysInM},(_,i)=>i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const confirm = () => { if (sel) { onSelect(sel); onClose(); } };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={pk.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={pk.card}>
        {/* Header */}
        <LinearGradient colors={[T.primary,'#4D8BFF']} start={{x:0,y:0}} end={{x:1,y:0}} style={pk.header}>
          <Text style={pk.headerTitle}>{title}</Text>
        </LinearGradient>

        {/* Month nav */}
        <View style={cal.nav}>
          <TouchableOpacity onPress={prevMonth} style={cal.navBtn}><Text style={cal.navArrow}>‹</Text></TouchableOpacity>
          <Text style={cal.navLabel}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={cal.navBtn}><Text style={cal.navArrow}>›</Text></TouchableOpacity>
        </View>

        {/* Day-of-week headers */}
        <View style={cal.row}>
          {DAYS.map(d => <Text key={d} style={cal.dayHdr}>{d}</Text>)}
        </View>

        {/* Grid */}
        {Array.from({length: cells.length/7}, (_,r) => (
          <View key={r} style={cal.row}>
            {cells.slice(r*7, r*7+7).map((d,c) => {
              if (!d) return <View key={c} style={cal.cell} />;
              const dateStr  = fmt(d);
              const isSel    = dateStr === sel;
              const disabled = isDisabled(d);
              const tod      = isToday(d);
              return (
                <TouchableOpacity key={c} style={[cal.cell, isSel && cal.cellSel, tod && !isSel && cal.cellToday]}
                  onPress={() => !disabled && setSel(dateStr)} disabled={disabled} activeOpacity={0.7}>
                  <Text style={[cal.cellTxt, isSel && cal.cellTxtSel, disabled && {color:'#CBD5E1'}, tod && !isSel && {color:T.primary}]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Footer */}
        <View style={pk.footer}>
          <TouchableOpacity onPress={onClose} style={pk.cancelBtn}><Text style={pk.cancelTxt}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={confirm} disabled={!sel} style={[pk.confirmBtn, !sel && {opacity:0.4}]}>
            <LinearGradient colors={[T.primary,'#4D8BFF']} start={{x:0,y:0}} end={{x:1,y:0}} style={pk.confirmGrad}>
              <Text style={pk.confirmTxt}>Confirm</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Time Picker ─────────────────────────────────────────────────────────────
interface TimeProps {
  visible:  boolean;
  value:    string;          // 'HH:MM'
  onSelect: (v: string) => void;
  onClose:  () => void;
  title?:   string;
}

export function TimePicker({ visible, value, onSelect, onClose, title = 'Pick a Time' }: TimeProps) {
  const [h, setH] = useState(value ? +value.split(':')[0] : 8);
  const [m, setM] = useState(value ? +value.split(':')[1] : 0);

  const hours   = Array.from({length:24},(_,i)=>i);
  const minutes = [0,5,10,15,20,25,30,35,40,45,50,55];

  const fmt2 = (n:number) => String(n).padStart(2,'0');
  const confirm = () => { onSelect(`${fmt2(h)}:${fmt2(m)}`); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={pk.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[pk.card, {paddingBottom:0}]}>
        <LinearGradient colors={[T.primary,'#4D8BFF']} start={{x:0,y:0}} end={{x:1,y:0}} style={pk.header}>
          <Text style={pk.headerTitle}>{title}</Text>
        </LinearGradient>

        {/* Preview */}
        <View style={clk.preview}>
          <Text style={clk.previewTxt}>{fmt2(h)} : {fmt2(m)}</Text>
        </View>

        <View style={clk.cols}>
          {/* Hours */}
          <View style={clk.col}>
            <Text style={clk.colLabel}>HOUR</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={clk.scroll}>
              {hours.map(hv => (
                <TouchableOpacity key={hv} onPress={()=>setH(hv)}
                  style={[clk.item, hv===h && clk.itemSel]}>
                  <Text style={[clk.itemTxt, hv===h && clk.itemTxtSel]}>{fmt2(hv)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={clk.colon}>:</Text>

          {/* Minutes */}
          <View style={clk.col}>
            <Text style={clk.colLabel}>MIN</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={clk.scroll}>
              {minutes.map(mv => (
                <TouchableOpacity key={mv} onPress={()=>setM(mv)}
                  style={[clk.item, mv===m && clk.itemSel]}>
                  <Text style={[clk.itemTxt, mv===m && clk.itemTxtSel]}>{fmt2(mv)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={pk.footer}>
          <TouchableOpacity onPress={onClose} style={pk.cancelBtn}><Text style={pk.cancelTxt}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={confirm} style={pk.confirmBtn}>
            <LinearGradient colors={[T.primary,'#4D8BFF']} start={{x:0,y:0}} end={{x:1,y:0}} style={pk.confirmGrad}>
              <Text style={pk.confirmTxt}>Confirm</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Shared styles ───────────────────────────────────────────────────────────
const pk = StyleSheet.create({
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.5)' },
  card:        { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, overflow:'hidden', paddingBottom:34, ...Platform.select({ios:{shadowColor:'#000',shadowOffset:{width:0,height:-4},shadowOpacity:0.12,shadowRadius:16},android:{elevation:20}}) },
  header:      { paddingHorizontal:20, paddingVertical:16, alignItems:'center' },
  headerTitle: { fontSize:15, fontWeight:'800', color:'#fff', letterSpacing:0.3 },
  footer:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:16, paddingBottom:4, borderTopWidth:1, borderTopColor:'#F3F4F6' },
  cancelBtn:   { paddingHorizontal:16, paddingVertical:10 },
  cancelTxt:   { fontSize:13, fontWeight:'600', color:T.textMuted },
  confirmBtn:  { borderRadius:14, overflow:'hidden' },
  confirmGrad: { paddingHorizontal:24, paddingVertical:11 },
  confirmTxt:  { fontSize:13, fontWeight:'800', color:'#fff' },
});

const cal = StyleSheet.create({
  nav:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12 },
  navBtn:    { width:36, height:36, borderRadius:10, backgroundColor:'#F3F4F6', alignItems:'center', justifyContent:'center' },
  navArrow:  { fontSize:22, color:T.primary, lineHeight:26 },
  navLabel:  { fontSize:14, fontWeight:'800', color:'#1F2937' },
  row:       { flexDirection:'row' },
  dayHdr:    { flex:1, textAlign:'center', fontSize:10, fontWeight:'800', color:T.textMuted, paddingVertical:6, letterSpacing:0.5 },
  cell:      { flex:1, aspectRatio:1, alignItems:'center', justifyContent:'center', margin:2, borderRadius:20 },
  cellSel:   { backgroundColor:T.primary },
  cellToday: { borderWidth:1.5, borderColor:T.primary },
  cellTxt:   { fontSize:13, fontWeight:'600', color:'#374151' },
  cellTxtSel:{ color:'#fff', fontWeight:'800' },
});

const clk = StyleSheet.create({
  preview:    { alignItems:'center', paddingVertical:14 },
  previewTxt: { fontSize:44, fontWeight:'900', color:T.primary, letterSpacing:4 },
  cols:       { flexDirection:'row', alignItems:'center', paddingHorizontal:32, gap:8, marginBottom:12 },
  col:        { flex:1 },
  colLabel:   { fontSize:9, fontWeight:'800', color:T.textMuted, letterSpacing:1, textAlign:'center', marginBottom:6 },
  scroll:     { height:180 },
  item:       { height:44, borderRadius:12, alignItems:'center', justifyContent:'center', marginVertical:2 },
  itemSel:    { backgroundColor:T.primaryLight },
  itemTxt:    { fontSize:18, fontWeight:'600', color:'#6B7280' },
  itemTxtSel: { fontSize:20, fontWeight:'900', color:T.primary },
  colon:      { fontSize:32, fontWeight:'900', color:T.primary, marginTop:20 },
});
