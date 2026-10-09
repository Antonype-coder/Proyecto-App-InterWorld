import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuthStore } from '@store/authStore';
import { useUIStore } from '@store/uiStore';
import { useColors } from '@hooks/useColors';
import { CommandPalette } from '@components/command-palette';
import { STORAGE_ONBOARDING_KEY } from '@utils/constants';
import type { RootStackParamList } from '@tipos/index';

import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import WelcomeScreen from '@screens/onboarding/WelcomeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const hydrateUI = useUIStore((s) => s.hydrate);
  const paletteOpen = useUIStore((s) => s.paletteOpen);
  const closePalette = useUIStore((s) => s.closePalette);
  const colors = useColors();

  // null = cargando, true = mostrar welcome, false = mostrar app
  const [onboarding, setOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    void hydrateUI();
  }, [hydrateUI]);

  // Al cambiar de usuario, revisamos si tiene onboarding pendiente
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setOnboarding(false);
      return;
    }

    // Mientras leemos storage, mostramos loading
    setOnboarding(null);

    (async () => {
      const flag = await AsyncStorage.getItem(STORAGE_ONBOARDING_KEY);
      if (!cancelled) setOnboarding(flag === '1');
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!initialized || onboarding === null) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : onboarding ? (
          <Stack.Screen
            name="App"
            options={{ animation: 'fade' }}
          >
            {() => <WelcomeScreen onFinish={() => setOnboarding(false)} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="App" component={AppTabs} />
        )}
      </Stack.Navigator>

      {user && !onboarding ? (
        <CommandPalette visible={paletteOpen} onClose={closePalette} />
      ) : null}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});