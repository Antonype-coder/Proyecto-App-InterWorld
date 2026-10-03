import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DashboardScreen from '@screens/dashboard/DashboardScreen';
import type { DashboardStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}