import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '@screens/auth/LoginScreen';
import RegisterScreen from '@screens/auth/RegisterScreen';
import PinScreen from '@screens/auth/PinScreen';
import type { AuthStackParamList } from '@tipos/index';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Pin"
        component={PinScreen}
        options={{ animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}