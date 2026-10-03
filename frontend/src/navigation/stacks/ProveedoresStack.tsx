import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProveedoresListScreen from '@screens/proveedores/ProveedoresListScreen';
import ProveedorFormScreen from '@screens/proveedores/ProveedorFormScreen';
import ProveedorDetalleScreen from '@screens/proveedores/ProveedorDetalleScreen';
import type { ProveedoresStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<ProveedoresStackParamList>();

export default function ProveedoresStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProveedoresList" component={ProveedoresListScreen} />
      <Stack.Screen name="ProveedorForm" component={ProveedorFormScreen} />
      <Stack.Screen name="ProveedorDetalle" component={ProveedorDetalleScreen} />
    </Stack.Navigator>
  );
}
