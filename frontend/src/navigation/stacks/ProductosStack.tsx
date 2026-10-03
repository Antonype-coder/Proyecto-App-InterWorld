import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProductosListScreen from '@screens/productos/ProductosListScreen';
import ProductoFormScreen from '@screens/productos/ProductoFormScreen';
import ProductoDetalleScreen from '@screens/productos/ProductoDetalleScreen';
import ProductoScannerScreen from '@screens/ventas/ProductoScannerScreen';
import type { ProductosStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<ProductosStackParamList>();

export default function ProductosStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductosList" component={ProductosListScreen} />
      <Stack.Screen name="ProductoForm" component={ProductoFormScreen} />
      <Stack.Screen name="ProductoDetalle" component={ProductoDetalleScreen} />
      <Stack.Screen
        name="ProductoScanner"
        component={ProductoScannerScreen}
      />
    </Stack.Navigator>
  );
}