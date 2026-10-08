import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '@screens/auth/LoginScreen';
import PinScreen from '@screens/auth/PinScreen';
import type { AuthStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Pin"
        component={PinScreen}
        options={{ animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}