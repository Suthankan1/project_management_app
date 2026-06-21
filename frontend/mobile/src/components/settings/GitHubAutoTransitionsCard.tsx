import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { T } from '../../constants/tokens';
import {
  GithubAutomationAction,
  GithubAutomationRule,
  GithubAutomationTrigger,
  githubAutomationService,
} from '../../services/github-automation-service';
import { getProjectGitHubRepo } from '../../services/githubMobileService';

type TemplateKey = 'prMergedDone' | 'ciFailedBug' | 'prOpenedReview';

interface QuickTemplate {
  key: TemplateKey;
  label: string;
  description: string;
  trigger: GithubAutomationTrigger;
  action: GithubAutomationAction;
}

const TEMPLATES: QuickTemplate[] = [
  {
    key: 'prMergedDone',
    label: 'Move task to Done when PR is merged',
    description: 'PR_MERGED → move the linked task to Done.',
    trigger: 'PR_MERGED',
    action: 'MOVE_TASK_TO_COLUMN',
  },
  {
    key: 'ciFailedBug',
    label: 'Create bug task when CI fails',
    description: 'CI_FAILED → create a bug task automatically.',
    trigger: 'CI_FAILED',
    action: 'CREATE_TASK',
  },
  {
    key: 'prOpenedReview',
    label: 'Move task to In Review when PR is opened',
    description: 'PR_OPENED → move the linked task to In Review.',
    trigger: 'PR_OPENED',
    action: 'MOVE_TASK_TO_COLUMN',
  },
];

function normalizeColumnName(config: Record<string, string>): string {
  return (config.targetColumnName || config.columnName || config.column || '').trim().toLowerCase();
}

function buildConfig(projectId: number, key: TemplateKey): Record<string, string> {
  if (key === 'prMergedDone') return { targetColumnName: 'Done' };
  if (key === 'prOpenedReview') return { targetColumnName: 'In Review' };
  return {
    projectId: String(projectId),
    taskTitle: 'CI failed: {workflowName} on {branch}',
    priority: 'HIGH',
    labelName: 'bug',
    labelColor: '#d73a4a',
  };
}

function matchesTemplate(rule: GithubAutomationRule, key: TemplateKey): boolean {
  switch (key) {
    case 'prMergedDone':
      return rule.trigger === 'PR_MERGED' && rule.action === 'MOVE_TASK_TO_COLUMN'
        && normalizeColumnName(rule.config) === 'done';
    case 'ciFailedBug':
      return rule.trigger === 'CI_FAILED' && rule.action === 'CREATE_TASK';
    case 'prOpenedReview':
      return rule.trigger === 'PR_OPENED' && rule.action === 'MOVE_TASK_TO_COLUMN'
        && normalizeColumnName(rule.config) === 'in review';
    default:
      return false;
  }
}

export default function GitHubAutoTransitionsCard({ projectId }: { projectId: number }) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ruleByTemplate, setRuleByTemplate] = useState<Record<TemplateKey, number | null>>({
    prMergedDone: null,
    ciFailedBug: null,
    prOpenedReview: null,
  });
  const [busy, setBusy] = useState<Record<TemplateKey, boolean>>({
    prMergedDone: false,
    ciFailedBug: false,
    prOpenedReview: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [connection, rules] = await Promise.all([
        getProjectGitHubRepo(String(projectId)),
        githubAutomationService.getRules(projectId).catch(() => [] as GithubAutomationRule[]),
      ]);
      setConnected(Boolean(connection?.repoFullName));

      const next: Record<TemplateKey, number | null> = {
        prMergedDone: null,
        ciFailedBug: null,
        prOpenedReview: null,
      };
      (Object.keys(next) as TemplateKey[]).forEach((key) => {
        const match = rules.find((rule) => matchesTemplate(rule, key));
        next[key] = match ? match.id : null;
      });
      setRuleByTemplate(next);
    } catch {
      Alert.alert('Error', 'Failed to load GitHub automation');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void load(); }, [load]);

  const handleToggle = async (template: QuickTemplate) => {
    const key = template.key;
    const existing = ruleByTemplate[key];
    setBusy((prev) => ({ ...prev, [key]: true }));
    try {
      if (existing) {
        await githubAutomationService.deleteRule(projectId, existing);
        setRuleByTemplate((prev) => ({ ...prev, [key]: null }));
      } else {
        const created = await githubAutomationService.createRule(projectId, {
          trigger: template.trigger,
          action: template.action,
          config: buildConfig(projectId, key),
        });
        setRuleByTemplate((prev) => ({ ...prev, [key]: created.id }));
      }
    } catch {
      Alert.alert('Error', 'Failed to update automation rule');
    } finally {
      setBusy((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator color={T.primary} size="small" />
        <Text style={styles.loadingText}>Loading automation…</Text>
      </View>
    );
  }

  return (
    <View>
      {!connected && (
        <View style={styles.warning}>
          <MaterialCommunityIcons name="alert-outline" size={16} color="#B45309" />
          <Text style={styles.warningText}>
            No GitHub repository connected for this project. Connect one to make auto-transitions work.
          </Text>
        </View>
      )}

      <View style={{ gap: 10 }}>
        {TEMPLATES.map((template) => {
          const enabled = Boolean(ruleByTemplate[template.key]);
          const isBusy = busy[template.key];
          return (
            <View key={template.key} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{template.label}</Text>
                <Text style={styles.rowDesc}>{template.description}</Text>
              </View>
              {isBusy ? (
                <ActivityIndicator size="small" color={T.primary} style={styles.switchSlot} />
              ) : (
                <Switch
                  value={enabled}
                  onValueChange={() => handleToggle(template)}
                  disabled={!connected}
                  trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
                  thumbColor={enabled ? '#22C55E' : '#F4F4F5'}
                  style={styles.switchSlot}
                />
              )}
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.manageBtn}
        onPress={() => router.push({ pathname: '/github/[projectId]', params: { projectId: String(projectId) } })}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="github" size={16} color={T.primary} />
        <Text style={styles.manageBtnText}>Manage all GitHub rules</Text>
        <MaterialCommunityIcons name="arrow-right" size={15} color={T.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  loadingText: { color: T.textSecondary, fontSize: 13, fontWeight: '600' },

  warning: {
    flexDirection: 'row', gap: 9, alignItems: 'flex-start',
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 12, padding: 12, marginBottom: 14,
  },
  warningText: { flex: 1, fontSize: 12, lineHeight: 17, color: '#92400E' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 12, padding: 13,
  },
  rowLabel: { fontSize: 13.5, fontWeight: '700', color: T.textPrimary, lineHeight: 18 },
  rowDesc: { fontSize: 11.5, color: T.textSecondary, marginTop: 3, lineHeight: 15 },
  switchSlot: { marginLeft: 4 },

  manageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 14, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderColor: T.border, backgroundColor: T.bgSecondary,
  },
  manageBtnText: { fontSize: 13.5, fontWeight: '800', color: T.primary },
});
