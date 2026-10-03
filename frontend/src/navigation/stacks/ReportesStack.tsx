import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ReportesScreen from '@screens/reportes/ReportesScreen';
import type { ReportesStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<ReportesStackParamList>();

export default function ReportesStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReportesHome" component={ReportesScreen} />
    </Stack.Navigator>
  );
}