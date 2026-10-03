import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CategoriasListScreen from '@screens/categorias/CategoriasListScreen';
import CategoriaFormScreen from '@screens/categorias/CategoriaFormScreen';
import type { CategoriasStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<CategoriasStackParamList>();

export default function CategoriasStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CategoriasList" component={CategoriasListScreen} />
      <Stack.Screen name="CategoriaForm" component={CategoriaFormScreen} />
    </Stack.Navigator>
  );
}
