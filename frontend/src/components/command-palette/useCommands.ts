import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@store/authStore';
import { useUIStore } from '@store/uiStore';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  group: 'Acciones' | 'Ir a' | 'Configuración';
  shortcut?: string;
  adminOnly?: boolean;
  run: () => void;
}

export function useCommands() {
  const navigation = useNavigation<any>();
  const esAdmin = useAuthStore((s) => s.user?.rol === 'admin');
  const setThemeMode = useUIStore((s) => s.setThemeMode);
  const showToast = useUIStore((s) => s.showToast);

  return useMemo<Command[]>(() => {
    const go = (tab: string, screen?: string, params?: object) => {
      if (screen) {
        navigation.navigate(tab, { screen, params });
      } else {
        navigation.navigate(tab);
      }
    };

    const list: Command[] = [
      // Acciones
      {
        id: 'pos',
        label: 'Vender',
        description: 'Abrir el punto de venta',
        icon: 'cart-outline',
        group: 'Acciones',
        shortcut: 'P',
        run: () => go('Vender'),
      },
      {
        id: 'new-product',
        label: 'Nuevo producto',
        description: 'Crear un producto en el catálogo',
        icon: 'plus-circle-outline',
        group: 'Acciones',
        adminOnly: true,
        run: () => go('Productos', 'ProductoForm'),
      },
      {
        id: 'new-client',
        label: 'Nuevo cliente',
        description: 'Registrar un cliente',
        icon: 'account-plus-outline',
        group: 'Acciones',
        run: () => go('Mas', 'ClienteForm'),
      },
      {
        id: 'new-sale',
        label: 'Ver ventas del día',
        description: 'Listado de ventas recientes',
        icon: 'receipt',
        group: 'Acciones',
        run: () => go('Ventas', 'VentasList'),
      },
      {
        id: 'open-cash',
        label: 'Caja',
        description: 'Estado del turno actual',
        icon: 'cash-register',
        group: 'Acciones',
        run: () => go('Mas', 'Caja'),
      },
      {
        id: 'inventory-movement',
        label: 'Registrar movimiento',
        description: 'Entrada o salida de inventario',
        icon: 'swap-horizontal',
        group: 'Acciones',
        adminOnly: true,
        run: () => go('Mas', 'MovimientoForm'),
      },

      // Ir a
      {
        id: 'goto-dashboard',
        label: 'Inicio',
        description: 'Panel principal',
        icon: 'home-variant-outline',
        group: 'Ir a',
        run: () => go('Inicio'),
      },
      {
        id: 'goto-products',
        label: 'Productos',
        description: 'Catálogo completo',
        icon: 'package-variant-closed',
        group: 'Ir a',
        run: () => go('Productos', 'ProductosList'),
      },
      {
        id: 'goto-sales',
        label: 'Ventas',
        description: 'Historial de transacciones',
        icon: 'cart-outline',
        group: 'Ir a',
        run: () => go('Ventas', 'VentasList'),
      },
      {
        id: 'goto-clients',
        label: 'Clientes',
        description: 'Cartera y estado de cuenta',
        icon: 'account-group-outline',
        group: 'Ir a',
        run: () => go('Mas', 'Clientes'),
      },
      {
        id: 'goto-inventory',
        label: 'Inventario',
        description: 'Movimientos y stock',
        icon: 'warehouse',
        group: 'Ir a',
        run: () => go('Mas', 'Inventario'),
      },
      {
        id: 'goto-reports',
        label: 'Reportes',
        description: 'Ventas, utilidades y cartera',
        icon: 'chart-line',
        group: 'Ir a',
        adminOnly: true,
        run: () => go('Mas', 'Reportes'),
      },

      // Configuración
      {
        id: 'toggle-theme',
        label: 'Cambiar tema',
        description: 'Alternar claro / oscuro',
        icon: 'theme-light-dark',
        group: 'Configuración',
        shortcut: 'T',
        run: () => {
          const isDark = useUIStore.getState().themeMode === 'dark';
          setThemeMode(isDark ? 'light' : 'dark');
          showToast(
            isDark ? 'Tema claro activado' : 'Tema oscuro activado',
            'success',
          );
        },
      },
      {
        id: 'open-settings',
        label: 'Configuración',
        description: 'Datos del negocio y preferencias',
        icon: 'cog-outline',
        group: 'Configuración',
        run: () => go('Mas', 'Configuracion'),
      },
      {
        id: 'open-help',
        label: 'Ayuda',
        description: 'Centro de ayuda',
        icon: 'help-circle-outline',
        group: 'Configuración',
        run: () => go('Mas', 'CentroAyuda'),
      },
      {
        id: 'logout',
        label: 'Cerrar sesión',
        description: 'Salir de tu cuenta',
        icon: 'logout',
        group: 'Configuración',
        run: async () => {
          await useAuthStore.getState().logout();
          showToast('Sesión cerrada.', 'success');
        },
      },
    ];

    return esAdmin ? list : list.filter((c) => !c.adminOnly);
  }, [navigation, esAdmin, setThemeMode, showToast]);
}