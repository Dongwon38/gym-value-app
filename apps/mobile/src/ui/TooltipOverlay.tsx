import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

type TooltipOverlayProps = {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  visible: boolean;
};

export function TooltipOverlay({
  children,
  onClose,
  title,
  visible,
}: TooltipOverlayProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <View className="flex-1 justify-center bg-black/50 px-4">
        <Pressable accessibilityRole="button" className="absolute inset-0" onPress={onClose} />
        <View className="relative z-10 max-h-[80%]">
          <Card padding="compact" shadow="floating">
            <Text className="mb-3" variant="listTitle">
              {title}
            </Text>
            <ScrollView
              className="max-h-96"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
            <Button
              className="mt-4 self-stretch"
              label="Close"
              onPress={onClose}
              variant="secondary"
            />
          </Card>
        </View>
      </View>
    </Modal>
  );
}
