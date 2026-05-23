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
  Animated,
  Linking,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../api/axios';
import { T } from '../../constants/tokens';
import SpringTouchable from '../ui/SpringTouchable';
import FadeIn from '../ui/FadeIn';
import { getFileIcon } from '../ui/FileIcon';

const { width: SW } = Dimensions.get('window');

// ── Types ────────────────────────────────────────────────────────────────────

interface DocFolder {
  id: number;
  name: string;
  parentFolderId?: number | null;
  documentCount?: number;
}

interface DocItem {
  id: number;
  name: string;
  contentType?: string;
  fileSizeBytes?: number;
  createdAt?: string;
  uploadedBy?: string;
  folderId?: number | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


// ── Micro-animations ──────────────────────────────────────────────────────────




// ── Glass Card ────────────────────────────────────────────────────────────────

function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
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
      ios: {
        shadowColor: '#155DFC',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
      },
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

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <Svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#94A3B8"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={11} cy={11} r={8} />
      <Path d="m21 21-4.3-4.3" />
    </Svg>
  );
}

function UploadIcon() {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.primary}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Path d="m17 8-5-5-5 5" />
      <Path d="M12 3v12" />
    </Svg>
  );
}

function FolderIcon({ color = '#F59E0B' }: { color?: string }) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill={color + '30'}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

function BackIcon() {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0F172A"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M19 12H5M12 5l-7 7 7 7" />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.primary}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M5 12h14M12 5v14" />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#EF4444"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
    </Svg>
  );
}

