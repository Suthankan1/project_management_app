import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, TextInput, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { T } from '../../constants/tokens';
import {
  createScheduledReport,
  ReportFormat, ScheduleType, Frequency, EndType,
  ScheduledReportRequest,
} from '../../services/report-service';
import { CalendarPicker, TimePicker } from './DateTimePickers';

// ── Icons ─────────────────────────────────────────────────────────────────────
function IcClose({ c = '#fff' }: { c?: string }) {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round"><Path d="M18 6L6 18M6 6l12 12" /></Svg>;
}
function IcCheck({ c = '#fff' }: { c?: string }) {
  return <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><Path d="M20 6L9 17l-5-5" /></Svg>;
}
function IcClock({ c = T.primary }: { c?: string }) {
  return <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><Circle cx={12} cy={12} r={10} /><Path d="M12 6v6l4 2" /></Svg>;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormState {
  scheduleType: ScheduleType | '';
  format: ReportFormat | '';
  scheduledDate: string;
  sendTime: string;
  frequency: Frequency | '';
  customIntervalDays: string;
  sendDayOfWeek: string;
  sendDayOfMonth: string;
  recipientsTo: string;
  recipientsCc: string;
  subject: string;
  bodyMessage: string;
  endType: EndType | '';
  endAfterCount: string;
  endDate: string;
}

const EMPTY: FormState = {
  scheduleType: '', format: '', scheduledDate: '',
  sendTime: '08:00', frequency: '', customIntervalDays: '1',
  sendDayOfWeek: '1', sendDayOfMonth: '1',
  recipientsTo: '', recipientsCc: '',
  subject: '', bodyMessage: '',
  endType: '', endAfterCount: '5', endDate: '',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  onScheduled?: () => void;
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}

function Field({ value, onChange, placeholder, type = 'default', multiline = false }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: 'default' | 'email-address' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
}) {
  return (
    <TextInput
      value={value} onChangeText={onChange} placeholder={placeholder}
      placeholderTextColor={T.textMuted}
      keyboardType={type}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      style={[s.input, multiline && { height: 72, textAlignVertical: 'top' }]}
    />
  );
}

function OptionBtn({ label, desc, selected, onPress }: {
  label: string; desc: string; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress} activeOpacity={0.8}
      style={[s.optBtn, selected && s.optBtnSel]}
    >
      <View style={s.optRadio}>
        {selected && <View style={s.optRadioInner} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.optLabel, selected && { color: T.primary }]}>{label}</Text>
        <Text style={s.optDesc}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );
}

