import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/axios';
import { T } from '../../constants/tokens';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Types ────────────────────────────────────────────────────────────────────
export interface PageItem {
  id: string | number;
  title: string;
  content?: string;
  isStarred?: boolean;
  parentId?: string | number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  content: string;
}

const PREDEFINED_TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Blank Page',
    description: 'Start from scratch with a completely blank canvas.',
    emoji: '📄',
    color: '#64748B',
    content: '',
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structure for agenda, attendees, and action items.',
    emoji: '💬',
    color: '#3B82F6',
    content: `<h1>Meeting Notes: [Topic]</h1>\n<p><strong>Date:</strong> YYYY-MM-DD | <strong>Attendees:</strong> @Person</p>\n<h2>Agenda</h2>\n<ul>\n  <li>Topic 1</li>\n  <li>Topic 2</li>\n</ul>\n<h2>Discussion</h2>\n<p>Key points discussed during the meeting...</p>\n<h2>Action Items</h2>\n<ul>\n  <li>[ ] Task 1 (@Owner, Due Date)</li>\n  <li>[ ] Task 2 (@Owner, Due Date)</li>\n</ul>`,
  },
  {
    id: 'project-plan',
    name: 'Project Plan',
    description: 'High-level timeline, objectives, and resources.',
    emoji: '🎯',
    color: '#6366F1',
    content: `<h1>Project Plan: [Project Name]</h1>\n<h2>1. Executive Summary</h2>\n<p>Brief overview of what the project aims to achieve.</p>\n<h2>2. Objectives & Key Results (OKRs)</h2>\n<ul>\n  <li><strong>Objective 1:</strong> Description</li>\n</ul>\n<h2>3. Timeline & Deliverables</h2>\n<p>Detail team members, tools, and budget allocations.</p>`,
  },
  {
    id: 'prd',
    name: 'Product Requirements',
    description: 'Goals, User Stories, and Scope (PRD).',
    emoji: '🖥️',
    color: '#A855F7',
    content: `<h1>Product Requirements Document (PRD)</h1>\n<h2>1. Overview & Goals</h2>\n<p>What are we building and why?</p>\n<h2>2. Target Audience</h2>\n<p>Who is this for?</p>\n<h2>3. User Stories</h2>\n<ul>\n  <li>As a [user type], I want to [action] so that [benefit].</li>\n</ul>\n<h2>4. Out of Scope</h2>\n<p>What are we explicitly NOT doing?</p>`,
  },
  {
    id: 'retrospective',
    name: 'Retrospective',
    description: 'General reflection on recent team performance.',
    emoji: '📈',
    color: '#F59E0B',
    content: `<h1>Team Retrospective</h1>\n<h2>What went well?</h2>\n<ul>\n  <li>Point 1</li>\n</ul>\n<h2>What didn't go well?</h2>\n<ul>\n  <li>Point 1</li>\n</ul>\n<h2>What can we improve?</h2>\n<ul>\n  <li>Point 1</li>\n</ul>`,
  },
  {
    id: 'sprint-retro',
    name: 'Sprint Retrospective',
    emoji: '⏰',
    color: '#F97316',
    description: 'Agile reflection focused specifically on the last sprint.',
    content: `<h1>Sprint Retrospective: [Sprint Name/Number]</h1>\n<h2>Sprint Goal Review</h2>\n<p>Did we meet our sprint goal? Yes/No, because...</p>\n<h2>Start / Stop / Continue</h2>\n<p><strong>Start:</strong> ...<br/><strong>Stop:</strong> ...<br/><strong>Continue:</strong> ...</p>`,
  },
  {
    id: 'knowledge-base',
    name: 'Knowledge Base Article',
    emoji: '📖',
    color: '#10B981',
    description: 'Tutorials, guides, and step-by-step instructions.',
    content: `<h1>How to [Action/Topic]</h1>\n<h2>Overview</h2>\n<p>Brief description of what this article covers and who it is for.</p>\n<h2>Step-by-Step Instructions</h2>\n<ol>\n  <li><strong>Step 1:</strong> Do the first thing.</li>\n</ol>`,
  },
  {
    id: 'bug-report',
    name: 'Bug Report',
    emoji: '🪲',
    color: '#EF4444',
    description: 'Standardized format for reproducing and tracking bugs.',
    content: `<h1>Bug Report: [Short Description]</h1>\n<h2>1. Description</h2>\n<p>A clear and concise description of what the bug is.</p>\n<h2>2. Steps to Reproduce</h2>\n<ol>\n  <li>Go to '...'</li>\n  <li>Click on '...'</li>\n</ol>`,
  },
];

