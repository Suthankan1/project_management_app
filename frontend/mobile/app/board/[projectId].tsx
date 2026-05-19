import { useLocalSearchParams, useRouter } from 'expo-router';
import { TouchableOpacity, View, StyleSheet, Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import ProjectBoardScreen from '../../src/components/board/ProjectBoardScreen';

export default function BoardRoute() {
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Validate projectId
  const validProjectId = projectId ? Number(projectId) : null;
  const isValidId = validProjectId && !isNaN(validProjectId) && validProjectId > 0;

  if (!isValidId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
        <TouchableOpacity 
          style={[styles.backBtn, { position: 'absolute', top: insets.top + 20, left: 20 }]} 
          onPress={() => router.back()} 
          activeOpacity={0.8}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 5l-7 7 7 7" />
          </Svg>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 8 }}>Invalid Project</Text>
        <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20 }}>
          The project could not be loaded. Please select a project from the dashboard.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#155DFC', borderRadius: 8 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.backRow, { top: insets.top + 4 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 5l-7 7 7 7" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ProjectBoardScreen
        projectId={validProjectId}
        projectName={projectName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backRow: {
    position: 'absolute',
    left: 16,
    zIndex: 50,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
});