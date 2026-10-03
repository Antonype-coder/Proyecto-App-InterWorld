import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CajaScreen from '@screens/caja/CajaScreen';
import AbrirCajaScreen from '@screens/caja/AbrirCajaScreen';
import CerrarCajaScreen from '@screens/caja/CerrarCajaScreen';
import HistorialCajaScreen from '@screens/caja/HistorialCajaScreen';
import type { CajaStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<CajaStackParamList>();

export default function CajaStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CajaHome" component={CajaScreen} />
      <Stack.Screen name="AbrirCaja" component={AbrirCajaScreen} />
      <Stack.Screen name="CerrarCaja" component={CerrarCajaScreen} />
      <Stack.Screen name="CajaHistorial" component={HistorialCajaScreen} />
    </Stack.Navigator>
  );
}