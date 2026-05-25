import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/src/constants/colors';
import { QUICK_REACTIONS } from '@/src/hooks/chat/chatUtils';

interface QuickReactionBarProps {
  visible: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  anchorY?: number;
  isMe?: boolean;
}

type QuickReactionBarRuntimeProps = QuickReactionBarProps & {
  selectedEmoji?: string;
  selectedReaction?: string;
  currentReaction?: string;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 328);
const MIN_TOP = 60;
const CARD_HEIGHT_ESTIMATE = 248;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function QuickReactionBar({
  visible,
  onClose,
  onReact,
  onReply,
  onEdit,
  onDelete,
  anchorY,
  isMe = false,
  selectedEmoji,
  selectedReaction,
  currentReaction,
}: QuickReactionBarRuntimeProps) {
  const [mounted, setMounted] = useState(visible);
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const actionCount = 1 + (onEdit ? 1 : 0) + (onDelete ? 1 : 0);
  const activeReaction = selectedEmoji ?? selectedReaction ?? currentReaction;

  const cardTop = useMemo(
    () => clamp(
      (anchorY ?? SCREEN_HEIGHT / 2) - 118,
      MIN_TOP,
      Math.max(MIN_TOP, SCREEN_HEIGHT - CARD_HEIGHT_ESTIMATE),
    ),
    [anchorY],
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      scale.value = 0.85;
      opacity.value = 0;
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
      opacity.value = withSpring(1, { damping: 14, stiffness: 200 });
    } else if (mounted) {
      scale.value = withSpring(0.85, { damping: 14, stiffness: 200 });
      opacity.value = withSpring(0, { damping: 14, stiffness: 200 }, finished => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [mounted, opacity, scale, visible]);

  const animatedFadeIn = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const closeWithAnimation = () => {
    scale.value = withSpring(0.85, { damping: 14, stiffness: 200 });
    opacity.value = withSpring(0, { damping: 14, stiffness: 200 }, finished => {
      if (finished) runOnJS(onClose)();
    });
  };

  const handleReact = (emoji: string) => {
    onReact(emoji);
    closeWithAnimation();
  };

  const handleAction = (action: () => void) => {
    action();
    closeWithAnimation();
  };

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={closeWithAnimation}>
      <Animated.View style={[styles.overlay, animatedFadeIn]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeWithAnimation} />
        <Animated.View
          style={[
            styles.card,
            isMe ? styles.cardRight : styles.cardLeft,
            { top: cardTop },
            menuAnimatedStyle,
          ]}
        >
          <View style={styles.emojiStrip}>
            {QUICK_REACTIONS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                activeOpacity={0.75}
                style={[styles.emojiButton, activeReaction === emoji && styles.emojiSelected]}
                onPress={() => handleReact(emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionList}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[styles.actionRow, actionCount === 1 && styles.lastActionRow]}
              onPress={() => handleAction(onReply)}
            >
              <View style={styles.actionIconWell}>
                <Ionicons name="return-down-back-outline" size={18} color={Colors.textPrimary} />
              </View>
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>

            {onEdit && (
              <TouchableOpacity
                activeOpacity={0.75}
                style={[styles.actionRow, !onDelete && styles.lastActionRow]}
                onPress={() => handleAction(onEdit)}
              >
                <View style={styles.actionIconWell}>
                  <Ionicons name="create-outline" size={18} color={Colors.textPrimary} />
                </View>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
            )}

            {onDelete && (
              <TouchableOpacity
                activeOpacity={0.75}
                style={[styles.actionRow, styles.lastActionRow]}
                onPress={() => handleAction(onDelete)}
              >
                <View style={[styles.actionIconWell, styles.deleteIconWell]}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </View>
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000033',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 12,
    overflow: 'hidden',
  },
  cardLeft: {
    left: 16,
  },
  cardRight: {
    right: 16,
  },
  emojiStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.chatDivider,
  },
  emojiButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  emojiSelected: {
    backgroundColor: '#EFF6FF',
    transform: [{ scale: 1.2 }],
  },
  emoji: {
    fontSize: 23,
  },
  actionList: {
    backgroundColor: Colors.cardBg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.chatDivider,
  },
  actionIconWell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.pageBg,
  },
  deleteIconWell: {
    backgroundColor: Colors.errorRedBg,
  },
  lastActionRow: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  deleteText: {
    color: '#DC2626',
  },
});
