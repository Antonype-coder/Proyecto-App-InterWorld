import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import UsuariosScreen from '@screens/usuarios/UsuariosScreen';
import { UsuarioFormScreen } from '@screens/usuarios/UsuarioFormScreen';
import { UsuarioDetalleScreen } from '@screens/usuarios/UsuarioDetalleScreen';
import type { UsuariosStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<UsuariosStackParamList>();

export default function UsuariosStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UsuariosList" component={UsuariosScreen} />
      <Stack.Screen
        name="UsuarioForm"
        component={UsuarioFormScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="UsuarioDetalle"
        component={UsuarioDetalleScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}