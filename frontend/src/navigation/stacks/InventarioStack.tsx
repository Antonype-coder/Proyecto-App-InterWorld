import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InventarioScreen from '@screens/inventario/InventarioScreen';
import MovimientoFormScreen from '@screens/inventario/MovimientoFormScreen';
import type { InventarioStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<InventarioStackParamList>();

export default function InventarioStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InventarioList" component={InventarioScreen} />
      <Stack.Screen name="MovimientoForm" component={MovimientoFormScreen} />
    </Stack.Navigator>
  );
}