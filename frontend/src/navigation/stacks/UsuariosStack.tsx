import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import UsuariosScreen from '@screens/usuarios/UsuariosScreen';
import type { UsuariosStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<UsuariosStackParamList>();

export default function UsuariosStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UsuariosList" component={UsuariosScreen} />
    </Stack.Navigator>
  );
}