// Helper to strip HTML tags for cleaner mobile display/editing
function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<h1[^>]*>/g, '# ')
    .replace(/<\/h1>/g, '\n\n')
    .replace(/<h2[^>]*>/g, '## ')
    .replace(/<\/h2>/g, '\n\n')
    .replace(/<h3[^>]*>/g, '### ')
    .replace(/<\/h3>/g, '\n\n')
    .replace(/<p[^>]*>/g, '')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<li[^>]*>/g, '• ')
    .replace(/<\/li>/g, '\n')
    .replace(/<ul[^>]*>/g, '')
    .replace(/<\/ul>/g, '\n')
    .replace(/<ol[^>]*>/g, '')
    .replace(/<\/ol>/g, '\n')
    .replace(/<strong[^>]*>/g, '**')
    .replace(/<\/strong>/g, '**')
    .replace(/<[^>]*>/g, '') // remove any leftover tags
    .replace(/\n{3,}/g, '\n\n') // collapse multiple blank lines
    .trim();
}

function toHtml(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const htmlLines = lines.map(line => {
    let formatted = line;
    if (formatted.startsWith('# ')) {
      return `<h1>${formatted.substring(2)}</h1>`;
    }
    if (formatted.startsWith('## ')) {
      return `<h2>${formatted.substring(3)}</h2>`;
    }
    if (formatted.startsWith('### ')) {
      return `<h3>${formatted.substring(4)}</h3>`;
    }
    if (formatted.startsWith('• ') || formatted.startsWith('- ')) {
      return `<li>${formatted.substring(2)}</li>`;
    }
    if (formatted.trim() === '') return '';
    return `<p>${formatted}</p>`;
  });
  return htmlLines.filter(l => l !== '').join('\n');
}

// ── Micro-interaction Components ─────────────────────────────────────────────

// Minimal Spring Animation on Touch
function SpringTouchable({
  onPress,
  children,
  style,
  activeOpacity = 1,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  activeOpacity?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      tension: 600,
      friction: 12,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 400,
      friction: 15,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={activeOpacity}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Minimal mount staggered animation
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 320, delay, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(ty, { toValue: 0, delay, useNativeDriver: Platform.OS !== 'web', tension: 200, friction: 18 }),
    ]).start();
  }, [delay]);
  return <Animated.View style={{ opacity: op, transform: [{ translateY: ty }] }}>{children}</Animated.View>;
}

// Custom Glass Card component (frosted & glowing border)
function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[gs.card, style]}>
      <View style={gs.glassClip}>
        <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(255,255,255,0.75)', 'rgba(255,255,255,0.35)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <View style={gs.cardContent}>{children}</View>
    </View>
  );
}

const gs = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    ...Platform.select({
      ios: { shadowColor: '#155DFC', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16 },
      android: { elevation: 2 },
    }),
  },
  glassClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});

// ── Icons ────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={11} cy={11} r={8} />
      <Path d="m21 21-4.3-4.3" />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14M12 5v14" />
    </Svg>
  );
}

function BackIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5M12 5l-7 7 7 7" />
    </Svg>
  );
}

function StarIcon({ filled, color = '#F59E0B' }: { filled: boolean; color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
    </Svg>
  );
}

function FileIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#155DFC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <Path d="M14 2v6h6" />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

// ── Main Screen Component ────────────────────────────────────────────────────
export default function MobilePagesScreen({
  projectId,
  projectName,
  topOffset = 0,
}: {
  projectId: number;
  projectName?: string;
  topOffset?: number;
}) {
  const [view, setView] = useState<'list' | 'template_selector' | 'editor'>('list');
  const [activeTab, setActiveTab] = useState<'all' | 'starred'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPage, setSelectedPage] = useState<PageItem | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const editorStateRef = useRef({ title: '', content: '', id: '' as string | number });
  editorStateRef.current = {
    title: editorTitle,
    content: editorContent,
    id: selectedPage?.id ?? '',
  };

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/projects/${projectId}/pages`);
      const items = (res.data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        isStarred: false,
      }));
      setPages(items);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleOpenPage = async (pageId: string | number) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/api/pages/${pageId}`);
      const pageData: PageItem = {
        id: res.data.id,
        title: res.data.title,
        content: cleanHtml(res.data.content || ''),
        isStarred: pages.find(p => p.id === pageId)?.isStarred || false,
      };
      setSelectedPage(pageData);
      setEditorTitle(pageData.title);
      setEditorContent(pageData.content || '');
      setSaveStatus('idle');
      setView('editor');
    } catch (err) {
      Alert.alert('Error', 'Could not open document. Please try again.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleStar = async (page: PageItem) => {
    const updatedStarred = !page.isStarred;
    setPages(prev => prev.map(p => p.id === page.id ? { ...p, isStarred: updatedStarred } : p));
    if (selectedPage && selectedPage.id === page.id) {
      setSelectedPage(prev => prev ? { ...prev, isStarred: updatedStarred } : null);
    }
  };

  const handlePublishPage = async () => {
    if (!editorTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the document.');
      return;
    }
    setSaveStatus('saving');
    try {
      const htmlContent = toHtml(editorContent);
      const res = await api.post(`/api/projects/${projectId}/pages`, {
        title: editorTitle,
        content: htmlContent,
      });

      const newPage: PageItem = {
        id: res.data.id,
        title: res.data.title,
        content: cleanHtml(res.data.content || ''),
        isStarred: false,
      };

      setPages(prev => [...prev, newPage]);
      setSelectedPage(newPage);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      setView('list');
      fetchPages();
    } catch (err) {
      setSaveStatus('error');
      Alert.alert('Error', 'Failed to publish document.');
    }
  };

  useEffect(() => {
    if (view !== 'editor' || !selectedPage || selectedPage.id === 'new') return;

    const hasChanges = editorTitle !== selectedPage.title || editorContent !== (selectedPage.content || '');
    if (!hasChanges) return;

    setSaveStatus('saving');
    const delayTimer = setTimeout(async () => {
      const currentRef = editorStateRef.current;
      try {
        const html = toHtml(currentRef.content);
        await api.put(`/api/pages/${currentRef.id}`, {
          title: currentRef.title,
          content: html,
        });
        
        setPages(prev => prev.map(p => p.id === currentRef.id ? { ...p, title: currentRef.title } : p));
        setSelectedPage(prev => prev ? { ...prev, title: currentRef.title, content: currentRef.content } : null);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (err) {
        setSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(delayTimer);
  }, [editorTitle, editorContent, view, selectedPage]);

  const handleManualSave = async () => {
    if (selectedPage?.id === 'new') {
      await handlePublishPage();
      return;
    }
    if (!selectedPage) return;
    
    setSaveStatus('saving');
    try {
      const html = toHtml(editorContent);
      await api.put(`/api/pages/${selectedPage.id}`, {
        title: editorTitle,
        content: html,
      });
      setPages(prev => prev.map(p => p.id === selectedPage.id ? { ...p, title: editorTitle } : p));
      setSelectedPage(prev => prev ? { ...prev, title: editorTitle, content: editorContent } : null);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (err) {
      setSaveStatus('error');
      Alert.alert('Error', 'Failed to save changes.');
    }
  };

  const handleDeletePage = () => {
    if (!selectedPage) return;
    if (selectedPage.id === 'new') {
      setView('list');
      setSelectedPage(null);
      return;
    }

    Alert.alert(
      'Delete Document',
      `Are you sure you want to permanently delete "${editorTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/pages/${selectedPage.id}`);
              setPages(prev => prev.filter(p => p.id !== selectedPage.id));
              setView('list');
              setSelectedPage(null);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete page.');
            }
          },
        },
      ]
    );
  };

  const handleSelectTemplate = (template: Template) => {
    const draftPage: PageItem = {
      id: 'new',
      title: template.id === 'blank' ? 'Untitled Page' : template.name,
      content: cleanHtml(template.content),
      isStarred: false,
    };
    setSelectedPage(draftPage);
    setEditorTitle(draftPage.title);
    setEditorContent(draftPage.content || '');
    setSaveStatus('idle');
    setView('editor');
  };

  const filteredPages = pages.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'starred') return p.isStarred;
    return true;
  });

  // ── Render Helpers ─────────────────────────────────────────────────────────

  // 1. Pages Tree/Flat List View
  const renderListView = () => {
    return (
      <View style={s.fullFlex}>
        {/* Search Bar + Create Action row */}
        <View style={s.searchContainer}>
          <View style={s.searchWrapper}>
            <SearchIcon />
            <TextInput
              style={s.searchInput}
              placeholder="Search project documents..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>
          <SpringTouchable
            style={s.plusBtn}
            onPress={() => setView('template_selector')}
          >
            <PlusIcon />
          </SpringTouchable>
        </View>

        {/* Tab row */}
        <View style={s.tabRow}>
          <SpringTouchable
            style={[s.tabBtn, activeTab === 'all' && s.tabBtnActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[s.tabText, activeTab === 'all' && s.tabTextActive]}>All Pages</Text>
          </SpringTouchable>
          <SpringTouchable
            style={[s.tabBtn, activeTab === 'starred' && s.tabBtnActive]}
            onPress={() => setActiveTab('starred')}
          >
            <Text style={[s.tabText, activeTab === 'starred' && s.tabTextActive]}>Starred</Text>
          </SpringTouchable>
        </View>

        {/* List items */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={T.primary} />
            <Text style={s.loadingText}>Loading pages...</Text>
          </View>
        ) : filteredPages.length === 0 ? (
          <View style={s.emptyContainer}>
            <Text style={s.emptyEmoji}>📄</Text>
            <Text style={s.emptyTitle}>
              {searchQuery ? 'No matching pages' : 'No documents yet'}
            </Text>
            <Text style={s.emptySub}>
              {searchQuery
                ? 'Try editing your keywords to search again.'
                : 'Create documents to plan, design, or organize your team work.'}
            </Text>
            {!searchQuery && (
              <SpringTouchable
                style={s.createFirstBtn}
                onPress={() => setView('template_selector')}
              >
                <Text style={s.createFirstText}>Create First Page</Text>
              </SpringTouchable>
            )}
          </View>
        ) : (
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <GlassCard>
              {filteredPages.map((page, idx) => {
                const isLast = idx === filteredPages.length - 1;
                return (
                  <FadeIn key={page.id} delay={idx * 40}>
                    <SpringTouchable
                      style={[s.pageItemRow, !isLast && s.borderBottom]}
                      onPress={() => handleOpenPage(page.id)}
                    >
                      <View style={s.pageItemLeft}>
                        <FileIcon />
                        <Text style={s.pageItemTitle} numberOfLines={1}>
                          {page.title}
                        </Text>
                      </View>
                      <View style={s.pageItemActions}>
                        <SpringTouchable
                          style={s.itemStarBtn}
                          onPress={() => handleToggleStar(page)}
                        >
                          <StarIcon filled={!!page.isStarred} color={page.isStarred ? '#F59E0B' : '#CBD5E1'} />
                        </SpringTouchable>
                      </View>
                    </SpringTouchable>
                  </FadeIn>
                );
              })}
            </GlassCard>
          </ScrollView>
        )}
      </View>
    );
  };

  // 2. Templates Picker Grid View
  const renderTemplateSelector = () => {
    return (
      <View style={s.fullFlex}>
        {/* Back navigation */}
        <View style={s.editorHeader}>
          <SpringTouchable
            style={s.headerBackBtn}
            onPress={() => setView('list')}
          >
            <BackIcon />
          </SpringTouchable>
          <Text style={s.editorHeaderTitle}>Select Template</Text>
          <View style={s.headerBackBtnPlaceholder} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.templatesGrid}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.templatesHeader}>Create a new page</Text>
          <Text style={s.templatesSub}>Choose a template to get started quickly or start from scratch.</Text>

          {PREDEFINED_TEMPLATES.map((tmpl, idx) => (
            <FadeIn key={tmpl.id} delay={idx * 30}>
              <SpringTouchable
                onPress={() => handleSelectTemplate(tmpl)}
              >
                <GlassCard style={s.templateCardWrapper}>
                  <View style={s.templateInnerRow}>
                    <View style={[s.templateEmojiContainer, { backgroundColor: tmpl.color + '1A' }]}>
                      <Text style={s.templateEmoji}>{tmpl.emoji}</Text>
                    </View>
                    <View style={s.templateTextContainer}>
                      <Text style={s.templateTitle}>{tmpl.name}</Text>
                      <Text style={s.templateDesc} numberOfLines={2}>
                        {tmpl.description}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </SpringTouchable>
            </FadeIn>
          ))}
        </ScrollView>
      </View>
    );
  };

  // 3. Document Editor/Detail Editor View
  const renderEditor = () => {
    const isNew = selectedPage?.id === 'new';

    return (
      <KeyboardAvoidingView
        style={s.fullFlex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
      >
        {/* Editor custom Header */}
        <View style={s.editorHeader}>
          <SpringTouchable
            style={s.headerBackBtn}
            onPress={() => {
              setView('list');
              setSelectedPage(null);
            }}
          >
            <BackIcon />
          </SpringTouchable>

          {/* Title Syncing indicators */}
          <View style={s.saveIndicatorContainer}>
            {saveStatus === 'saving' && (
              <View style={s.saveStatusBadge}>
                <ActivityIndicator size="small" color={T.primary} style={s.spinnerMini} />
                <Text style={s.saveTextMini}>Saving...</Text>
              </View>
            )}
            {saveStatus === 'saved' && (
              <View style={s.saveStatusBadge}>
                <CheckIcon />
                <Text style={[s.saveTextMini, { color: '#10B981' }]}>Saved</Text>
              </View>
            )}
            {saveStatus === 'error' && (
              <View style={s.saveStatusBadge}>
                <Text style={[s.saveTextMini, { color: '#EF4444' }]}>Save Failed</Text>
              </View>
            )}
            {saveStatus === 'idle' && (
              <Text style={s.editorHeaderSubTitle}>Autosaving edits</Text>
            )}
          </View>

          {/* Action Row: Delete, Star, Save/Publish */}
          <View style={s.editorActionsRow}>
            {isNew ? (
              <SpringTouchable
                style={s.publishBtn}
                onPress={handlePublishPage}
              >
                <Text style={s.publishBtnText}>Publish</Text>
              </SpringTouchable>
            ) : (
              <>
                <SpringTouchable
                  style={s.editorStarBtn}
                  onPress={() => selectedPage && handleToggleStar(selectedPage)}
                >
                  <StarIcon
                    filled={!!selectedPage?.isStarred}
                    color={selectedPage?.isStarred ? '#F59E0B' : '#64748B'}
                  />
                </SpringTouchable>

                <SpringTouchable
                  style={s.editorSaveBtn}
                  onPress={handleManualSave}
                >
                  <Text style={s.manualSaveText}>Save</Text>
                </SpringTouchable>

                <SpringTouchable
                  style={s.editorTrashBtn}
                  onPress={handleDeletePage}
                >
                  <TrashIcon />
                </SpringTouchable>
              </>
            )}
          </View>
        </View>

        {/* Editing Canvas */}
        <ScrollView
          style={s.editorCanvas}
          contentContainerStyle={s.editorCanvasContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={s.titleInput}
            value={editorTitle}
            onChangeText={setEditorTitle}
            placeholder="Document Title..."
            placeholderTextColor="#CBD5E1"
            maxLength={100}
          />
          <View style={s.dividerLine} />

          <TextInput
            style={s.contentInput}
            value={editorContent}
            onChangeText={setEditorContent}
            placeholder="Start writing or use structured markdown patterns..."
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <LinearGradient
      colors={['#F4F7FF', '#F9FAFB', '#FEF5FD']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.container, { paddingTop: topOffset }]}
    >
      {loadingDetail && (
        <View style={s.detailLoader}>
          <ActivityIndicator size="large" color={T.primary} />
          <Text style={s.loaderText}>Fetching document details...</Text>
        </View>
      )}

      {view === 'list' && renderListView()}
      {view === 'template_selector' && renderTemplateSelector()}
      {view === 'editor' && renderEditor()}
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullFlex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(21,93,252,0.06)',
  },

  // 1. List / Navigation Bar styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    ...Platform.select({
      ios: { shadowColor: '#155DFC', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A2E',
    fontWeight: '600',
    padding: 0,
  },
  plusBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#155DFC', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },

  // Tab bars
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(21, 93, 252, 0.08)',
    borderColor: 'rgba(21, 93, 252, 0.2)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: T.primary,
  },

  // Document List Rows
  pageItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    height: 52,
  },
  pageItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
    flex: 1,
  },
  pageItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemStarBtn: {
    padding: 6,
  },

  // Empty List
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createFirstBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: T.primary,
  },
  createFirstText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // 2. Templates Picker View
  templatesGrid: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  templatesHeader: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A2E',
    marginBottom: 6,
    letterSpacing: -0.6,
  },
  templatesSub: {
    fontSize: 13.5,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 24,
  },
  templateCardWrapper: {
    marginBottom: 12,
  },
  templateInnerRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    gap: 16,
  },
  templateEmojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateEmoji: {
    fontSize: 24,
  },
  templateTextContainer: {
    flex: 1,
    gap: 3,
  },
  templateTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  templateDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },

  // 3. Editor View
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.85)',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: { shadowColor: '#155DFC', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(241,245,249,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackBtnPlaceholder: {
    width: 36,
  },
  editorHeaderTitle: {
    fontSize: 15,
    fontWeight: '850',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  saveIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  saveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  spinnerMini: {
    transform: [{ scale: 0.7 }],
  },
  saveTextMini: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  editorHeaderSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  editorActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  publishBtn: {
    backgroundColor: T.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
  },
  editorStarBtn: {
    padding: 6,
  },
  editorSaveBtn: {
    backgroundColor: T.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  manualSaveText: {
    color: T.primary,
    fontSize: 11.5,
    fontWeight: '800',
  },
  editorTrashBtn: {
    padding: 6,
  },

  // Editor body canvas
  editorCanvas: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  editorCanvasContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A2E',
    padding: 0,
    minHeight: 40,
    lineHeight: 28,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  contentInput: {
    fontSize: 14.5,
    color: '#334155',
    lineHeight: 23,
    padding: 0,
    minHeight: SH - 260,
  },

  // Detail blocker loader
  detailLoader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: T.primary,
  },
});
