/**
 * DownloadSheet.tsx
 * Bottom-sheet: choose PDF / Excel / Both → fetch from backend
 * → save to device cache via expo-file-system → open share dialog.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing   from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Polyline } from 'react-native-svg';
import { T } from '../../constants/tokens';
import { getToken } from '../../auth/storage';
import { buildApiUrl } from '../../api/baseUrl';

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconDownload({ color = '#fff', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <Polyline points="7 10 12 15 17 10" />
      <Path d="M12 15V3" />
    </Svg>
  );
}

function IconClose({ color = '#fff' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2.5} strokeLinecap="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

function IconCheck({ color = '#fff', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

function IconShare({ color = '#fff', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    </Svg>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Format  = 'pdf' | 'excel' | 'both';
type DlState = 'idle' | 'loading' | 'done' | 'error';

const FORMATS: {
  id: Format; label: string; ext: string; desc: string;
  color: string; bg: string;
}[] = [
  { id: 'pdf',   label: 'PDF Report',     ext: '.pdf',     desc: 'Print-ready branded document',    color: '#DC2626', bg: '#FFF5F5' },
  { id: 'excel', label: 'Excel Workbook', ext: '.xlsx',    desc: 'Multi-sheet spreadsheet',          color: '#16A34A', bg: '#F0FDF4' },
  { id: 'both',  label: 'Both Formats',   ext: 'PDF+XLSX', desc: 'Complete download package',        color: T.primary, bg: T.primaryLight },
];

interface Props {
  visible:     boolean;
  onClose:     () => void;
  projectId:   number;
  projectName: string;
}

// ── Core download logic ───────────────────────────────────────────────────────

/**
 * Uses FileSystem.downloadAsync to stream the report directly from the backend
 * to the device cache — no arraybuffer / base64 conversion required.
 * The JWT is attached manually because downloadAsync bypasses axios interceptors.
 */