function StepDot({ n, current }: { n: number; current: number }) {
  const done   = n < current;
  const active = n === current;
  const bg = done ? '#16A34A' : active ? T.primary : '#E5E7EB';
  return (
    <View style={[s.dot, { backgroundColor: bg }]}>
      {done
        ? <IcCheck c="#fff" />
        : <Text style={[s.dotTxt, { color: active ? '#fff' : T.textMuted }]}>{n}</Text>
      }
    </View>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ScheduleWizard({ visible, onClose, projectId, projectName, onScheduled }: Props) {
  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState<FormState>(EMPTY);
  const [errs, setErrs]       = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus]   = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [showDatePicker, setShowDatePicker] = useState<false | 'scheduledDate' | 'endDate'>(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const totalSteps = form.scheduleType === 'RECURRING' ? 6 : 5;
  const isFinal    = step === totalSteps;

  const stepLabels =
    form.scheduleType === 'RECURRING'
      ? ['Type', 'Timing', 'To', 'Ends', 'Msg', 'Review']
      : ['Type', 'Timing', 'To', 'Msg', 'Review'];

  const validate = (s: number) => {
    const e: typeof errs = {};
    if (s === 1 && !form.scheduleType) e.scheduleType = 'Select a schedule type';
    if (s === 2) {
      if (!form.format)   e.format = 'Select a format';
      if (!form.sendTime) e.sendTime = 'Enter send time';
      if (form.scheduleType === 'ONE_TIME' && !form.scheduledDate) e.scheduledDate = 'Pick a date';
      if (form.scheduleType === 'RECURRING' && !form.frequency) e.frequency = 'Select frequency';
    }
    if (s === 3 && !form.recipientsTo.trim()) e.recipientsTo = 'At least one recipient required';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) setStep(p => p + 1); };
  const back = () => setStep(p => Math.max(1, p - 1));

  const reset = useCallback(() => {
    setStep(1); setForm(EMPTY); setErrs({}); setStatus('idle');
  }, []);

  const close = () => { if (status === 'loading') return; reset(); onClose(); };

  const confirm = useCallback(async () => {
    if (status === 'loading') return;
    setStatus('loading');
    const emails = (s: string) => s.split(/[,\s]+/).map(e => e.trim()).filter(Boolean);
    const payload: ScheduledReportRequest = {
      projectId,
      format:       form.format as ReportFormat,
      scheduleType: form.scheduleType as ScheduleType,
      sendTime:     form.sendTime,
      timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
      recipientsTo: emails(form.recipientsTo),
      ...(form.recipientsCc && { recipientsCc: emails(form.recipientsCc) }),
      ...(form.subject      && { subject:      form.subject }),
      ...(form.bodyMessage  && { bodyMessage:   form.bodyMessage }),
    };
    if (form.scheduleType === 'ONE_TIME') {
      payload.scheduledDate = form.scheduledDate;
    } else {
      payload.frequency = form.frequency as Frequency;
      if (form.frequency === 'CUSTOM')  payload.customIntervalDays = Number(form.customIntervalDays);
      if (form.frequency === 'WEEKLY')  payload.sendDayOfWeek  = Number(form.sendDayOfWeek);
      if (form.frequency === 'MONTHLY') payload.sendDayOfMonth = Number(form.sendDayOfMonth);
      if (form.endType && form.endType !== 'MANUAL') {
        payload.endType = form.endType as EndType;
        if (form.endType === 'AFTER_N')    payload.endAfterCount = Number(form.endAfterCount);
        if (form.endType === 'UNTIL_DATE') payload.endDate = form.endDate;
      } else if (form.endType === 'MANUAL') {
        payload.endType = 'MANUAL';
      }
    }
    try {
      await createScheduledReport(payload);
      setStatus('done');
      setTimeout(() => { reset(); onClose(); onScheduled?.(); }, 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [form, projectId, status, reset, onClose, onScheduled]);

  // ── Step content ──────────────────────────────────────────────────────────
  const renderBody = () => {
    switch (step) {
      case 1: return (
        <View style={s.stepWrap}>
          <Text style={s.stepTitle}>How should this report be sent?</Text>
          <OptionBtn label="One-Time" desc="Send once at a specific date & time"
            selected={form.scheduleType === 'ONE_TIME'}
            onPress={() => set('scheduleType', 'ONE_TIME')} />
          <OptionBtn label="Recurring" desc="Send daily, weekly, monthly, or custom"
            selected={form.scheduleType === 'RECURRING'}
            onPress={() => set('scheduleType', 'RECURRING')} />
          {errs.scheduleType && <Text style={s.errTxt}>{errs.scheduleType}</Text>}
        </View>
      );
      case 2: return (
        <View style={s.stepWrap}>
          <Label>Report Format</Label>
          <View style={s.fmtRow}>
            {(['PDF','EXCEL','BOTH'] as ReportFormat[]).map(f => {
              const sel = form.format === f;
              const color = f === 'PDF' ? '#DC2626' : f === 'EXCEL' ? '#16A34A' : T.primary;
              return (
                <TouchableOpacity key={f} onPress={() => set('format', f)} activeOpacity={0.8}
                  style={[s.fmtBtn, { borderColor: sel ? color : '#E5E7EB', backgroundColor: sel ? color + '15' : '#FAFAFA' }]}>
                  <Text style={[s.fmtTxt, { color: sel ? color : '#374151' }]}>{f === 'BOTH' ? 'Both' : f}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errs.format && <Text style={s.errTxt}>{errs.format}</Text>}

          {form.scheduleType === 'ONE_TIME' && (
            <View style={{ marginTop: 14 }}>
              <Label>Send Date</Label>
              <TouchableOpacity
                style={s.pickerBtn}
                onPress={() => setShowDatePicker('scheduledDate')}
                activeOpacity={0.8}
              >
                <Text style={[s.pickerTxt, !form.scheduledDate && { color: T.textMuted }]}>
                  {form.scheduledDate || 'Select a date'}
                </Text>
              </TouchableOpacity>
              {errs.scheduledDate && <Text style={s.errTxt}>{errs.scheduledDate}</Text>}
            </View>
          )}
          {form.scheduleType === 'RECURRING' && (
            <View style={{ marginTop: 14, gap: 10 }}>
              <Label>Frequency</Label>
              {(['DAILY','WEEKLY','MONTHLY','CUSTOM'] as Frequency[]).map(f => (
                <TouchableOpacity key={f} onPress={() => set('frequency', f)} activeOpacity={0.8}
                  style={[s.optBtn, form.frequency === f && s.optBtnSel]}>
                  <View style={s.optRadio}>{form.frequency === f && <View style={s.optRadioInner} />}</View>
                  <Text style={[s.optLabel, form.frequency === f && { color: T.primary }]}>{f.charAt(0) + f.slice(1).toLowerCase()}</Text>
                </TouchableOpacity>
              ))}
              {errs.frequency && <Text style={s.errTxt}>{errs.frequency}</Text>}
              {form.frequency === 'CUSTOM' && (
                <><Label>Every how many days?</Label>
                <Field value={form.customIntervalDays} onChange={v => set('customIntervalDays', v)} type="numeric" placeholder="e.g. 3" /></>
              )}
            </View>
          )}
          <View style={{ marginTop: 14 }}>
            <Label>Time of Day (HH:MM)</Label>
            <TouchableOpacity
              style={s.pickerBtn}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={[s.pickerTxt, !form.sendTime && { color: T.textMuted }]}>
                {form.sendTime || 'Select time'}
              </Text>
            </TouchableOpacity>
            {errs.sendTime && <Text style={s.errTxt}>{errs.sendTime}</Text>}
          </View>
        </View>
      );
      case 3: return (
        <View style={s.stepWrap}>
          <Label>To (required — comma-separated)</Label>
          <Field value={form.recipientsTo} onChange={v => set('recipientsTo', v)}
            type="email-address" placeholder="user@example.com, other@example.com" />
          {errs.recipientsTo && <Text style={s.errTxt}>{errs.recipientsTo}</Text>}
          <View style={{ marginTop: 14 }}>
            <Label>CC (optional)</Label>
            <Field value={form.recipientsCc} onChange={v => set('recipientsCc', v)}
              type="email-address" placeholder="cc@example.com" />
          </View>
        </View>
      );
      case 4:
        if (form.scheduleType === 'RECURRING') return (
          <View style={s.stepWrap}>
            <Text style={s.stepTitle}>When should this schedule stop?</Text>
            <OptionBtn label="After N sends" desc="Stop after a fixed number of deliveries"
              selected={form.endType === 'AFTER_N'} onPress={() => set('endType', 'AFTER_N')} />
            <OptionBtn label="Until a date" desc="Stop after a specific end date"
              selected={form.endType === 'UNTIL_DATE'} onPress={() => set('endType', 'UNTIL_DATE')} />
            <OptionBtn label="Manual" desc="Continue until you pause or cancel"
              selected={form.endType === 'MANUAL'} onPress={() => set('endType', 'MANUAL')} />
            {form.endType === 'AFTER_N' && (
              <><Label>Number of sends</Label>
              <Field value={form.endAfterCount} onChange={v => set('endAfterCount', v)} type="numeric" /></>
            )}
            {form.endType === 'UNTIL_DATE' && (
              <><Label>End Date</Label>
              <TouchableOpacity
                style={s.pickerBtn}
                onPress={() => setShowDatePicker('endDate')}
                activeOpacity={0.8}
              >
                <Text style={[s.pickerTxt, !form.endDate && { color: T.textMuted }]}>
                  {form.endDate || 'Select end date'}
                </Text>
              </TouchableOpacity>
              </>
            )}
          </View>
        );
        return renderMsgStep();
      case 5:
        if (form.scheduleType === 'RECURRING') return renderMsgStep();
        return renderSummary();
      case 6: return renderSummary();
      default: return null;
    }
  };

  function renderMsgStep() {
    return (
      <View style={s.stepWrap}>
        <Label>Subject (optional)</Label>
        <Field value={form.subject} onChange={v => set('subject', v)} placeholder={`Report for ${projectName}`} />
        <View style={{ marginTop: 14 }}>
          <Label>Message (optional)</Label>
          <Field value={form.bodyMessage} onChange={v => set('bodyMessage', v)}
            placeholder="Add a personal note…" multiline />
        </View>
      </View>
    );
  }

  function renderSummary() {
    const rows = [
      ['Format',   form.format || '—'],
      ['Type',     form.scheduleType === 'ONE_TIME' ? 'One-Time' : 'Recurring'],
      ['Schedule', form.scheduledDate ? `On ${form.scheduledDate} at ${form.sendTime}` : `${form.frequency?.toLowerCase() ?? '—'} at ${form.sendTime}`],
      ['To',       form.recipientsTo || '—'],
      ...(form.recipientsCc ? [['CC', form.recipientsCc]] : []),
      ...(form.subject ? [['Subject', form.subject]] : []),
    ] as [string, string][];
    return (
      <View style={s.stepWrap}>
        <Text style={s.stepTitle}>Review your schedule</Text>
        <View style={s.summaryBox}>
          {rows.map(([label, val]) => (
            <View key={label} style={s.summaryRow}>
              <Text style={s.summaryKey}>{label}</Text>
              <Text style={s.summaryVal}>{val}</Text>
            </View>
          ))}
        </View>
        <Text style={s.summaryNote}>Confirm to activate. You can pause or cancel anytime from the Report tab.</Text>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={close} />
      <View style={s.sheet}>
        <View style={s.handle} />

        {/* Header */}
        <LinearGradient colors={['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.headerIcon}><IcClock c="#fff" /></View>
            <View>
              <Text style={s.headerTitle}>Schedule Report</Text>
              <Text style={s.headerSub} numberOfLines={1}>{projectName}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={close} style={s.closeBtn} disabled={status === 'loading'}>
            <IcClose />
          </TouchableOpacity>
        </LinearGradient>

        {/* Step indicators */}
        <View style={s.stepper}>
          {stepLabels.map((label, i) => (
            <React.Fragment key={label}>
              <View style={s.stepItem}>
                <StepDot n={i + 1} current={step} />
                <Text style={[s.stepLabel, i + 1 === step && { color: T.primary }]}>{label}</Text>
              </View>
              {i < stepLabels.length - 1 && (
                <View style={[s.stepLine, { backgroundColor: i + 1 < step ? '#16A34A' : '#E5E7EB' }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Body */}
        <ScrollView style={s.scrollBody} keyboardShouldPersistTaps="handled">
          {renderBody()}
        </ScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <TouchableOpacity onPress={back} disabled={step === 1 || status === 'loading'} style={s.backBtn}>
            <Text style={[s.backTxt, (step === 1 || status === 'loading') && { opacity: 0.35 }]}>← Back</Text>
          </TouchableOpacity>

          {isFinal ? (
            <TouchableOpacity
              onPress={confirm}
              disabled={status === 'loading' || status === 'done'}
              activeOpacity={0.85}
              style={[s.nextBtn, {
                backgroundColor:
                  status === 'done' ? '#16A34A' :
                  status === 'error' ? '#DC2626' : '#7C3AED',
              }]}
            >
              {status === 'loading'
                ? <ActivityIndicator size="small" color="#fff" />
                : <IcCheck />
              }
              <Text style={s.nextTxt}>
                {status === 'loading' ? 'Scheduling…' :
                 status === 'done'    ? 'Scheduled!' :
                 status === 'error'   ? 'Failed — Retry' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={next} activeOpacity={0.85} style={s.nextBtn}>
              <Text style={s.nextTxt}>Next →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Pickers */}
      <CalendarPicker
        visible={!!showDatePicker}
        value={showDatePicker ? form[showDatePicker as 'scheduledDate' | 'endDate'] : ''}
        onSelect={(v) => {
          if (showDatePicker) set(showDatePicker as 'scheduledDate' | 'endDate', v);
        }}
        onClose={() => setShowDatePicker(false)}
        title={showDatePicker === 'endDate' ? 'Select End Date' : 'Select Send Date'}
      />
      <TimePicker
        visible={showTimePicker}
        value={form.sendTime}
        onSelect={(v) => set('sendTime', v)}
        onClose={() => setShowTimePicker(false)}
      />
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:     { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.14, shadowRadius: 20 }, android: { elevation: 20 } }) },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 12 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  closeBtn:    { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

  stepper:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  stepItem:  { alignItems: 'center', gap: 4 },
  stepLabel: { fontSize: 8.5, fontWeight: '700', color: T.textMuted, letterSpacing: 0.4 },
  stepLine:  { flex: 1, height: 1.5, marginBottom: 14 },
  dot:       { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dotTxt:    { fontSize: 11, fontWeight: '800' },

  scrollBody: { maxHeight: 380 },
  stepWrap:  { padding: 20, gap: 10 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 4 },

  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input:      { height: 44, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, fontSize: 13, color: '#1F2937', backgroundColor: '#FAFAFA' },
  pickerBtn:  { height: 44, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#FAFAFA' },
  pickerTxt:  { fontSize: 13, color: '#1F2937' },
  errTxt:     { fontSize: 11, color: '#DC2626', marginTop: 2 },

  optBtn:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  optBtnSel: { borderColor: T.primary, backgroundColor: T.primaryLight },
  optRadio:  { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  optRadioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.primary },
  optLabel:  { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  optDesc:   { fontSize: 11, color: T.textMuted, marginTop: 2 },

  fmtRow:    { flexDirection: 'row', gap: 10 },
  fmtBtn:    { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  fmtTxt:    { fontSize: 12, fontWeight: '800' },

  summaryBox: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(21,93,252,0.15)', backgroundColor: 'rgba(21,93,252,0.04)', padding: 14, gap: 8 },
  summaryRow: { flexDirection: 'row', gap: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  summaryKey: { fontSize: 10, fontWeight: '800', color: T.textMuted, width: 70, textTransform: 'uppercase', letterSpacing: 0.5, paddingTop: 1 },
  summaryVal: { flex: 1, fontSize: 12, fontWeight: '600', color: '#1F2937' },
  summaryNote: { fontSize: 11, color: T.textMuted, textAlign: 'center', lineHeight: 16 },

  footer:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingBottom: 28 },
  backBtn:   { paddingHorizontal: 16, paddingVertical: 10 },
  backTxt:   { fontSize: 13, fontWeight: '600', color: T.textSecondary },
  nextBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 14, backgroundColor: T.primary },
  nextTxt:   { fontSize: 13, fontWeight: '800', color: '#fff' },
});
