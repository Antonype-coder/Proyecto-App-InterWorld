import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '@theme/index';

interface AppScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
  bg?: string;
  style?: ViewStyle;
}

export default function AppScreen({
  children,
  edges = ['top'],
  bg = colors.bg,
  style,
}: AppScreenProps): React.ReactElement {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={edges}>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
});