async function downloadAndShare(
  projectId: number,
  format: 'PDF' | 'EXCEL',
): Promise<void> {
  const token    = await getToken();
  const fileName = format === 'PDF' ? 'project_report.pdf' : 'project_report.xlsx';
  const mimeType =
    format === 'PDF'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const url = buildApiUrl(`/api/projects/${projectId}/reports/download?format=${format}`);

  const cacheDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
  const localUri = `${cacheDir}${fileName}`;

  // ── Download directly to disk (no base64 needed) ───────────────────────────
  const result = await FileSystem.downloadAsync(url, localUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Server returned HTTP ${result.status}`);
  }

  // ── Share / open ──────────────────────────────────────────────────────────
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(result.uri, {
      mimeType,
      dialogTitle: `Open ${fileName}`,
      UTI: format === 'PDF' ? 'com.adobe.pdf' : 'org.openxmlformats.spreadsheetml.sheet',
    });
  } else {
    Alert.alert(
      'File Ready',
      `Saved to:\n${result.uri}\n\nSharing is unavailable — open via a file manager.`,
    );
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DownloadSheet({ visible, onClose, projectId, projectName }: Props) {
  const [format,   setFormat] = useState<Format>('both');
  const [pdfState, setPdf]    = useState<DlState>('idle');
  const [xlState,  setXl]     = useState<DlState>('idle');

  const isLoading = pdfState === 'loading' || xlState === 'loading';
  const doPdf     = format === 'pdf'   || format === 'both';
  const doExcel   = format === 'excel' || format === 'both';

  const currentState: DlState =
    format === 'pdf'   ? pdfState :
    format === 'excel' ? xlState  :
    (pdfState === 'loading' || xlState === 'loading') ? 'loading' :
    (pdfState === 'done'  && xlState === 'done')      ? 'done'    :
    (pdfState === 'error' || xlState === 'error')     ? 'error'   : 'idle';

  const allDone =
    (format === 'pdf'   && pdfState === 'done') ||
    (format === 'excel' && xlState  === 'done') ||
    (format === 'both'  && pdfState === 'done' && xlState === 'done');

  // ── Trigger download ───────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (isLoading) return;
    if (doPdf)   setPdf('loading');
    if (doExcel) setXl('loading');

    const doOne = async (
      fmt: 'PDF' | 'EXCEL',
      setState: (s: DlState) => void,
    ) => {
      try {
        await downloadAndShare(projectId, fmt);
        setState('done');
      } catch (err: unknown) {
        setState('error');
        const msg =
          err instanceof Error ? err.message : 'Unknown error. Please try again.';
        Alert.alert(
          'Download Failed',
          `Could not generate the ${fmt} report.\n\n${msg}`,
        );
      }
    };

    if (doPdf)   await doOne('PDF',   setPdf);
    if (doExcel) await doOne('EXCEL', setXl);

    // Auto-reset success/error badge after 8 s
    setTimeout(() => { setPdf('idle'); setXl('idle'); }, 8000);
  }, [isLoading, doPdf, doExcel, projectId]);

  const handleClose = () => {
    if (isLoading) return;
    setPdf('idle'); setXl('idle');
    onClose();
  };

  // ── Derived UI state ───────────────────────────────────────────────────────
  const btnBg =
    allDone            ? '#16A34A' :
    currentState === 'error' ? '#DC2626' :
    isLoading          ? '#E5E7EB' : T.primary;

  const btnLabel =
    isLoading              ? 'Generating…' :
    allDone                ? 'File Ready — Open / Share' :
    currentState === 'error' ? 'Failed — Tap to Retry' :
    format === 'pdf'       ? 'Download PDF' :
    format === 'excel'     ? 'Download Excel' : 'Download PDF + Excel';

  const BtnIcon = allDone ? IconShare : isLoading ? null : IconDownload;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={handleClose} />

      {/* Sheet */}
      <View style={s.sheet}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Header */}
        <LinearGradient
          colors={[T.primary, '#4D8BFF']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.header}
        >
          <View style={s.headerLeft}>
            <View style={s.headerIcon}>
              <IconDownload color="#fff" size={20} />
            </View>
            <View>
              <Text style={s.headerTitle}>Download Now</Text>
              <Text style={s.headerSub} numberOfLines={1}>{projectName}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={s.closeBtn}
            disabled={isLoading}
          >
            <IconClose color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Body */}
        <View style={s.body}>
          <Text style={s.sectionLabel}>CHOOSE REPORT FORMAT</Text>

          {/* Format cards */}
          <View style={s.formatRow}>
            {FORMATS.map(f => {
              const sel = format === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setFormat(f.id)}
                  activeOpacity={0.8}
                  disabled={isLoading}
                  style={[
                    s.formatCard,
                    {
                      borderColor:     sel ? f.color : '#E5E7EB',
                      backgroundColor: sel ? f.bg    : '#FAFAFA',
                    },
                  ]}
                >
                  {sel && (
                    <View style={[s.formatCheck, { backgroundColor: f.color }]}>
                      <IconCheck color="#fff" size={11} />
                    </View>
                  )}
                  <Text style={[s.formatExt,   { color: f.color }]}>{f.ext}</Text>
                  <Text style={[s.formatLabel, { color: sel ? f.color : '#374151' }]}>
                    {f.label}
                  </Text>
                  <Text style={s.formatDesc}>{f.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Download button */}
          <TouchableOpacity
            onPress={handleDownload}
            disabled={isLoading}
            activeOpacity={0.85}
            style={[s.dlBtn, { backgroundColor: btnBg }]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={T.textMuted} />
            ) : BtnIcon ? (
              <BtnIcon color={isLoading ? T.textMuted : '#fff'} size={18} />
            ) : null}
            <Text style={[s.dlBtnText, { color: isLoading ? T.textMuted : '#fff' }]}>
              {btnLabel}
            </Text>
          </TouchableOpacity>

          {/* Per-format progress badges when doing "both" */}
          {format === 'both' && (pdfState !== 'idle' || xlState !== 'idle') && (
            <View style={s.progressRow}>
              <ProgressBadge label="PDF"   state={pdfState} />
              <ProgressBadge label="EXCEL" state={xlState}  />
            </View>
          )}

          <Text style={s.secNote}>🔒 Generated server-side · File opens via share dialog</Text>
        </View>
      </View>
    </Modal>
  );
}

// ── Progress badge ────────────────────────────────────────────────────────────

function ProgressBadge({ label, state }: { label: string; state: DlState }) {
  const color =
    state === 'done'    ? '#16A34A' :
    state === 'error'   ? '#DC2626' :
    state === 'loading' ? T.primary : T.textMuted;
  const icon =
    state === 'done'    ? '✓' :
    state === 'error'   ? '✗' :
    state === 'loading' ? '…' : '–';

  return (
    <View style={[pb.wrap, { borderColor: color + '40', backgroundColor: color + '10' }]}>
      <Text style={[pb.icon, { color }]}>{icon}</Text>
      <Text style={[pb.label, { color }]}>{label}</Text>
    </View>
  );
}

const pb = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  icon:  { fontSize: 13, fontWeight: '900' },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.14, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 12, marginBottom: 0,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 18,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon:  { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  closeBtn:    { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

  body:         { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: T.textMuted, letterSpacing: 1.2, marginBottom: 14 },

  formatRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  formatCard: {
    flex: 1, borderRadius: 16, borderWidth: 2,
    padding: 12, alignItems: 'center', gap: 4, minHeight: 110,
  },
  formatCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  formatExt:   { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  formatLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 14 },
  formatDesc:  { fontSize: 9.5, color: T.textMuted, textAlign: 'center', lineHeight: 13, marginTop: 2 },

  dlBtn: {
    height: 54, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginBottom: 12,
    ...Platform.select({
      ios:     { shadowColor: T.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  dlBtnText: { fontSize: 14, fontWeight: '800' },

  progressRow: {
    flexDirection: 'row', gap: 10, justifyContent: 'center',
    marginTop: -4, marginBottom: 10,
  },

  secNote: { fontSize: 10.5, color: T.textMuted, textAlign: 'center', marginTop: 8 },
});
