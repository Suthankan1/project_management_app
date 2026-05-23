/**
 * Mobile project pages editor aligned with the existing Summary mobile theme.
 * Design: light app background, white cards, blue accents, soft borders, and SVG actions.
 * Performance: memoized filtering, callback-stable handlers, stale-safe autosave, skeleton rows.
 * CI/CD note: scoped to this file only; no API, token, navigation, test, workflow, or package changes.
 */
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import api from '../../api/axios';
import { T } from '../../constants/tokens';

const { width: SW, height: SH } = Dimensions.get('window');
const GLASS = {
  border: '#E2E8F0',
  text: '#0F172A',
  secondary: '#64748B',
  muted: '#94A3B8',
  placeholder: '#94A3B8',
};
const BG_GRADIENT = ['#F7F8FA', '#F9FAFB', '#FFFFFF'] as const;
const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END = { x: 1, y: 1 } as const;
const useNativeDriver = Platform.OS !== 'web';

export interface PageItem {
  id: string | number;
  title: string;
  content?: string;
  isStarred?: boolean;
  parentId?: string | number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  content: string;
}

interface MobilePagesScreenProps {
  projectId: number;
  projectName?: string;
  topOffset?: number;
}

interface PageResponse {
  id: string | number;
  title: string;
  content?: string;
  isStarred?: boolean;
  parentId?: string | number | null;
  createdAt?: string;
  updatedAt?: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<h1[^>]*>/gi, '# ')
    .replace(/<\/h1>/gi, '\n\n')
    .replace(/<h2[^>]*>/gi, '## ')
    .replace(/<\/h2>/gi, '\n\n')
    .replace(/<h3[^>]*>/gi, '### ')
    .replace(/<\/h3>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?(ul|ol)[^>]*>/gi, '')
    .replace(/<strong[^>]*>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<em[^>]*>/gi, '*')
    .replace(/<\/em>/gi, '*')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function toHtml(text: string): string {
  if (!text.trim()) return '';
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('### ')) return `<h3>${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith('## ')) return `<h2>${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith('# ')) return `<h1>${trimmed.slice(2)}</h1>`;
      if (trimmed.startsWith('- ')) return `<li>${trimmed.slice(2)}</li>`;
      return `<p>${trimmed}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

export const PREDEFINED_TEMPLATES: Template[] = [
  { id: 'blank', name: 'Blank Page', description: 'Start from scratch with a clean writing canvas.', emoji: '📄', color: '#64748B', content: '' },
  { id: 'meeting-notes', name: 'Meeting Notes', description: 'Agenda, decisions, and follow-up actions.', emoji: '💬', color: '#3B82F6', content: '# Meeting Notes\n\n## Agenda\n- Topic 1\n- Topic 2\n\n## Decisions\n- Decision 1\n\n## Action Items\n- [ ] Owner - Task - Due date' },
  { id: 'project-plan', name: 'Project Plan', description: 'Goals, timeline, milestones, and risks.', emoji: '🎯', color: '#6366F1', content: '# Project Plan\n\n## Objective\n- Define the outcome\n\n## Milestones\n- Milestone 1\n- Milestone 2\n\n## Risks\n- Risk and mitigation' },
  { id: 'prd', name: 'Product Requirements', description: 'Problem, scope, users, and acceptance criteria.', emoji: '🖥️', color: '#A855F7', content: '# Product Requirements Document\n\n## Problem\n- What are we solving?\n\n## Users\n- Primary user\n\n## Requirements\n- Requirement 1\n\n## Out of Scope\n- Item' },
  { id: 'retrospective', name: 'Retrospective', description: 'Reflect on wins, misses, and next improvements.', emoji: '📈', color: '#F59E0B', content: '# Team Retrospective\n\n## What went well\n- Point\n\n## What did not go well\n- Point\n\n## Improvements\n- Action' },
  { id: 'sprint-retro', name: 'Sprint Retrospective', description: 'Sprint-focused start, stop, continue notes.', emoji: '⏱️', color: '#F97316', content: '# Sprint Retrospective\n\n## Sprint Goal Review\n- Result\n\n## Start\n- Item\n\n## Stop\n- Item\n\n## Continue\n- Item' },
  { id: 'knowledge-base', name: 'Knowledge Base', description: 'Document a process or reusable team guide.', emoji: '📖', color: '#10B981', content: '# How to [Topic]\n\n## Overview\n- What this guide covers\n\n## Steps\n- Step 1\n- Step 2\n\n## Notes\n- Helpful context' },
  { id: 'bug-report', name: 'Bug Report', description: 'Capture reproduction steps and expected behavior.', emoji: '🐞', color: '#EF4444', content: '# Bug Report\n\n## Description\n- What happened?\n\n## Steps to Reproduce\n- Step 1\n- Step 2\n\n## Expected\n- Expected behavior\n\n## Actual\n- Actual behavior' },
];

const getErrorMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

const SpringTouchable = memo(function SpringTouchable({
  onPress,
  children,
  style,
  disabled = false,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.96, tension: 500, friction: 10, useNativeDriver }).start();
  }, [scale]);
  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, tension: 350, friction: 14, useNativeDriver }).start();
  }, [scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity activeOpacity={1} disabled={disabled} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={style}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
});

const FadeInUp = memo(function FadeInUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay, useNativeDriver }),
      Animated.spring(translateY, { toValue: 0, delay, tension: 200, friction: 20, useNativeDriver }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, opacity, translateY]);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
});

const LiquidGlassCard = memo(function LiquidGlassCard({ children, style, intensity = 28 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; intensity?: number }) {
  return (
    <View style={[styles.card, style]}>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(255,255,255,0.96)', 'rgba(255,255,255,0.78)']} start={GRADIENT_START} end={GRADIENT_END} style={StyleSheet.absoluteFillObject} />
      <View style={styles.topShine} />
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
});

const SkeletonPulse = memo(function SkeletonPulse({ width, height, borderRadius = 8, style }: { width: number; height: number; borderRadius?: number; style?: StyleProp<ViewStyle> }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] });
  return <Animated.View style={[styles.skeletonPulse, { width, height, borderRadius, opacity }, style]} />;
});

export const PagesSkeleton = memo(function PagesSkeleton() {
  const rows = [0, 1, 2, 3, 4];
  return (
    <ScrollView pointerEvents="none" contentContainerStyle={styles.pagesSkeletonContent} showsVerticalScrollIndicator={false}>
      <LiquidGlassCard>
        {rows.map((row) => (
          <View key={row} style={[styles.pageSkeletonRow, row < rows.length - 1 && styles.rowDivider]}>
            <SkeletonPulse width={28} height={28} borderRadius={8} />
            <SkeletonPulse width={SW * 0.52} height={13} />
            <View style={styles.flexSpacer} />
            <SkeletonPulse width={22} height={22} borderRadius={11} />
          </View>
        ))}
      </LiquidGlassCard>
    </ScrollView>
  );
});

const IconSearch = memo(function IconSearch() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={8} stroke="#94A3B8" strokeWidth={2.5} />
      <Path d="m21 21-4.3-4.3" stroke="#94A3B8" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
});

const IconBack = memo(function IconBack() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 5l-7 7 7 7" stroke={T.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});

const IconPlus = memo(function IconPlus() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5v14" stroke={T.primary} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
});

const IconTrash = memo(function IconTrash() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" stroke="#F87171" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});

export const IconDownload = memo(function IconDownload() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={T.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});

export const IconFolder = memo(function IconFolder({ color = '#F59E0B' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color + '30'}>
      <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});

export const IconChevronRight = memo(function IconChevronRight() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="m9 18 6-6-6-6" stroke="#CBD5E1" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});

export const IconNewFolder = memo(function IconNewFolder() {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2zM12 11v6M9 14h6" stroke={T.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});

const IconFile = memo(function IconFile() {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" stroke="#60A5FA" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});

const IconStar = memo(function IconStar({ filled, color = '#F59E0B' }: { filled: boolean; color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});

const IconCheck = memo(function IconCheck() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke="#34D399" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});

const GlassIconButton = memo(function GlassIconButton({
  icon,
  onPress,
  accent = false,
  label,
  disabled = false,
  accessibilityLabel,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  accent?: boolean;
  label?: string;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  return (
    <SpringTouchable onPress={onPress} disabled={disabled} style={[styles.glassIconButton, label ? styles.glassIconWithLabel : styles.glassIconSquare, accent && styles.glassIconAccent]}>
      <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
      <LinearGradient colors={accent ? [T.primaryLight, '#FFFFFF'] : ['rgba(255,255,255,0.96)', 'rgba(255,255,255,0.76)']} start={GRADIENT_START} end={GRADIENT_END} style={StyleSheet.absoluteFillObject} />
      <View accessibilityLabel={accessibilityLabel} style={styles.glassIconContent}>
        {icon}
        {label ? <Text style={styles.glassIconLabel}>{label}</Text> : null}
      </View>
    </SpringTouchable>
  );
});

const SectionHeader = memo(function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionBadgeText}>{count}</Text>
      </View>
    </View>
  );
});

const EmptyState = memo(function EmptyState({ searchQuery, onCreate }: { searchQuery: string; onCreate: () => void }) {
  const hasSearch = searchQuery.trim().length > 0;
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📄</Text>
      <Text style={styles.emptyTitle}>{hasSearch ? 'No matching pages' : 'No pages yet'}</Text>
      <Text style={styles.emptySubtitle}>{hasSearch ? 'Try a different search term.' : 'Create your first project page from a template.'}</Text>
      {!hasSearch ? (
        <SpringTouchable onPress={onCreate} style={styles.createFirstButton}>
          <LinearGradient colors={['rgba(21,93,252,0.85)', 'rgba(8,50,180,0.95)']} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.createFirstText}>Create First Page</Text>
        </SpringTouchable>
      ) : null}
    </View>
  );
});

const SaveBadge = memo(function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === 'idle') return <Text style={styles.autosaveIdle}>Autosaving</Text>;
  if (status === 'saving') {
    return (
      <View style={styles.saveBadge}>
        <ActivityIndicator size="small" color={T.primary} style={styles.saveSpinner} />
        <Text style={styles.saveBadgeText}>Saving...</Text>
      </View>
    );
  }
  if (status === 'saved') {
    return (
      <View style={styles.saveBadge}>
        <IconCheck />
        <Text style={styles.saveBadgeSuccess}>Saved</Text>
      </View>
    );
  }
  return (
    <View style={styles.saveBadge}>
      <Text style={styles.saveBadgeError}>Save Failed</Text>
    </View>
  );
});

export default function MobilePagesScreen({ projectId, topOffset = 0 }: MobilePagesScreenProps) {
  const [view, setView] = useState<'list' | 'template_selector' | 'editor'>('list');
  const [activeTab, setActiveTab] = useState<'all' | 'starred'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<PageItem | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const latestEditorRef = useRef<{ title: string; content: string; id: string | number }>({ title: '', content: '', id: '' });

  latestEditorRef.current = { title: editorTitle, content: editorContent, id: selectedPage?.id ?? '' };

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PageResponse[]>(`/api/projects/${projectId}/pages`);
      setPages((res.data ?? []).map((p) => ({ id: p.id, title: p.title, isStarred: !!p.isStarred, parentId: p.parentId, createdAt: p.createdAt, updatedAt: p.updatedAt })));
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch pages.'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const filteredPages = useMemo(
    () => pages.filter((p) => {
      const matches = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matches) return false;
      if (activeTab === 'starred') return !!p.isStarred;
      return true;
    }),
    [pages, searchQuery, activeTab]
  );

  const handleOpenPage = useCallback(async (pageId: string | number) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await api.get<PageResponse>(`/api/pages/${pageId}`);
      const existing = pages.find((p) => p.id === pageId);
      const pageData: PageItem = {
        id: res.data.id,
        title: res.data.title,
        content: cleanHtml(res.data.content ?? ''),
        isStarred: res.data.isStarred ?? existing?.isStarred ?? false,
        parentId: res.data.parentId,
        createdAt: res.data.createdAt,
        updatedAt: res.data.updatedAt,
      };
      setSelectedPage(pageData);
      setEditorTitle(pageData.title);
      setEditorContent(pageData.content ?? '');
      setSaveStatus('idle');
      setView('editor');
    } catch (err: unknown) {
      Alert.alert('Error', getErrorMessage(err, 'Could not open document. Please try again.'));
    } finally {
      setLoadingDetail(false);
    }
  }, [pages]);

  const handleToggleStar = useCallback((page: PageItem) => {
    const nextStarred = !page.isStarred;
    setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, isStarred: nextStarred } : p)));
    setSelectedPage((prev) => (prev?.id === page.id ? { ...prev, isStarred: nextStarred } : prev));
  }, []);

  const handlePublishPage = useCallback(async () => {
    if (!editorTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the document.');
      return;
    }
    setSaveStatus('saving');
    try {
      const res = await api.post<{ id: number; title: string; content?: string }>(`/api/projects/${projectId}/pages`, {
        title: editorTitle.trim(),
        content: toHtml(editorContent),
      });
      const newPage: PageItem = { id: res.data.id, title: res.data.title, content: cleanHtml(res.data.content ?? ''), isStarred: false };
      setPages((prev) => [newPage, ...prev]);
      setSelectedPage(newPage);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
      setView('list');
      await fetchPages();
    } catch (err: unknown) {
      setSaveStatus('error');
      Alert.alert('Error', getErrorMessage(err, 'Failed to publish document.'));
    }
  }, [editorContent, editorTitle, fetchPages, projectId]);

  useEffect(() => {
    if (view !== 'editor' || !selectedPage || selectedPage.id === 'new') return undefined;
    const hasChanges = editorTitle !== selectedPage.title || editorContent !== (selectedPage.content ?? '');
    if (!hasChanges) return undefined;
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      const { title, content, id } = latestEditorRef.current;
      try {
        await api.put<PageResponse>(`/api/pages/${id}`, { title, content: toHtml(content) });
        setPages((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
        setSelectedPage((prev) => (prev ? { ...prev, title, content } : prev));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (err: unknown) {
        getErrorMessage(err, 'Failed to autosave document.');
        setSaveStatus('error');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [editorTitle, editorContent, view, selectedPage]);

  const handleManualSave = useCallback(async () => {
    if (!selectedPage || selectedPage.id === 'new') return;
    setSaveStatus('saving');
    try {
      await api.put<PageResponse>(`/api/pages/${selectedPage.id}`, { title: editorTitle, content: toHtml(editorContent) });
      setPages((prev) => prev.map((p) => (p.id === selectedPage.id ? { ...p, title: editorTitle } : p)));
      setSelectedPage((prev) => (prev ? { ...prev, title: editorTitle, content: editorContent } : prev));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (err: unknown) {
      setSaveStatus('error');
      Alert.alert('Error', getErrorMessage(err, 'Failed to save document.'));
    }
  }, [editorContent, editorTitle, selectedPage]);

  const handleDeletePage = useCallback(() => {
    if (!selectedPage || selectedPage.id === 'new') return;
    Alert.alert('Delete Page', `Delete "${selectedPage.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete<void>(`/api/pages/${selectedPage.id}`);
            setPages((prev) => prev.filter((p) => p.id !== selectedPage.id));
            setSelectedPage(null);
            setView('list');
          } catch (err: unknown) {
            Alert.alert('Error', getErrorMessage(err, 'Failed to delete page.'));
          }
        },
      },
    ]);
  }, [selectedPage]);

  const handleSelectTemplate = useCallback((template: Template) => {
    const draftPage: PageItem = {
      id: 'new',
      title: template.id === 'blank' ? 'Untitled Page' : template.name,
      content: template.content,
      isStarred: false,
    };
    setSelectedPage(draftPage);
    setEditorTitle(draftPage.title);
    setEditorContent(draftPage.content ?? '');
    setSaveStatus('idle');
    setView('editor');
  }, []);

  const renderTabs = () => (
    <View style={styles.tabRow}>
      {(['all', 'starred'] as const).map((tab) => {
        const active = activeTab === tab;
        return (
          <SpringTouchable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabButton, active && styles.tabButtonActive]}>
            {active ? <LinearGradient colors={[T.primaryLight, '#FFFFFF']} style={StyleSheet.absoluteFillObject} /> : null}
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab === 'all' ? 'All Pages' : '★ Starred'}</Text>
          </SpringTouchable>
        );
      })}
    </View>
  );

  const renderListView = () => (
    <View style={styles.fullFlex}>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(255,255,255,0.96)', 'rgba(255,255,255,0.76)']} style={StyleSheet.absoluteFillObject} />
          <IconSearch />
          <TextInput
            clearButtonMode="while-editing"
            onChangeText={setSearchQuery}
            placeholder="Search pages..."
            placeholderTextColor={GLASS.placeholder}
            style={styles.searchInput}
            value={searchQuery}
          />
        </View>
        <GlassIconButton accessibilityLabel="Create page" icon={<IconPlus />} onPress={() => setView('template_selector')} />
      </View>
      {renderTabs()}
      {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}
      {loading ? (
        <PagesSkeleton />
      ) : filteredPages.length === 0 ? (
        <EmptyState searchQuery={searchQuery} onCreate={() => setView('template_selector')} />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <SectionHeader label="PAGES" count={filteredPages.length} />
          <LiquidGlassCard>
            {filteredPages.map((page, idx) => (
              <FadeInUp key={page.id} delay={idx * 35}>
                <SpringTouchable onPress={() => handleOpenPage(page.id)} style={[styles.pageRow, idx < filteredPages.length - 1 && styles.rowDivider]}>
                  <View style={styles.pageRowLeft}>
                    <IconFile />
                    <Text style={styles.pageTitle} numberOfLines={1}>{page.title}</Text>
                  </View>
                  <SpringTouchable onPress={() => handleToggleStar(page)} style={styles.starButton}>
                    <IconStar filled={!!page.isStarred} color={page.isStarred ? '#F59E0B' : '#CBD5E1'} />
                  </SpringTouchable>
                </SpringTouchable>
              </FadeInUp>
            ))}
          </LiquidGlassCard>
        </ScrollView>
      )}
    </View>
  );

  const renderTemplateSelector = () => (
    <View style={styles.fullFlex}>
      <View style={styles.selectorHeader}>
        <GlassIconButton accessibilityLabel="Back to pages" icon={<IconBack />} onPress={() => setView('list')} />
        <Text style={styles.selectorHeaderTitle}>Choose Template</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.templateContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.templateHeading}>Create a new page</Text>
        <Text style={styles.templateSubheading}>Pick a structure and start writing with a clean project-ready draft.</Text>
        {PREDEFINED_TEMPLATES.map((template, idx) => (
          <FadeInUp key={template.id} delay={idx * 28}>
            <SpringTouchable onPress={() => handleSelectTemplate(template)}>
              <LiquidGlassCard style={styles.templateCard}>
                <View style={styles.templateRow}>
                  <View style={[styles.templateEmojiBox, { backgroundColor: template.color + '20' }]}>
                    <Text style={styles.templateEmoji}>{template.emoji}</Text>
                  </View>
                  <View style={styles.templateText}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateDescription}>{template.description}</Text>
                  </View>
                </View>
              </LiquidGlassCard>
            </SpringTouchable>
          </FadeInUp>
        ))}
      </ScrollView>
    </View>
  );

  const renderEditor = () => {
    const isNew = selectedPage?.id === 'new';
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={120} style={styles.fullFlex}>
        <View style={styles.editorHeader}>
          <GlassIconButton accessibilityLabel="Back to pages" icon={<IconBack />} onPress={() => { setView('list'); setSelectedPage(null); }} />
          <View style={styles.saveBadgeSlot}><SaveBadge status={saveStatus} /></View>
          <View style={styles.editorActions}>
            {isNew ? (
              <SpringTouchable onPress={handlePublishPage} style={styles.publishButton}>
                <LinearGradient colors={['rgba(21,93,252,0.85)', 'rgba(8,50,180,0.95)']} style={StyleSheet.absoluteFillObject} />
                <Text style={styles.publishText}>Publish</Text>
              </SpringTouchable>
            ) : (
              <>
                <SpringTouchable onPress={() => selectedPage && handleToggleStar(selectedPage)} style={styles.editorIconButton}>
                  <IconStar filled={!!selectedPage?.isStarred} color={selectedPage?.isStarred ? '#F59E0B' : '#CBD5E1'} />
                </SpringTouchable>
                <GlassIconButton accessibilityLabel="Save page" icon={<IconCheck />} label="Save" onPress={handleManualSave} />
                <SpringTouchable onPress={handleDeletePage} style={styles.editorIconButton}>
                  <IconTrash />
                </SpringTouchable>
              </>
            )}
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.editorCanvasContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.editorCanvas}>
          <LinearGradient colors={['rgba(21,93,252,0.04)', 'rgba(21,93,252,0)']} style={styles.editorDecor} />
          <TextInput
            maxLength={100}
            onChangeText={setEditorTitle}
            placeholder="Page title"
            placeholderTextColor="#94A3B8"
            style={styles.titleInput}
            value={editorTitle}
          />
          <View style={styles.editorDivider} />
          <TextInput
            multiline
            onChangeText={setEditorContent}
            placeholder="Start writing..."
            placeholderTextColor="#94A3B8"
            style={styles.contentInput}
            textAlignVertical="top"
            value={editorContent}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <LinearGradient colors={BG_GRADIENT} style={[styles.container, { paddingTop: topOffset }]}>
      <View pointerEvents="none" style={styles.blobOne} />
      <View pointerEvents="none" style={styles.blobTwo} />
      {loadingDetail ? (
        <View style={styles.detailOverlay}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <ActivityIndicator color={T.primary} size="large" />
          <Text style={styles.detailText}>Opening document...</Text>
        </View>
      ) : null}
      {view === 'list' ? renderListView() : null}
      {view === 'template_selector' ? renderTemplateSelector() : null}
      {view === 'editor' ? renderEditor() : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fullFlex: { flex: 1 },
  flexSpacer: { flex: 1 },
  blobOne: { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(21,93,252,0.035)', top: -100, right: -80 },
  blobTwo: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(139,92,246,0.025)', bottom: 60, left: -70 },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    ...Platform.select({ ios: { shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12 }, android: { elevation: 3 } }),
  },
  topShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: '#FFFFFF' },
  cardContent: { paddingHorizontal: 16, paddingVertical: 4 },
  skeletonPulse: { backgroundColor: '#E8EDF5' },
  pagesSkeletonContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  pageSkeletonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  glassIconButton: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  glassIconSquare: { width: 40, height: 40 },
  glassIconWithLabel: { minHeight: 40, paddingHorizontal: 12 },
  glassIconAccent: { borderColor: T.primaryMuted + '55' },
  glassIconContent: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  glassIconLabel: { fontSize: 11, fontWeight: '700', color: T.primary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, marginBottom: 8 },
  sectionLabel: { color: '#64748B', fontSize: 10, letterSpacing: 1.8, fontWeight: '800' },
  sectionBadge: { backgroundColor: T.primaryLight, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  sectionBadgeText: { fontSize: 10, fontWeight: '700', color: T.primary },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F1F5F9' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  searchBar: { flex: 1, height: 44, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  searchInput: { flex: 1, color: '#0F172A', padding: 0, fontSize: 14, fontWeight: '600' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tabButton: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 9, backgroundColor: '#FFFFFF' },
  tabButtonActive: { borderColor: T.primaryMuted + '55' },
  tabText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  tabTextActive: { color: T.primary },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  pageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, minHeight: 54 },
  pageRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  pageTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: GLASS.text },
  starButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 8 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19 },
  createFirstButton: { height: 44, borderRadius: 14, overflow: 'hidden', paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  createFirstText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  selectorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  selectorHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  headerSpacer: { width: 40 },
  templateContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  templateHeading: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.6 },
  templateSubheading: { fontSize: 13.5, color: '#64748B', lineHeight: 20, marginTop: 6, marginBottom: 20 },
  templateCard: { marginBottom: 10 },
  templateRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  templateEmojiBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  templateEmoji: { fontSize: 24 },
  templateText: { flex: 1 },
  templateName: { fontSize: 14.5, fontWeight: '800', color: '#0F172A' },
  templateDescription: { marginTop: 3, fontSize: 12, color: '#64748B', lineHeight: 16 },
  editorHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
  saveBadgeSlot: { flex: 1, alignItems: 'center' },
  editorActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editorIconButton: { padding: 8 },
  publishButton: { height: 36, borderRadius: 12, overflow: 'hidden', paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  publishText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  autosaveIdle: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  saveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  saveSpinner: { transform: [{ scale: 0.65 }] },
  saveBadgeText: { fontSize: 11, color: '#64748B', fontWeight: '800' },
  saveBadgeSuccess: { fontSize: 11, color: '#34D399', fontWeight: '800' },
  saveBadgeError: { fontSize: 11, color: '#F87171', fontWeight: '800' },
  editorCanvas: { flex: 1, backgroundColor: '#FFFFFF' },
  editorCanvasContent: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 100 },
  editorDecor: { height: 80, marginHorizontal: -20 },
  titleInput: { fontSize: 24, fontWeight: '900', color: '#0F172A', padding: 0, lineHeight: 32, letterSpacing: -0.5 },
  editorDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  contentInput: { fontSize: 15, color: '#334155', lineHeight: 24, padding: 0, minHeight: SH - 280 },
  detailOverlay: { position: 'absolute', zIndex: 999, top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 12 },
  detailText: { color: T.primary, fontSize: 13, fontWeight: '800' },
  errorBanner: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.28)', borderWidth: 1, borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 12 },
  errorText: { color: '#F87171', fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
