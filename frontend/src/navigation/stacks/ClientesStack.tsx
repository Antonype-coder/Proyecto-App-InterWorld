import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ClientesListScreen from '@screens/clientes/ClientesListScreen';
import ClienteFormScreen from '@screens/clientes/ClienteFormScreen';
import ClienteEstadoCuentaScreen from '@screens/clientes/ClienteEstadoCuentaScreen';
import type { ClientesStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<ClientesStackParamList>();

export default function ClientesStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientesList" component={ClientesListScreen} />
      <Stack.Screen name="ClienteForm" component={ClienteFormScreen} />
      <Stack.Screen
        name="ClienteEstadoCuenta"
        component={ClienteEstadoCuentaScreen}
      />
    </Stack.Navigator>
  );
}