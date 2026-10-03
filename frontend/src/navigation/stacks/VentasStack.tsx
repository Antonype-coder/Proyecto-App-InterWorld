import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import VentasListScreen from '@screens/ventas/VentasListScreen';
import VentaDetalleScreen from '@screens/ventas/VentaDetalleScreen';
import DevolucionFormScreen from '@screens/devoluciones/DevolucionFormScreen';
import DevolucionDetalleScreen from '@screens/devoluciones/DevolucionDetalleScreen';
import type { VentasStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<VentasStackParamList>();

export default function VentasStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VentasList" component={VentasListScreen} />
      <Stack.Screen name="VentaDetalle" component={VentaDetalleScreen} />
      <Stack.Screen name="DevolucionForm" component={DevolucionFormScreen} />
      <Stack.Screen name="DevolucionDetalle" component={DevolucionDetalleScreen} />
    </Stack.Navigator>
  );
}