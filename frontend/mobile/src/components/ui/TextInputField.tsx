import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  StyleSheet,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  TextInputProps,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { isWeb } from '../../lib/platform';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
  submitBehavior?: TextInputProps['submitBehavior'];
  editable?: boolean;
  errorText?: string;
  secureTextEntry?: boolean;
  textContentType?: string;
  autoComplete?: TextInputProps['autoComplete'];
  right?: React.ReactNode;
  inputRef?: React.RefObject<TextInput | null>;
};

export default function TextInputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  submitBehavior,
  editable = true,
  errorText,
  secureTextEntry = false,
  textContentType,
  autoComplete,
  right,
  inputRef,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const localInputRef = React.useRef<TextInput>(null);
  const resolvedInputRef = inputRef ?? localInputRef;

  const borderColor = errorText
    ? Colors.errorRed
    : isFocused
    ? Colors.primary
    : Colors.borderDefault;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => resolvedInputRef.current?.focus()}
        style={[
          styles.inputContainer,
          { borderColor },
          isFocused && styles.focusedShadow,
        ]}
      >
        <TextInput
          ref={resolvedInputRef}
          style={[styles.input, isWeb && { height: undefined }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={isWeb ? undefined : returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          submitBehavior={submitBehavior}
          editable={editable}
          secureTextEntry={secureTextEntry}
          textContentType={textContentType as never}
          autoComplete={autoComplete}
          showSoftInputOnFocus
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {right}
      </Pressable>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
  },
  focusedShadow: {
    ...Platform.select({
      web: { boxShadow: `0 0 6px ${Colors.primary}26` },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
    }),
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    height: '100%',
  },
  errorText: {
    fontSize: 12,
    color: Colors.errorRed,
    marginTop: 4,
  },
});