function DownloadIcon() {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.primary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Path d="m7 10 5 5 5-5" />
      <Path d="M12 15V3" />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#CBD5E1"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

function NewFolderIcon() {
  return (
    <Svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.primary}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <Path d="M12 11v6M9 14h6" />
    </Svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MobileDocsScreen({
  projectId,
  projectName,
  topOffset = 0,
}: {
  projectId: number;
  projectName?: string;
  topOffset?: number;
}) {
  // View state
  const [view, setView] = useState<'explorer' | 'create_folder'>('explorer');

  // Data
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [activeFolderName, setActiveFolderName] = useState<string>('');

  // UI State
  const [activeTab, setActiveTab] = useState<'all' | 'folders'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create folder form
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const res = await api.get(`/api/projects/${projectId}/folders`);
      setFolders(res.data || []);
    } catch {
      setError('Failed to load folders.');
    } finally {
      setLoadingFolders(false);
    }
  }, [projectId]);

  const fetchDocuments = useCallback(
    async (folderId: number | null) => {
      setLoadingDocs(true);
      setError(null);
      try {
        const params: any = {};
        if (folderId !== null) params.folderId = folderId;
        const res = await api.get(`/api/projects/${projectId}/documents`, { params });
        setDocuments(res.data || []);
      } catch {
        setError('Failed to load documents.');
      } finally {
        setLoadingDocs(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    fetchFolders();
    fetchDocuments(null);
  }, [fetchFolders, fetchDocuments]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleOpenFolder = (folder: DocFolder) => {
    setActiveFolderId(folder.id);
    setActiveFolderName(folder.name);
    setSearchQuery('');
    fetchDocuments(folder.id);
  };

  const handleBackToRoot = () => {
    setActiveFolderId(null);
    setActiveFolderName('');
    setSearchQuery('');
    fetchDocuments(null);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Validation', 'Please enter a folder name.');
      return;
    }
    setCreatingFolder(true);
    try {
      await api.post(`/api/projects/${projectId}/folders`, {
        name: newFolderName.trim(),
        parentFolderId: null,
      });
      setNewFolderName('');
      setView('explorer');
      await fetchFolders();
    } catch {
      Alert.alert('Error', 'Failed to create folder.');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = (folder: DocFolder) => {
    Alert.alert(
      'Delete Folder',
      `Delete "${folder.name}" and all its contents?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/projects/${projectId}/folders/${folder.id}`);
              await fetchFolders();
              if (activeFolderId === folder.id) {
                handleBackToRoot();
              }
            } catch {
              Alert.alert('Error', 'Failed to delete folder.');
            }
          },
        },
      ]
    );
  };

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setUploading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
      } as any);

      if (activeFolderId !== null) {
        formData.append('folderId', String(activeFolderId));
      }

      await api.post(`/api/projects/${projectId}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await fetchDocuments(activeFolderId);
    } catch (err: any) {
      if (!err?.canceled) {
        Alert.alert('Upload Failed', 'Could not upload the file. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async (doc: DocItem) => {
    try {
      const res = await api.get(
        `/api/projects/${projectId}/documents/${doc.id}/download-url`
      );
      const url = res.data?.downloadUrl;
      if (url) {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert('Error', 'Could not get the download link.');
    }
  };

  const handleDeleteDocument = (doc: DocItem) => {
    Alert.alert(
      'Delete File',
      `Move "${doc.name}" to trash?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/projects/${projectId}/documents/${doc.id}`);
              setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
            } catch {
              Alert.alert('Error', 'Failed to delete file.');
            }
          },
        },
      ]
    );
  };

  // ── Filter ────────────────────────────────────────────────────────────────

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocs = documents.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = loadingFolders || loadingDocs;

  // ── Render: Create Folder View ────────────────────────────────────────────

  const renderCreateFolderView = () => (
    <View style={s.fullFlex}>
      <View style={s.editorHeader}>
        <SpringTouchable
          style={s.headerBackBtn}
          onPress={() => {
            setView('explorer');
            setNewFolderName('');
          }}
        >
          <BackIcon />
        </SpringTouchable>
        <Text style={s.editorHeaderTitle}>New Folder</Text>
        <View style={s.headerBackBtnPlaceholder} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingTop: 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.inputLabel}>Folder Name</Text>
        <GlassCard style={{ marginBottom: 24 }}>
          <TextInput
            style={s.folderInput}
            placeholder="e.g. Design Assets, Release Notes..."
            placeholderTextColor="#94A3B8"
            value={newFolderName}
            onChangeText={setNewFolderName}
            autoFocus
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={handleCreateFolder}
          />
        </GlassCard>

        <SpringTouchable
          style={[s.createFolderBtn, creatingFolder && { opacity: 0.6 }]}
          onPress={handleCreateFolder}
        >
          {creatingFolder ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.createFolderBtnText}>Create Folder</Text>
          )}
        </SpringTouchable>
      </ScrollView>
    </View>
  );

  // ── Render: Main Explorer View ────────────────────────────────────────────

  const renderExplorerView = () => {
    const inFolder = activeFolderId !== null;

    return (
      <View style={s.fullFlex}>
        {/* Header: Breadcrumb + Actions */}
        <View style={s.explorerHeader}>
          <View style={s.breadcrumb}>
            {inFolder ? (
              <SpringTouchable style={s.breadcrumbBack} onPress={handleBackToRoot}>
                <BackIcon />
              </SpringTouchable>
            ) : null}
            <Text style={s.breadcrumbTitle} numberOfLines={1}>
              {inFolder ? activeFolderName : 'Documents'}
            </Text>
          </View>

          <View style={s.headerActions}>
            {!inFolder && (
              <SpringTouchable
                style={s.iconBtn}
                onPress={() => setView('create_folder')}
              >
                <NewFolderIcon />
              </SpringTouchable>
            )}
            <SpringTouchable
              style={[s.iconBtn, s.uploadBtn]}
              onPress={handleUploadDocument}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={T.primary} />
              ) : (
                <UploadIcon />
              )}
            </SpringTouchable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={s.searchContainer}>
          <View style={s.searchWrapper}>
            <SearchIcon />
            <TextInput
              style={s.searchInput}
              placeholder={inFolder ? 'Search files...' : 'Search documents & folders...'}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {/* Tab row (only shown at root) */}
        {!inFolder && (
          <View style={s.tabRow}>
            <SpringTouchable
              style={[s.tabBtn, activeTab === 'all' && s.tabBtnActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[s.tabText, activeTab === 'all' && s.tabTextActive]}>
                All
              </Text>
            </SpringTouchable>
            <SpringTouchable
              style={[s.tabBtn, activeTab === 'folders' && s.tabBtnActive]}
              onPress={() => setActiveTab('folders')}
            >
              <Text
                style={[s.tabText, activeTab === 'folders' && s.tabTextActive]}
              >
                Folders
              </Text>
            </SpringTouchable>
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={T.primary} />
            <Text style={s.loadingText}>Loading...</Text>
          </View>
        ) : (
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Folders section (root only, 'all' or 'folders' tab) */}
            {!inFolder && (activeTab === 'all' || activeTab === 'folders') && (
              <>
                {filteredFolders.length > 0 && (
                  <FadeIn delay={0}>
                    <View style={s.sectionHeader}>
                      <Text style={s.sectionLabel}>FOLDERS</Text>
                      <Text style={s.sectionCount}>{filteredFolders.length}</Text>
                    </View>
                    <GlassCard style={{ marginBottom: 16 }}>
                      {filteredFolders.map((folder, idx) => {
                        const isLast = idx === filteredFolders.length - 1;
                        return (
                          <FadeIn key={folder.id} delay={idx * 30}>
                            <View style={[s.rowItem, !isLast && s.borderBottom]}>
                              <SpringTouchable
                                style={s.rowLeft}
                                onPress={() => handleOpenFolder(folder)}
                              >
                                <View style={s.folderIconWrap}>
                                  <FolderIcon color="#F59E0B" />
                                </View>
                                <View>
                                  <Text style={s.rowTitle} numberOfLines={1}>
                                    {folder.name}
                                  </Text>
                                </View>
                              </SpringTouchable>
                              <View style={s.rowRight}>
                                <SpringTouchable
                                  style={s.rowActionBtn}
                                  onPress={() => handleDeleteFolder(folder)}
                                >
                                  <TrashIcon />
                                </SpringTouchable>
                                <ChevronRightIcon />
                              </View>
                            </View>
                          </FadeIn>
                        );
                      })}
                    </GlassCard>
                  </FadeIn>
                )}
              </>
            )}

            {/* Files section */}
            {activeTab !== 'folders' && (
              <>
                {filteredDocs.length > 0 && (
                  <>
                    {!inFolder && (
                      <View style={s.sectionHeader}>
                        <Text style={s.sectionLabel}>FILES</Text>
                        <Text style={s.sectionCount}>{filteredDocs.length}</Text>
                      </View>
                    )}
                    <GlassCard style={{ marginBottom: 16 }}>
                      {filteredDocs.map((doc, idx) => {
                        const isLast = idx === filteredDocs.length - 1;
                        const { emoji, color } = getFileIcon(doc.contentType);
                        return (
                          <FadeIn
                            key={doc.id}
                            delay={(inFolder ? 0 : filteredFolders.length * 30) + idx * 30}
                          >
                            <View style={[s.rowItem, !isLast && s.borderBottom]}>
                              <View style={s.rowLeft}>
                                <View
                                  style={[
                                    s.fileEmojiWrap,
                                    { backgroundColor: color + '18' },
                                  ]}
                                >
                                  <Text style={s.fileEmoji}>{emoji}</Text>
                                </View>
                                <View style={s.fileInfo}>
                                  <Text style={s.rowTitle} numberOfLines={1}>
                                    {doc.name}
                                  </Text>
                                  <Text style={s.rowMeta}>
                                    {formatBytes(doc.fileSizeBytes)}
                                  </Text>
                                </View>
                              </View>
                              <View style={s.rowRight}>
                                <SpringTouchable
                                  style={s.rowActionBtn}
                                  onPress={() => handleDownloadDocument(doc)}
                                >
                                  <DownloadIcon />
                                </SpringTouchable>
                                <SpringTouchable
                                  style={s.rowActionBtn}
                                  onPress={() => handleDeleteDocument(doc)}
                                >
                                  <TrashIcon />
                                </SpringTouchable>
                              </View>
                            </View>
                          </FadeIn>
                        );
                      })}
                    </GlassCard>
                  </>
                )}
              </>
            )}

            {/* Empty state */}
            {filteredFolders.length === 0 && filteredDocs.length === 0 && (
              <FadeIn delay={0}>
                <View style={s.emptyContainer}>
                  <Text style={s.emptyEmoji}>
                    {inFolder ? '📂' : searchQuery ? '🔍' : '🗂️'}
                  </Text>
                  <Text style={s.emptyTitle}>
                    {searchQuery
                      ? 'No matches found'
                      : inFolder
                      ? 'This folder is empty'
                      : 'No documents yet'}
                  </Text>
                  <Text style={s.emptySub}>
                    {searchQuery
                      ? 'Try different search keywords.'
                      : inFolder
                      ? 'Upload files to this folder using the upload button above.'
                      : 'Create folders or upload files to keep your project documents organized.'}
                  </Text>
                  {!searchQuery && (
                    <View style={s.emptyActions}>
                      {!inFolder && (
                        <SpringTouchable
                          style={s.emptyBtn}
                          onPress={() => setView('create_folder')}
                        >
                          <Text style={s.emptyBtnText}>New Folder</Text>
                        </SpringTouchable>
                      )}
                      <SpringTouchable
                        style={[s.emptyBtn, s.emptyBtnPrimary]}
                        onPress={handleUploadDocument}
                      >
                        <Text style={s.emptyBtnPrimaryText}>Upload File</Text>
                      </SpringTouchable>
                    </View>
                  )}
                </View>
              </FadeIn>
            )}

            {/* Upload status pill */}
            {uploading && (
              <View style={s.uploadingBanner}>
                <ActivityIndicator size="small" color={T.primary} />
                <Text style={s.uploadingText}>Uploading file...</Text>
              </View>
            )}

            {error && (
              <View style={s.errorBanner}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  };

  // ── Root Render ───────────────────────────────────────────────────────────

  return (
    <View
      style={[
        s.container,
        { paddingTop: topOffset, backgroundColor: T.bgSecondary },
      ]}
    >
      {view === 'create_folder' ? renderCreateFolderView() : renderExplorerView()}
    </View>
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

  // ── Explorer Header
  explorerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  breadcrumbBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  breadcrumbTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: T.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtn: {
    backgroundColor: T.primaryLight,
    borderColor: T.primary + '30',
  },

  // ── Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: T.textPrimary,
    fontWeight: '500',
  },

  // ── Tab Row
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  tabBtnActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: T.textSecondary,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#fff',
  },

  // ── Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: T.textSecondary,
    letterSpacing: 1.4,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '700',
    color: T.textMuted,
    backgroundColor: T.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },

  // ── Row Items
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 62,
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: T.textPrimary,
    letterSpacing: -0.2,
    maxWidth: SW * 0.45,
  },
  rowMeta: {
    fontSize: 12,
    color: T.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  rowActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Folder & File Icons
  folderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F59E0B18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileEmojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileEmoji: {
    fontSize: 20,
  },
  fileInfo: {
    flex: 1,
  },

  // ── Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // ── States
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: T.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: T.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: T.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  emptyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1.5,
    borderColor: T.primary + '40',
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: T.primary,
  },
  emptyBtnPrimary: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  emptyBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Create Folder view
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  editorHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: T.textPrimary,
    letterSpacing: -0.2,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  headerBackBtnPlaceholder: {
    width: 40,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: T.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  folderInput: {
    fontSize: 15,
    color: T.textPrimary,
    fontWeight: '500',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  createFolderBtn: {
    backgroundColor: T.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: T.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  createFolderBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },

  // ── Banners
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: T.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: T.primary + '30',
  },
  uploadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: T.primary,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
    textAlign: 'center',
  },
});
