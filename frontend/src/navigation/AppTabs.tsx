import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, typography } from '@theme/index';
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

export default function AppTabs(): React.ReactElement {
  const insets = useSafeAreaInsets();
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

      {/* ✅ Pantalla oculta: Escáner de códigos de barras */}
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
          focused ? styles.venderButtonActive : null,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  venderButtonActive: {
    backgroundColor: colors.accent,
  },
});