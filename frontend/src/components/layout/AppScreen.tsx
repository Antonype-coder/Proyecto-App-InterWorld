import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useColors } from '@hooks/useColors';

interface AppScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
  bg?: string;
  style?: ViewStyle;
}

export default function AppScreen({
  children,
  edges = ['top'],
  bg,
  style,
}: AppScreenProps): React.ReactElement {
  const colors = useColors();
  const backgroundColor = bg ?? colors.bg;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={edges}>
      <View style={[styles.container, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
});