import React, { PropsWithChildren } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../theme';

type BottomSheetProps = PropsWithChildren<{
  footer?: React.ReactNode;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  title?: string;
  visible: boolean;
}>;

export function BottomSheet({
  children,
  footer,
  onClose,
  style,
  subtitle,
  title,
  visible,
}: BottomSheetProps) {
  const theme = useAppTheme();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />
        <SafeAreaView edges={['bottom']} style={styles.sheetSafeArea}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderTopLeftRadius: theme.radius.lg,
                borderTopRightRadius: theme.radius.lg,
              },
              style,
            ]}>
            <View
              style={[
                styles.handle,
                {
                  backgroundColor: theme.colors.border,
                  borderRadius: theme.radius.pill,
                },
              ]}
            />
            {title ? (
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {subtitle}
              </Text>
            ) : null}

            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 26, 20, 0.24)',
  },
  content: {
    gap: 12,
    paddingBottom: 12,
  },
  footer: {
    marginTop: 8,
  },
  handle: {
    alignSelf: 'center',
    height: 5,
    marginBottom: 16,
    width: 48,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopWidth: 1,
    maxHeight: '86%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sheetSafeArea: {
    justifyContent: 'flex-end',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
});
