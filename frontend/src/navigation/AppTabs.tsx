import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { typography } from '@theme/index';
import { useColors } from '@hooks/useColors';
import type { AppTabsParamList } from '@tipos/index';

import DashboardStack from './stacks/DashboardStack';
import ProductosStack from './stacks/ProductosStack';
import VentasStack from './stacks/VentasStack';
import MasStack from './stacks/MasStack';
import POSScreen from '@screens/ventas/POSScreen';
import ProductoScannerScreen from '@screens/ventas/ProductoScannerScreen';
import BusquedaGlobalScreen from '@screens/busqueda/BusquedaGlobalScreen';
import { useConfiguracionStore } from '@store/configuracionStore';

const Tab = createBottomTabNavigator<AppTabsParamList>();

type TabName = 'Inicio' | 'Productos' | 'Ventas' | 'Mas';

/**
 * Listener de tabPress que resetea el stack de la tab al root.
 * Usa CommonActions.reset con target al nested navigator para
 * descartar toda la pila previa (no hace push, resetea de verdad).
 */
function makeTabPressListener(tabName: TabName, rootScreen: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ navigation }: any) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tabPress: (e: any) => {
      const state = navigation.getState();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const route = state.routes.find((r: any) => r.name === tabName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nestedState = route?.state as any;
      const nestedIndex = nestedState?.index ?? 0;

      if (nestedIndex > 0 && nestedState?.key) {
        e.preventDefault();
        navigation.dispatch({
          ...CommonActions.reset({
            index: 0,
            routes: [{ name: rootScreen }],
          }),
          target: nestedState.key,
        });
      }
    },
  });
}

export default function AppTabs(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const cargarConfiguracion = useConfiguracionStore((state) => state.cargar);

  useEffect(() => {
    void cargarConfiguracion();
  }, [cargarConfiguracion]);

  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          ...typography.tiny,
          marginTop: 2,
          letterSpacing: 0.2,
        },
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardStack}
        listeners={makeTabPressListener('Inicio', 'Dashboard')}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home-variant' : 'home-variant-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Productos"
        component={ProductosStack}
        listeners={makeTabPressListener('Productos', 'ProductosList')}
        options={{
          tabBarLabel: 'Productos',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'package-variant' : 'package-variant-closed'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Vender"
        component={POSScreen}
        options={{
          tabBarLabel: () => null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tabBarButton: (props: any) => <VenderTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Ventas"
        component={VentasStack}
        listeners={makeTabPressListener('Ventas', 'VentasList')}
        options={{
          tabBarLabel: 'Ventas',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'cart' : 'cart-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Mas"
        component={MasStack}
        listeners={makeTabPressListener('Mas', 'MasHome')}
        options={{
          tabBarLabel: 'Más',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={
                focused
                  ? 'dots-horizontal-circle'
                  : 'dots-horizontal-circle-outline'
              }
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="ProductoScanner"
        component={ProductoScannerScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="BusquedaGlobal"
        component={BusquedaGlobalScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VenderTabButton(props: any): React.ReactElement {
  const colors = useColors();
  const focused = props.accessibilityState?.selected;

  return (
    <Pressable
      onPress={props.onPress}
      style={styles.venderWrapper}
      accessibilityRole="button"
      accessibilityLabel="Vender"
    >
      <View
        style={[
          styles.venderButton,
          { backgroundColor: focused ? colors.accent : colors.primary },
        ]}
      >
        <MaterialCommunityIcons
          name="cart-outline"
          size={22}
          color={colors.textInverse}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  venderWrapper: {
    top: -12,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  venderButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});