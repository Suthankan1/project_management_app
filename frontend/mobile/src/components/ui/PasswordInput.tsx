import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  TextInput,
} from 'react-native';
import TextInputField from './TextInputField';
import { Colors } from '../../constants/colors';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send';
  onSubmitEditing?: () => void;
  errorText?: string;
  showToggle?: boolean;
  textContentType?: string;
  inputRef?: React.RefObject<TextInput>;
};

export default function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder,
  returnKeyType,
  onSubmitEditing,
  errorText,
  showToggle = true,
  textContentType = 'password',
  inputRef,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View>
      <TextInputField
        inputRef={inputRef}
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        errorText={errorText}
        textContentType={textContentType}
        right={
          showToggle ? (
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.toggle}>
              <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    paddingHorizontal: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
