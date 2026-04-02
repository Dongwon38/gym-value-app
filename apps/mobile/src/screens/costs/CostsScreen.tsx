import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function CostsScreen() {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Costs</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Membership fees and add-ons will be managed here.
        </Text>
        <Text style={styles.body}>
          Cost item CRUD, tax defaults, and cadence-aware inputs will connect in
          the next tasks.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  eyebrow: {
    marginBottom: 10,
    color: '#6F6455',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    marginBottom: 12,
    color: '#1F1A14',
    fontSize: 31,
    fontWeight: '700',
    lineHeight: 38,
  },
  body: {
    color: '#4C4337',
    fontSize: 16,
    lineHeight: 24,
  },
});
